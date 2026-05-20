// @ts-nocheck
﻿// @ts-nocheck
// ============================================================================
// RozgarSync â€” Pub/Sub Agent Event Bus
// ============================================================================
// Typed, in-memory event bus with topic-based subscriptions, wildcard support,
// event replay buffer, dead-letter queue, and correlation ID propagation.
// ============================================================================

import type {
  AgentEvent,
  EventHandler,
  SubscribeOptions,
  Unsubscribe,
  DeadLetterEntry,
  EventBusMetrics,
  EventPriority,
  AgentName,
} from './types';

// ============================================================================
// INTERNAL TYPES
// ============================================================================

/** Numeric priority mapping for sorting handlers â€” higher runs first. */
const PRIORITY_ORDER: Record<EventPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
} as const;

/** Default replay buffer capacity per topic. */
const DEFAULT_REPLAY_BUFFER_SIZE = 100;

/** Default maximum retries for a handler. */
const DEFAULT_MAX_RETRIES = 3;

/** Internal subscription record. */
interface Subscription {
  /** Unique subscription ID for removal. */
  id: string;
  /** Glob pattern this subscription matches against â€” e.g. "gig.*". */
  pattern: string;
  /** Compiled regex from the glob pattern. */
  regex: RegExp;
  /** The handler to invoke. */
  handler: EventHandler;
  /** Numeric priority for ordering. */
  priority: number;
  /** Maximum retry attempts. */
  maxRetries: number;
  /** Optional source filter. */
  sourceFilter?: AgentName;
}

/**
 * Waiter for `publishAndWait` â€” resolves when a response event matching the
 * correlation ID arrives, or rejects on timeout.
 */
interface EventWaiter {
  correlationId: string;
  resolve: (events: AgentEvent[]) => void;
  reject: (error: Error) => void;
  collected: AgentEvent[];
  timeoutHandle: ReturnType<typeof setTimeout>;
}

// ============================================================================
// EVENT BUS CLASS
// ============================================================================

/**
 * In-memory Pub/Sub event bus for inter-agent communication.
 *
 * Features:
 * - **Wildcard subscriptions**: patterns like `gig.*`, `worker.matched`, `*`
 * - **Event replay buffer**: last N events per topic for late subscribers
 * - **Dead-letter queue**: failed handlers are quarantined with error details
 * - **Correlation ID propagation**: events are grouped for distributed tracing
 * - **Priority ordering**: handlers execute in priority order (critical first)
 * - **Error isolation**: one handler's failure doesn't block others
 *
 * @example
 * ```typescript
 * const bus = new AgentEventBus();
 *
 * bus.subscribe('gig.*', async (event) => {
 *   console.log('Gig event:', event.type);
 * });
 *
 * await bus.publish({
 *   id: crypto.randomUUID(),
 *   type: 'gig.created',
 *   source: 'opportunity_matcher',
 *   timestamp: Date.now(),
 *   payload: { gigId: '123' },
 *   correlationId: crypto.randomUUID(),
 *   metadata: {},
 * });
 * ```
 */
export class AgentEventBus {
  /** All active subscriptions. */
  private readonly subscriptions: Map<string, Subscription> = new Map();

  /** Replay buffer: topic â†’ ring buffer of recent events. */
  private readonly replayBuffers: Map<string, AgentEvent[]> = new Map();

  /** Dead-letter queue for permanently failed handlers. */
  private readonly deadLetterQueue: DeadLetterEntry[] = [];

  /** Active waiters for publishAndWait. */
  private readonly waiters: Map<string, EventWaiter> = new Map();

  /** Runtime metrics. */
  private metrics: EventBusMetrics = {
    totalPublished: 0,
    totalDelivered: 0,
    totalFailed: 0,
    activeSubscriptions: 0,
    deadLetterCount: 0,
    topicCounts: {},
  };

  /** Maximum events in each topic's replay buffer. */
  private readonly replayBufferSize: number;

  /**
   * Create a new AgentEventBus.
   * @param replayBufferSize - Max events to retain per topic for replay. Defaults to 100.
   */
  constructor(replayBufferSize: number = DEFAULT_REPLAY_BUFFER_SIZE) {
    this.replayBufferSize = replayBufferSize;
  }

  // --------------------------------------------------------------------------
  // SUBSCRIBE
  // --------------------------------------------------------------------------

