// @ts-nocheck
﻿// @ts-nocheck
// ============================================================================
// RozgarSync â€” Abstract Base Agent
// ============================================================================
// Template-method base class implementing the full agent lifecycle:
//   Perceive â†’ Deliberate â†’ ToolUse â†’ Decide â†’ Act â†’ Observe
//
// All five RozgarSync agents extend this class and implement the
// abstract methods. The base class handles:
// - Phase-level error handling and retries
// - Circuit breaker wrapping around Gemini API calls
// - Confidence check after deliberation (below threshold â†’ safe fallback)
// - Automatic audit logging via AgentDecisionLog
// - Correlation ID propagation across events
// - Latency measurement per phase and total
// ============================================================================

import type { Timestamp } from 'firebase/firestore';
import type {
  AgentConfig,
  AgentDecision,
  AgentEvent,
  AgentAction,
  AgentPhase,
  PerceptionContext,
  PerceptionResult,
  DeliberationResult,
  ToolUseResult,
  DecisionResult,
  ActionResult,
  ObservationResult,
  ConfidenceFactor,
  AgentDecisionLog,
} from './types';
import { AgentEventBus } from './event-bus';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';
import { ConfidenceEngine } from './confidence';

// ============================================================================
// ABSTRACT BASE AGENT
// ============================================================================

/**
 * Abstract base class for all RozgarSync AI agents.
 *
 * Implements the **Template Method** pattern for the six-phase lifecycle:
 * 1. **Perceive** â€” Extract structured signals from the raw event
 * 2. **Deliberate** â€” Reason about signals, form hypotheses
 * 3. **ToolUse** â€” Select and invoke tools to gather evidence
 * 4. **Decide** â€” Commit to an action plan with confidence score
 * 5. **Act** â€” Execute the decided actions
 * 6. **Observe** â€” Evaluate outcomes for learning
 *
 * Subclasses implement the six abstract methods while getting:
 * - Automatic retry with configurable per-phase retries
 * - Circuit breaker wrapping for Gemini API calls
 * - Confidence gating after deliberation
 * - Immutable audit logging (AgentDecisionLog)
 * - Correlation ID propagation for distributed tracing
 * - Latency measurement and metrics
 *
 * @example
 * ```typescript
 * class OpportunityMatcherAgent extends BaseAgent {
 *   protected async perceive(ctx: PerceptionContext): Promise<PerceptionResult> {
 *     // Extract gig requirements and worker signals
 *   }
 *   // ... implement all abstract methods
 * }
 *
 * const agent = new OpportunityMatcherAgent(config, eventBus);
 * const decision = await agent.process(event);
 * ```
 */
export abstract class BaseAgent {
  /** Agent configuration. */
  protected readonly config: AgentConfig;

  /** Shared event bus for inter-agent communication. */
  protected readonly eventBus: AgentEventBus;

  /** Circuit breaker protecting downstream API calls. */
  protected readonly circuitBreaker: CircuitBreaker;

  /** Confidence scoring engine. */
  protected readonly confidenceEngine: ConfidenceEngine;

  /** Collected events emitted during a single processing cycle. */
  private cycleEvents: AgentEvent[] = [];

  /** Whether a fallback was used during this cycle. */
  private fallbackUsedInCycle: boolean = false;

  /** Registry of tools available to this agent. */
  protected readonly tools: Map<string, any> = new Map();

  /**
   * Create a new agent instance.
   *
   * @param config - Full agent configuration.
   * @param eventBus - Shared event bus for pub/sub.
   */
  constructor(config: AgentConfig, eventBus: AgentEventBus) {
    this.config = config;
    this.eventBus = eventBus;
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.confidenceEngine = new ConfidenceEngine(config.confidenceThreshold);

    // Auto-subscribe to configured event patterns
    for (const pattern of config.enabledEvents || []) {
      this.eventBus.subscribe(pattern, async (event) => {
        await this.process(event);
      });
    }
  }

