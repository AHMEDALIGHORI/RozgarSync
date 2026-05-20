// ============================================================================
// RozgarSync — Circuit Breaker
// ============================================================================
// Production circuit breaker with three states (closed, open, half-open),
// sliding window failure counting, fallback support, and metrics.
// Protects agents from cascading failures (e.g. Gemini API outages).
// ============================================================================

import type {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
} from './types';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Thrown when the circuit is open and calls are being rejected.
 * Callers should catch this specifically to invoke fallback logic.
 */
export class CircuitOpenError extends Error {
  /** Timestamp (ms) when the circuit will transition to half-open. */
  public readonly retryAfter: number;

  constructor(retryAfter: number) {
    super(
      `Circuit breaker is OPEN. Retry after ${new Date(retryAfter).toISOString()}`,
    );
    this.name = 'CircuitOpenError';
    this.retryAfter = retryAfter;
  }
}

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

/**
 * Circuit breaker pattern implementation for protecting agent pipelines
 * from downstream service failures (Gemini API, Firestore, etc.).
 *
 * State machine:
 * ```
 *   CLOSED ──(failures ≥ threshold)──→ OPEN
 *   OPEN   ──(resetTimeout elapsed)──→ HALF_OPEN
 *   HALF_OPEN ──(success)────────────→ CLOSED
 *   HALF_OPEN ──(failure)────────────→ OPEN
 * ```
 *
 * Features:
 * - **Sliding window** failure counting (only recent failures matter)
 * - **Fallback function** support for graceful degradation
 * - **Half-open testing** with configurable max attempts
 * - **State change callbacks** via an optional listener
 * - **Comprehensive metrics** for monitoring dashboards
 *
 * @example
 * ```typescript
 * const cb = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeoutMs: 30_000,
 *   halfOpenMaxAttempts: 3,
 *   monitorWindowMs: 60_000,
 * });
 *
 * const result = await cb.execute(
 *   () => callGeminiAPI(prompt),
 *   () => getCachedFallback(prompt),
 * );
 * ```
 */
export class CircuitBreaker {
  /** Current circuit state. */
  private state: CircuitState = 'closed';

  /** Configuration. */
  private readonly config: CircuitBreakerConfig;

  /** Timestamps (ms) of recent failures within the monitoring window. */
  private readonly failureTimestamps: number[] = [];

  /** When the circuit transitioned to open — used for reset timeout. */
  private openedAt: number = 0;

  /** Consecutive successes in half-open state. */
  private halfOpenSuccessCount: number = 0;

  /** Optional listener for state changes. */
  private stateChangeListener:
    | ((from: CircuitState, to: CircuitState) => void)
    | null = null;

  // Metrics
  private totalCalls: number = 0;
  private successfulCalls: number = 0;
  private failedCalls: number = 0;
  private rejectedCalls: number = 0;
  private stateTransitions: number = 0;
  private lastFailureTime: number | null = null;
  private lastStateChangeTime: number = Date.now();