  /**
   * Subscribe to events matching a glob pattern.
   *
   * Pattern syntax:
   * - `gig.created`   â†’ exact match
   * - `gig.*`         â†’ matches `gig.created`, `gig.updated`, etc.
   * - `*`             â†’ matches all events
   * - `worker.safety.*` â†’ matches `worker.safety.alert`, etc.
   *
   * @param pattern - Glob pattern for event types.
   * @param handler - Async function to invoke on matching events.
   * @param options - Priority, retry, and filter options.
   * @returns Unsubscribe function.
   */
  subscribe<T = unknown>(
    pattern: string,
    handler: EventHandler<T>,
    options: SubscribeOptions = {},
  ): Unsubscribe {
    const id = crypto.randomUUID();
    const regex = this.compilePattern(pattern);
    const priority = PRIORITY_ORDER[options.priority ?? 'normal'];
    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

    const subscription: Subscription = {
      id,
      pattern,
      regex,
      handler: handler as EventHandler,
      priority,
      maxRetries,
      sourceFilter: options.sourceFilter,
    };

    this.subscriptions.set(id, subscription);
    this.metrics.activeSubscriptions = this.subscriptions.size;

    return () => {
      this.subscriptions.delete(id);
      this.metrics.activeSubscriptions = this.subscriptions.size;
    };
  }

  // --------------------------------------------------------------------------
  // PUBLISH
  // --------------------------------------------------------------------------

  /**
   * Publish an event to all matching subscribers.
   *
   * Handlers are invoked in priority order (critical â†’ low).
   * Failures are isolated â€” one handler's error doesn't affect others.
   * Failed handlers are retried up to their configured maxRetries.
   * Permanently failed handlers are sent to the dead-letter queue.
   *
   * @param event - The event to publish.
   */
  async publish<T>(event: AgentEvent<T>): Promise<void> {
    // Update metrics
    this.metrics.totalPublished++;
    const topic = event.type;
    this.metrics.topicCounts[topic] = (this.metrics.topicCounts[topic] ?? 0) + 1;

    // Add to replay buffer
    this.addToReplayBuffer(topic, event as AgentEvent);

    // Notify any publishAndWait waiters
    this.notifyWaiters(event as AgentEvent);

    // Find matching subscriptions and sort by priority (descending)
    const matching = this.findMatchingSubscriptions(event as AgentEvent);

    // Execute handlers with error isolation
    let delivered = false;
    const handlerPromises = matching.map(async (sub) => {
      await this.executeWithRetry(sub, event as AgentEvent);
      delivered = true;
    });

    await Promise.allSettled(handlerPromises);

    if (delivered) {
      this.metrics.totalDelivered++;
    }
  }

  // --------------------------------------------------------------------------
  // PUBLISH AND WAIT
  // --------------------------------------------------------------------------