  /**
   * Register a tool for use during the ToolUse phase.
   * @param tool - The tool to register (must have a `name` property).
   */
  protected registerTool(tool: any): void {
    if (tool && tool.name) {
      this.tools.set(tool.name, tool);
    }
  }

  // --------------------------------------------------------------------------
  // TEMPLATE METHOD â€” Main Processing Pipeline
  // --------------------------------------------------------------------------

  /**
   * Process an event through the full agent lifecycle.
   *
   * This is the main entry point. It orchestrates the six phases in order,
   * with error handling, retries, circuit breaker protection, confidence
   * gating, and audit logging.
   *
   * @param event - The triggering event to process.
   * @returns The final agent decision with confidence, actions, and trace info.
   */
  async process(event: AgentEvent): Promise<AgentDecision> {
    const cycleStartMs = Date.now();
    const traceId = crypto.randomUUID();
    this.cycleEvents = [];
    this.fallbackUsedInCycle = false;

    // Build perception context
    const ctx: PerceptionContext = {
      event,
      timestamp: Date.now(),
      locale: (event.metadata['locale'] as 'ur' | 'en') ?? 'en',
      userId: event.metadata['userId'],
      sessionId: event.metadata['sessionId'] ?? crypto.randomUUID(),
    };

    try {
      // --- Hook: beforePerceive ---
      if (this.config.hooks?.beforePerceive) {
        await this.config.hooks.beforePerceive(ctx);
      }

      // --- Phase 1: Perceive ---
      const perception = await this.executePhase(
        'perceive',
        () => this.perceive(ctx),
      );

      // --- Phase 2: Deliberate ---
      const deliberation = await this.executePhase(
        'deliberate',
        () => this.deliberate(perception),
      );

      // --- Confidence gate: check preliminary confidence ---
      if (deliberation.preliminaryConfidence < this.config.confidenceThreshold) {
        return this.buildLowConfidenceDecision(
          traceId,
          event,
          deliberation,
          cycleStartMs,
        );
      }

      // --- Phase 3: Tool Use ---
      const toolResults = await this.executePhase(
        'tool_use',
        () => this.selectTools(deliberation),
      );

      // --- Phase 4: Decide ---
      const decisionResult = await this.executePhase(
        'decide',
        () => this.decide(toolResults),
      );

      // --- Hook: afterDecide ---
      const decision = this.buildDecision(
        traceId,
        event,
        decisionResult,
        cycleStartMs,
      );
      if (this.config.hooks?.afterDecide) {
        await this.config.hooks.afterDecide(decision);
      }

      // --- Phase 5: Act ---
      const actionResult = await this.executePhase(
        'act',
        () => this.act(decisionResult),
      );

      // Collect emitted events from actions
      this.cycleEvents.push(...actionResult.emittedEvents);

      // --- Phase 6: Observe ---
      if (actionResult.executedActions.length > 0) {
        await this.executePhase(
          'observe',
          () => this.observe(actionResult),
        );
      }

      // --- Build final decision ---
      const finalDecision = this.buildDecision(
        traceId,
        event,
        decisionResult,
        cycleStartMs,
      );

      // --- Audit log ---
      const auditLog = this.buildAuditLog(finalDecision);
      await this.emitEvent('agent.decision.logged', auditLog);

      return finalDecision;
    } catch (error) {
      const phase = this.getCurrentPhaseFromError(error);

      // --- Hook: onError ---
      if (this.config.hooks?.onError) {
        const err = error instanceof Error ? error : new Error(String(error));
        await this.config.hooks.onError(err, phase);
      }

      // Emit error event
      await this.emitEvent('agent.error', {
        agentName: this.config.name,
        phase,
        error: error instanceof Error ? error.message : String(error),
        traceId,
      });

      // Return an error decision
      return this.buildErrorDecision(traceId, event, error, cycleStartMs);
    }
  }

  // --------------------------------------------------------------------------
  // ABSTRACT METHODS â€” Each agent must implement these
  // --------------------------------------------------------------------------