  /**
   * Create a new CircuitBreaker.
   *
   * @param config - Circuit breaker configuration.
   */
  constructor(config: CircuitBreakerConfig) {
    this.config = { ...config };
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  /**
   * Execute a function through the circuit breaker.
   *
   * - **Closed**: execute normally; track failures.
   * - **Open**: reject immediately (or invoke fallback).
   * - **Half-open**: allow limited test calls.
   *
   * @template T - Return type of the protected function.
   * @param fn - The function to protect.
   * @param fallback - Optional fallback function when the circuit is open.
   * @returns The result from `fn` or `fallback`.
   * @throws {CircuitOpenError} If open and no fallback provided.
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    this.totalCalls++;

    // Prune expired failures from the sliding window
    this.pruneFailureWindow();

    switch (this.state) {
      case 'closed':
        return this.executeClosed(fn);

      case 'open':
        return this.executeOpen(fn, fallback);

      case 'half_open':
        return this.executeHalfOpen(fn, fallback);
    }
  }

  /**
   * Get the current circuit state.
   * @returns The current CircuitState.
   */
  getState(): CircuitState {
    // Check for automatic transition from open → half-open
    if (this.state === 'open' && this.shouldTransitionToHalfOpen()) {
      this.transitionTo('half_open');
    }
    return this.state;
  }

  /**
   * Get comprehensive runtime metrics.
   * @returns Snapshot of current metrics.
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      totalCalls: this.totalCalls,
      successfulCalls: this.successfulCalls,
      failedCalls: this.failedCalls,
      rejectedCalls: this.rejectedCalls,
      stateTransitions: this.stateTransitions,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime,
      halfOpenSuccesses: this.halfOpenSuccessCount,
    };
  }

  /**
   * Manually reset the circuit to closed state.
   * Clears all failure history and resets half-open counters.
   */
  reset(): void {
    this.failureTimestamps.length = 0;
    this.halfOpenSuccessCount = 0;
    if (this.state !== 'closed') {
      this.transitionTo('closed');
    }
  }

  /**
   * Register a listener for state change events.
   * Only one listener is supported — calling again replaces the previous one.
   *
   * @param listener - Callback invoked on every state transition.
   */
  onStateChange(
    listener: (from: CircuitState, to: CircuitState) => void,
  ): void {
    this.stateChangeListener = listener;
  }

  // --------------------------------------------------------------------------
  // STATE HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Execute in closed state — normal operation.
   * Track failures and trip the circuit if threshold is exceeded.
   */
  private async executeClosed<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      // Check if we should trip the circuit
      if (this.failureTimestamps.length >= this.config.failureThreshold) {
        this.transitionTo('open');
      }

      throw error;
    }
  }

  /**
   * Execute in open state — reject or fallback.
   * Automatically transitions to half-open if the reset timeout has elapsed.
   */
  private async executeOpen<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    // Check if enough time has passed to try half-open
    if (this.shouldTransitionToHalfOpen()) {
      this.transitionTo('half_open');
      return this.executeHalfOpen(fn, fallback);
    }

    // Circuit is still open — reject
    this.rejectedCalls++;

    if (fallback) {
      return fallback();
    }

    throw new CircuitOpenError(this.openedAt + this.config.resetTimeoutMs);
  }

  /**
   * Execute in half-open state — limited test calls.
   * Success → eventually close; failure → re-open immediately.
   */
  private async executeHalfOpen<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    try {
      const result = await fn();
      this.onSuccess();
      this.halfOpenSuccessCount++;

      // If enough consecutive successes, close the circuit
      if (this.halfOpenSuccessCount >= this.config.halfOpenMaxAttempts) {
        this.transitionTo('closed');
      }

      return result;
    } catch (error) {
      this.onFailure();
      // Any failure in half-open → back to open
      this.transitionTo('open');

      if (fallback) {
        return fallback();
      }

      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // STATE MACHINE
  // --------------------------------------------------------------------------

  /** Transition to a new state, firing the listener and updating metrics. */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;
    this.stateTransitions++;
    this.lastStateChangeTime = Date.now();

    // State-specific resets
    switch (newState) {
      case 'open':
        this.openedAt = Date.now();
        this.halfOpenSuccessCount = 0;
        break;
      case 'half_open':
        this.halfOpenSuccessCount = 0;
        break;
      case 'closed':
        this.failureTimestamps.length = 0;
        this.halfOpenSuccessCount = 0;
        break;
    }

    // Notify listener
    if (this.stateChangeListener) {
      try {
        this.stateChangeListener(oldState, newState);
      } catch {
        // Listener errors must not affect circuit breaker operation
      }
    }
  }

  /** Check if the reset timeout has elapsed since the circuit opened. */
  private shouldTransitionToHalfOpen(): boolean {
    return Date.now() - this.openedAt >= this.config.resetTimeoutMs;
  }

  // --------------------------------------------------------------------------
  // FAILURE TRACKING
  // --------------------------------------------------------------------------

  /** Record a successful call. */
  private onSuccess(): void {
    this.successfulCalls++;
  }

  /** Record a failed call and add it to the sliding window. */
  private onFailure(): void {
    this.failedCalls++;
    this.lastFailureTime = Date.now();
    this.failureTimestamps.push(Date.now());
  }

  /**
   * Remove failure timestamps that have fallen outside the monitoring window.
   * This ensures only recent failures count towards the threshold.
   */
  private pruneFailureWindow(): void {
    const cutoff = Date.now() - this.config.monitorWindowMs;
    while (
      this.failureTimestamps.length > 0 &&
      (this.failureTimestamps[0] ?? cutoff) < cutoff
    ) {
      this.failureTimestamps.shift();
    }
  }
}