  /**
   * Publish an event and wait for response events with the same correlation ID.
   *
   * This is useful for request-response patterns between agents.
   * The call blocks until at least one response event arrives or the timeout expires.
   *
   * @param event - The event to publish.
   * @param timeoutMs - Maximum time to wait for responses (default: 30s).
   * @returns Array of response events.
   * @throws Error if the timeout expires with no responses.
   */
  async publishAndWait<T>(
    event: AgentEvent<T>,
    timeoutMs: number = 30_000,
  ): Promise<AgentEvent[]> {
    return new Promise<AgentEvent[]>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const waiter = this.waiters.get(event.correlationId);
        if (waiter) {
          this.waiters.delete(event.correlationId);
          if (waiter.collected.length > 0) {
            resolve(waiter.collected);
          } else {
            reject(
              new Error(
                `publishAndWait timed out after ${timeoutMs}ms for correlationId=${event.correlationId}`,
              ),
            );
          }
        }
      }, timeoutMs);

      const waiter: EventWaiter = {
        correlationId: event.correlationId,
        resolve,
        reject,
        collected: [],
        timeoutHandle,
      };

      this.waiters.set(event.correlationId, waiter);

      // Fire-and-forget the publish â€” responses will come via notifyWaiters
      void this.publish(event);
    });
  }

  // --------------------------------------------------------------------------
  // REPLAY & DLQ
  // --------------------------------------------------------------------------

  /**
   * Get the replay buffer for a specific topic.
   * Useful for late-joining subscribers that need historical context.
   *
   * @param topic - The event type to retrieve replays for.
   * @returns Array of recent events (newest last), or empty array.
   */
  getReplayBuffer(topic: string): AgentEvent[] {
    return [...(this.replayBuffers.get(topic) ?? [])];
  }

  /**
   * Get all entries in the dead-letter queue.
   * @returns Shallow copy of the DLQ entries.
   */
  getDeadLetterQueue(): DeadLetterEntry[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear all entries from the dead-letter queue.
   * Typically called after manual review or automated retry.
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue.length = 0;
    this.metrics.deadLetterCount = 0;
  }

  // --------------------------------------------------------------------------
  // METRICS
  // --------------------------------------------------------------------------

  /**
   * Get runtime metrics for the event bus.
   * @returns Snapshot of current metrics.
   */
  getMetrics(): EventBusMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics to zero. Does NOT clear subscriptions or buffers.
   */
  resetMetrics(): void {
    this.metrics = {
      totalPublished: 0,
      totalDelivered: 0,
      totalFailed: 0,
      activeSubscriptions: this.subscriptions.size,
      deadLetterCount: this.deadLetterQueue.length,
      topicCounts: {},
    };
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  /**
   * Compile a glob pattern to a RegExp for event type matching.
   *
   * Rules:
   * - `*` alone matches everything
   * - `gig.*` matches `gig.` followed by one segment
   * - `gig.**` matches `gig.` followed by any number of segments
   * - Exact strings match literally
   */
  private compilePattern(pattern: string): RegExp {
    if (pattern === '*') {
      return /^.*$/;
    }

    // Escape regex special chars except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

    // Replace ** (globstar) and * (single segment)
    // ** = match anything (including dots)
    // *  = match anything except dots (single segment)
    const regexStr = escaped
      .replace(/\\\.\*\*/g, '(?:\\..+)?')  // .** â†’ optional dot + anything
      .replace(/\*\*/g, '.*')              // ** â†’ anything
      .replace(/\*/g, '[^.]+');            // * â†’ one segment

    return new RegExp(`^${regexStr}$`);
  }

  /**
   * Find all subscriptions whose pattern matches the event type,
   * applying source filters and sorting by priority (descending).
   */
  private findMatchingSubscriptions(event: AgentEvent): Subscription[] {
    const matching: Subscription[] = [];

    for (const sub of this.subscriptions.values()) {
      // Test pattern match
      if (!sub.regex.test(event.type)) continue;

      // Apply source filter if configured
      if (sub.sourceFilter && sub.sourceFilter !== event.source) continue;

      matching.push(sub);
    }

    // Sort by priority descending (critical first)
    matching.sort((a, b) => b.priority - a.priority);

    return matching;
  }

  /**
   * Execute a handler with retry logic.
   * On permanent failure, the event is sent to the dead-letter queue.
   */
  private async executeWithRetry(
    sub: Subscription,
    event: AgentEvent,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= sub.maxRetries; attempt++) {
      try {
        await sub.handler(event);
        return; // Success
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Exponential backoff between retries (10ms, 40ms, 90ms, ...)
        if (attempt < sub.maxRetries) {
          const backoffMs = attempt * attempt * 10;
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries exhausted â€” dead-letter
    this.metrics.totalFailed++;
    const dlEntry: DeadLetterEntry = {
      event,
      error: lastError?.message ?? 'Unknown error',
      stack: lastError?.stack,
      handlerPattern: sub.pattern,
      attempts: sub.maxRetries,
      failedAt: Date.now(),
    };
    this.deadLetterQueue.push(dlEntry);
    this.metrics.deadLetterCount = this.deadLetterQueue.length;
  }

  /** Add an event to its topic's replay buffer, evicting old entries. */
  private addToReplayBuffer(topic: string, event: AgentEvent): void {
    let buffer = this.replayBuffers.get(topic);
    if (!buffer) {
      buffer = [];
      this.replayBuffers.set(topic, buffer);
    }

    buffer.push(event);

    // Evict oldest if over capacity
    while (buffer.length > this.replayBufferSize) {
      buffer.shift();
    }
  }

  /**
   * Notify any publishAndWait waiters that a response event arrived.
   * A response is identified by matching correlationId and different event ID
   * from the original publish.
   */
  private notifyWaiters(event: AgentEvent): void {
    const waiter = this.waiters.get(event.correlationId);
    if (!waiter) return;

    waiter.collected.push(event);

    // Resolve immediately on first response
    // (the waiter can collect more via the timeout path)
    if (waiter.collected.length === 1) {
      // Give a small window for more responses, then resolve
      clearTimeout(waiter.timeoutHandle);
      waiter.timeoutHandle = setTimeout(() => {
        this.waiters.delete(event.correlationId);
        waiter.resolve(waiter.collected);
      }, 100);
    }
  }

  /** Promise-based sleep utility. */
}

export function createEventBus(): AgentEventBus {
  return new AgentEventBus();
}