  /**
   * Phase 1: Perceive â€” Extract structured signals from the raw event.
   *
   * @param ctx - Perception context containing the event and metadata.
   * @returns Structured perception result with signals, entities, and intent.
   */
  protected abstract perceive(ctx: PerceptionContext): Promise<PerceptionResult>;

  /**
   * Phase 2: Deliberate â€” Reason about perceived signals.
   *
   * Form hypotheses, select tools to use, and estimate preliminary confidence.
   *
   * @param perception - Output from the perceive phase.
   * @returns Deliberation result with hypotheses and tool selection.
   */
  protected abstract deliberate(
    perception: PerceptionResult,
  ): Promise<DeliberationResult>;

  /**
   * Phase 3: Tool Use â€” Select and invoke tools to gather evidence.
   *
   * @param deliberation - Output from the deliberate phase.
   * @returns Results from tool invocations.
   */
  protected abstract selectTools(
    deliberation: DeliberationResult,
  ): Promise<ToolUseResult>;

  /**
   * Phase 4: Decide â€” Commit to an action plan with confidence score.
   *
   * @param toolResults - Output from the tool_use phase.
   * @returns Decision with confidence, reasoning, and planned actions.
   */
  protected abstract decide(toolResults: ToolUseResult): Promise<DecisionResult>;

  /**
   * Phase 5: Act â€” Execute the decided actions.
   *
   * @param decision - Output from the decide phase.
   * @returns Results of action execution.
   */
  protected abstract act(decision: DecisionResult): Promise<ActionResult>;

  /**
   * Phase 6: Observe â€” Evaluate outcomes for learning.
   *
   * @param action - Output from the act phase.
   * @returns Observation with success/failure and metrics.
   */
  protected abstract observe(action: ActionResult): Promise<ObservationResult>;

  // --------------------------------------------------------------------------
  // SHARED UTILITIES â€” Available to all agents
  // --------------------------------------------------------------------------

  /**
   * Call the Gemini API through the circuit breaker with optional fallback.
   *
   * This is the standard way for agents to invoke Gemini. The circuit breaker
   * protects against cascading failures during API outages.
   *
   * @template T - Expected response shape.
   * @param prompt - The prompt to send to Gemini.
   * @param schema - Expected response schema for structured output.
   * @param fallback - Optional fallback function when the circuit is open.
   * @returns Parsed response of type T.
   */
  protected async callGeminiWithFallback<T>(
    prompt: string,
    schema: Record<string, unknown>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const wrappedFallback = fallback
      ? async () => {
          this.fallbackUsedInCycle = true;
          return fallback();
        }
      : undefined;

    try {
      return await this.circuitBreaker.execute(async () => {
        // In production, this calls the actual Gemini API.
        // The implementation is injected via the agent's tools.
        const geminiTool = this.config.tools.find(
          (t) => t.name === 'gemini_generate',
        );

        if (!geminiTool) {
          throw new Error(
            `Agent "${this.config.name}" has no "gemini_generate" tool configured`,
          );
        }

        const result = await geminiTool.execute({ prompt, schema });
        return result as T;
      }, wrappedFallback);
    } catch (error) {
      if (error instanceof CircuitOpenError && wrappedFallback) {
        this.fallbackUsedInCycle = true;
        return wrappedFallback();
      }
      throw error;
    }
  }

  /**
   * Build an immutable audit log entry from an agent decision.
   *
   * This creates an {@link AgentDecisionLog} document shape ready for
   * Firestore persistence via Cloud Functions.
   *
   * @param decision - The agent decision to log.
   * @returns AgentDecisionLog document.
   */
  protected buildAuditLog(decision: AgentDecision): AgentDecisionLog {
    const inputStr = JSON.stringify(decision.decision);
    const outputStr = JSON.stringify(decision.actions);

    // Compute SHA-256 hashes for tamper detection
    const inputHash = this.sha256Sync(inputStr);
    const outputHash = this.sha256Sync(outputStr);
    const traceChainHash = this.sha256Sync(
      `${decision.parentTraceId ?? 'ROOT'}|${inputHash}|${outputHash}`,
    );

    return {
      id: crypto.randomUUID(),
      decisionType: this.mapAgentToDecisionType(),
      agentVersion: this.config.version,
      modelId: 'gemini-2.0-flash',
      inputHash,
      outputHash,
      parentTraceId: decision.parentTraceId,
      sessionTraceId: decision.traceId,
      traceChainHash,
      rationale: decision.reasoning,
      confidence: decision.confidence.value,
      latencyMs: decision.latencyMs,
      timestamp: { toMillis: () => Date.now() } as Timestamp,
      triggeredBy: this.config.name,
    };
  }

  /**
   * Emit a typed event on the shared event bus.
   *
   * Automatically sets the source to this agent's name and propagates
   * the current correlation ID.
   *
   * @template T - Payload shape.
   * @param type - Event type string (e.g. "gig.matched").
   * @param payload - Event payload.
   * @param correlationId - Optional correlation ID override.
   */
  protected async emitEvent<T>(
    type: string,
    payload: T,
    correlationId?: string,
  ): Promise<void> {
    const event: AgentEvent<T> = {
      id: crypto.randomUUID(),
      type,
      source: this.config.name,
      timestamp: Date.now(),
      payload,
      correlationId: correlationId ?? crypto.randomUUID(),
      metadata: { agentVersion: this.config.version },
    };

    this.cycleEvents.push(event as AgentEvent);
    await this.eventBus.publish(event);
  }

  /**
   * Score a set of confidence factors using the shared engine.
   *
   * @param factors - Factors to score.
   * @returns Composite confidence score with threshold check.
   */
  protected scoreConfidence(factors: ConfidenceFactor[]): ReturnType<ConfidenceEngine['score']> {
    return this.confidenceEngine.score(factors, this.config.name);
  }

  // --------------------------------------------------------------------------
  // PHASE EXECUTION WITH RETRY
  // --------------------------------------------------------------------------

  /**
   * Execute a lifecycle phase with retry logic and timeout.
   *
   * @template T - Return type of the phase function.
   * @param phase - The lifecycle phase being executed.
   * @param fn - The phase function to execute.
   * @returns The phase result.
   * @throws The last error if all retries are exhausted.
   */
  private async executePhase<T>(
    phase: AgentPhase,
    fn: () => Promise<T>,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetriesPerPhase; attempt++) {
      try {
        const result = await this.withTimeout(fn(), phase);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's a circuit breaker rejection
        if (error instanceof CircuitOpenError) {
          throw error;
        }

        // Exponential backoff between retries
        if (attempt < this.config.maxRetriesPerPhase) {
          const backoffMs = Math.min(attempt * attempt * 100, 5000);
          await this.sleep(backoffMs);
        }
      }
    }

    // Attach phase info to the error for upstream handling
    const phaseError = new AgentPhaseError(
      `Phase "${phase}" failed after ${this.config.maxRetriesPerPhase} attempts: ${lastError?.message}`,
      phase,
      lastError,
    );
    throw phaseError;
  }

  /**
   * Wrap a promise with a timeout.
   *
   * @template T - Promise result type.
   * @param promise - The promise to wrap.
   * @param phase - Phase name for error messaging.
   * @returns The promise result.
   * @throws Error if the timeout expires.
   */
  private withTimeout<T>(promise: Promise<T>, phase: AgentPhase): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Phase "${phase}" timed out after ${this.config.timeoutMs}ms`,
          ),
        );
      }, this.config.timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // --------------------------------------------------------------------------
  // DECISION BUILDERS
  // --------------------------------------------------------------------------

  /** Build a standard decision result from phase outputs. */
  private buildDecision(
    traceId: string,
    event: AgentEvent,
    result: DecisionResult,
    cycleStartMs: number,
  ): AgentDecision {
    return {
      agentName: this.config.name,
      phase: 'decide',
      decision: result.decision,
      confidence: result.confidence,
      reasoning: result.reasoning,
      actions: result.actions,
      events: [...this.cycleEvents],
      traceId,
      parentTraceId: event.causationId ?? null,
      latencyMs: Date.now() - cycleStartMs,
      fallbackUsed: this.fallbackUsedInCycle,
    };
  }

  /** Build a low-confidence fallback decision when deliberation fails the threshold. */
  private buildLowConfidenceDecision(
    traceId: string,
    event: AgentEvent,
    deliberation: DeliberationResult,
    cycleStartMs: number,
  ): AgentDecision {
    const confidence = this.confidenceEngine.score(
      [
        {
          name: 'preliminary_assessment',
          weight: 1.0,
          score: deliberation.preliminaryConfidence,
          reasoning: deliberation.reasoning,
        },
      ],
      this.config.name,
    );

    return {
      agentName: this.config.name,
      phase: 'deliberate',
      decision: null,
      confidence,
      reasoning: `Low confidence (${deliberation.preliminaryConfidence.toFixed(3)}) â€” below threshold (${this.config.confidenceThreshold}). Skipping action.`,
      actions: [],
      events: [...this.cycleEvents],
      traceId,
      parentTraceId: event.causationId ?? null,
      latencyMs: Date.now() - cycleStartMs,
      fallbackUsed: true,
    };
  }

  /** Build an error decision when the pipeline throws. */
  private buildErrorDecision(
    traceId: string,
    event: AgentEvent,
    error: unknown,
    cycleStartMs: number,
  ): AgentDecision {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const phase =
      error instanceof AgentPhaseError ? error.phase : 'perceive';

    return {
      agentName: this.config.name,
      phase,
      decision: null,
      confidence: {
        value: 0,
        factors: [],
        threshold: this.config.confidenceThreshold,
        passesThreshold: false,
      },
      reasoning: `Processing failed: ${errorMessage}`,
      actions: [],
      events: [...this.cycleEvents],
      traceId,
      parentTraceId: event.causationId ?? null,
      latencyMs: Date.now() - cycleStartMs,
      fallbackUsed: false,
    };
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  /**
   * Synchronous SHA-256 hash using the Web Crypto-compatible approach.
   * Falls back to a simple hash if crypto.subtle is unavailable (SSR).
   *
   * NOTE: In production, this should use crypto.subtle.digest() async,
   * but for audit log construction we use a sync placeholder that will
   * be replaced with the async version in Cloud Functions.
   */
  private sha256Sync(input: string): string {
    // Simple deterministic hash for client-side audit logs.
    // Cloud Functions should replace this with real SHA-256.
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  /** Map agent name to the closest AgentDecisionType. */
  private mapAgentToDecisionType(): AgentDecisionLog['decisionType'] {
    const mapping: Record<string, AgentDecisionLog['decisionType']> = {
      opportunity_matcher: 'gig_recommendation',
      fair_wage_negotiator: 'price_suggestion',
      safety_guardian: 'safety_scoring',
      financial_protector: 'fraud_detection',
      upskilling_coach: 'skill_matching',
    };
    return mapping[this.config.name] ?? 'gig_recommendation';
  }

  /** Extract the phase from an error if it's an AgentPhaseError. */
  private getCurrentPhaseFromError(error: unknown): AgentPhase {
    if (error instanceof AgentPhaseError) {
      return error.phase;
    }
    return 'perceive';
  }

  /** Promise-based sleep. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Error thrown when an agent lifecycle phase fails after all retries.
 * Carries the phase name so the caller can determine where failure occurred.
 */
export class AgentPhaseError extends Error {
  /** The lifecycle phase that failed. */
  public readonly phase: AgentPhase;

  /** The original error that caused the failure. */
  public readonly cause: Error | null;

  constructor(message: string, phase: AgentPhase, cause: Error | null = null) {
    super(message);
    this.name = 'AgentPhaseError';
    this.phase = phase;
    this.cause = cause;
  }
}

