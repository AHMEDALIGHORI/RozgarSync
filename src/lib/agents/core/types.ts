// ============================================================================
// RozgarSync — Agent Framework Type System
// ============================================================================
// Single source of truth for all agent-related types.
// Every agent module imports from this file.
// ============================================================================

import type { AgentDecisionLog } from '@/types';

export const generateId = () => crypto.randomUUID();
export const nowISO = () => new Date().toISOString();

// ============================================================================
// 1. AGENT IDENTITY & LIFECYCLE
// ============================================================================

/**
 * Ordered phases in the agent reasoning lifecycle.
 * Each phase maps to an abstract method in BaseAgent.
 *
 * perceive   → ingest raw event, extract structured signals
 * deliberate → reason about signals, form hypotheses
 * tool_use   → select and invoke tools to gather data
 * decide     → commit to an action plan with confidence score
 * act        → execute the chosen actions
 * observe    → evaluate outcomes, feed back into learning
 */
export type AgentPhase =
  | 'perceive'
  | 'deliberate'
  | 'tool_use'
  | 'decide'
  | 'act'
  | 'observe';

/** All phases in execution order — used by the template-method runner. */
export const AGENT_PHASES: readonly AgentPhase[] = [
  'perceive',
  'deliberate',
  'tool_use',
  'decide',
  'act',
  'observe',
] as const;

/**
 * Canonical names for the five RozgarSync AI agents.
 * Used as discriminator keys in routing, logging, and config lookup.
 */
export type AgentName =
  | 'opportunity_matcher'
  | 'fair_wage_negotiator'
  | 'safety_guardian'
  | 'financial_protector'
  | 'upskilling_coach';

// ============================================================================
// 2. CONFIDENCE SCORING
// ============================================================================

/**
 * A single factor contributing to an agent's confidence in its decision.
 * Factors are composed by the ConfidenceEngine into a ConfidenceScore.
 */
export interface ConfidenceFactor {
  /** Human-readable factor name — e.g. "skill_match_quality". */
  name: string;
  /** Relative weight when combining factors (0.0–1.0). */
  weight: number;
  /** Raw score for this factor (0.0–1.0). */
  score: number;
  /** LLM-generated or rule-based explanation for the score. */
  reasoning: string;
}

/**
 * Composite confidence score aggregating multiple weighted factors.
 * Every AgentDecision carries one of these.
 */
export interface ConfidenceScore {
  /** Final aggregated score (0.0–1.0). */
  value: number;
  /** Individual factors that produced the score. */
  factors: ConfidenceFactor[];
  /** Minimum score required to proceed without fallback. */
  threshold: number;
  /** Convenience flag: `value >= threshold`. */
  passesThreshold: boolean;
}

/** Strategy for combining multiple confidence factors. */
export type ConfidenceStrategy =
  | 'weighted_average'   // Σ(weight × score) / Σ(weight)
  | 'minimum'            // min(scores) — conservative
  | 'geometric_mean';    // ∏(score^weight) — penalises any low factor

/**
 * Historical calibration entry for tracking confidence accuracy over time.
 * Used by the ConfidenceEngine for threshold auto-tuning.
 */
export interface CalibrationEntry {
  /** Timestamp of the calibration snapshot. */
  timestamp: number;
  /** Agent that produced the decision. */
  agentName: AgentName;
  /** Confidence the agent reported. */
  predictedConfidence: number;
  /** Whether the decision turned out to be correct/successful. */
  actualOutcome: boolean;
  /** Delta between predicted confidence and reality. */
  calibrationError: number;
}

// ============================================================================
// 3. CIRCUIT BREAKER
// ============================================================================

/** Three-state circuit breaker state machine. */
export type CircuitState = 'closed' | 'open' | 'half_open';

/**
 * Configuration for a CircuitBreaker instance.
 * Tuned per-agent depending on the downstream dependency (e.g. Gemini API).
 */
export interface CircuitBreakerConfig {
  /** Number of failures within the monitoring window before the circuit opens. */
  failureThreshold: number;
  /** Milliseconds to wait in open state before transitioning to half-open. */
  resetTimeoutMs: number;
  /** Maximum test calls allowed in half-open state before deciding. */
  halfOpenMaxAttempts: number;
  /** Sliding window duration (ms) for counting failures. */
  monitorWindowMs: number;
}

/** Runtime metrics for a CircuitBreaker instance. */
export interface CircuitBreakerMetrics {
  /** Current state of the circuit. */
  state: CircuitState;
  /** Total calls attempted (all states). */
  totalCalls: number;
  /** Total successful calls. */
  successfulCalls: number;
  /** Total failed calls. */
  failedCalls: number;
  /** Calls rejected because the circuit was open. */
  rejectedCalls: number;
  /** Number of state transitions since creation. */
  stateTransitions: number;
  /** Timestamp (ms) of the last failure. */
  lastFailureTime: number | null;
  /** Timestamp (ms) of the last state change. */
  lastStateChangeTime: number;
  /** Consecutive successes in half-open state. */
  halfOpenSuccesses: number;
}

// ============================================================================
// 4. EVENT SYSTEM (Pub/Sub)
// ============================================================================

/**
 * A typed event flowing through the AgentEventBus.
 * Generic parameter `T` constrains the payload shape.
 *
 * @template T - Shape of the event payload.
 */
export interface AgentEvent<T = unknown> {
  /** Globally unique event ID (crypto.randomUUID). */
  id: string;
  /** Dot-separated event type — e.g. "gig.created", "worker.matched". */
  type: string;
  /** Agent that produced this event. */
  source: AgentName;
  /** Unix epoch milliseconds. */
  timestamp: number;
  /** Typed payload. */
  payload: T;
  /** Groups related events across agents for distributed tracing. */
  correlationId: string;
  /** ID of the event that directly caused this one. */
  causationId?: string;
  /** Arbitrary string key-value metadata (locale, region, etc.). */
  metadata: Record<string, string>;
}

/** Priority levels for event processing ordering. */
export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Async handler signature for event bus subscriptions.
 * @template T - Expected payload type.
 */
export type EventHandler<T = unknown> = (event: AgentEvent<T>) => Promise<void>;

/** Options when subscribing to events. */
export interface SubscribeOptions {
  /** Handler priority — higher priorities execute first. */
  priority?: EventPriority;
  /** Maximum retries for this handler on failure. */
  maxRetries?: number;
  /** Only process events from this specific agent. */
  sourceFilter?: AgentName;
}

/** A function that removes a subscription when called. */
export type Unsubscribe = () => void;

/** Entry in the dead-letter queue when a handler fails permanently. */
export interface DeadLetterEntry {
  /** The event that could not be processed. */
  event: AgentEvent;
  /** The error message from the last attempt. */
  error: string;
  /** Stack trace if available. */
  stack?: string;
  /** Handler pattern that failed. */
  handlerPattern: string;
  /** Number of attempts made. */
  attempts: number;
  /** Timestamp (ms) of the final failure. */
  failedAt: number;
}

/** Runtime metrics for the event bus. */
export interface EventBusMetrics {
  /** Total events published. */
  totalPublished: number;
  /** Total events successfully delivered to at least one handler. */
  totalDelivered: number;
  /** Total handler invocations that failed (across all retries). */
  totalFailed: number;
  /** Current number of active subscriptions. */
  activeSubscriptions: number;
  /** Number of entries in the dead-letter queue. */
  deadLetterCount: number;
  /** Events published per topic. */
  topicCounts: Record<string, number>;
}

// ============================================================================
// 5. AGENT DECISION & ACTION TYPES
// ============================================================================

/**
 * An action to execute as part of an agent decision.
 * Actions are enqueued and may be retried.
 */
export interface AgentAction {
  /** Action type discriminator — e.g. "firestore_write", "notification". */
  type: string;
  /** Target resource — e.g. "gigs/{gigId}", "users/{uid}". */
  target: string;
  /** Action-specific payload. */
  payload: unknown;
  /** Execution priority. */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Whether this action can be safely retried on failure. */
  retryable: boolean;
}

/**
 * The final output of a single agent processing cycle.
 * Contains the decision, confidence, actions, emitted events, and trace info.
 *
 * @template T - Shape of the decision payload.
 */
export interface AgentDecision<T = unknown> {
  /** Which agent produced this decision. */
  agentName: AgentName;
  /** Phase the agent was in when it finalised the decision. */
  phase: AgentPhase;
  /** The typed decision payload. */
  decision: T;
  /** How confident the agent is in this decision. */
  confidence: ConfidenceScore;
  /** Human-readable reasoning chain. */
  reasoning: string;
  /** Actions to execute as a result of this decision. */
  actions: AgentAction[];
  /** Events emitted during the lifecycle. */
  events: AgentEvent[];
  /** Unique trace ID for this processing cycle. */
  traceId: string;
  /** Parent trace ID for chaining multi-agent workflows. */
  parentTraceId: string | null;
  /** Total processing time in milliseconds. */
  latencyMs: number;
  /** Whether a fallback was invoked (e.g. circuit breaker opened). */
  fallbackUsed: boolean;
}

// ============================================================================
// 6. PERCEPTION & OBSERVATION
// ============================================================================

/**
 * Context object passed into the perceive phase.
 * Contains the triggering event plus session/locale metadata.
 */
export interface PerceptionContext {
  /** The raw event that triggered this agent cycle. */
  event: AgentEvent;
  /** When perception started (Unix epoch ms). */
  timestamp: number;
  /** UI locale of the triggering user. */
  locale: 'ur' | 'en';
  /** UID of the user who caused the event, if applicable. */
  userId?: string;
  /** Session ID for grouping related interactions. */
  sessionId: string;
}

/**
 * Result of the observe phase — post-action feedback loop.
 * Feeds into calibration and learning.
 */
export interface ObservationResult {
  /** ID of the action that was observed. */
  actionId: string;
  /** Whether the action succeeded. */
  success: boolean;
  /** Outcome payload (action-specific). */
  outcome: unknown;
  /** Numeric metrics — e.g. { "latencyMs": 42, "recordsUpdated": 3 }. */
  metrics: Record<string, number>;
  /** Unexpected side effects detected. */
  sideEffects: string[];
  /** When the observation was recorded (Unix epoch ms). */
  timestamp: number;
}

// ============================================================================
// 7. AGENT TOOLS
// ============================================================================

/**
 * Definition of a tool available to an agent.
 * Tools are invoked during the tool_use phase.
 */
export interface AgentTool<TInput = unknown, TOutput = unknown> {
  /** Unique tool name — e.g. "firestore_query", "gemini_generate". */
  name: string;
  /** Human-readable description for prompt engineering. */
  description: string;
  /** JSON Schema describing the expected input shape. */
  inputSchema: Record<string, unknown>;
  /** Execute the tool with typed input and output. */
  execute: (input: TInput) => Promise<TOutput>;
}

// ============================================================================
// 8. AGENT LIFECYCLE HOOKS
// ============================================================================

/**
 * Optional hooks that fire at key points in the agent lifecycle.
 * Used for telemetry, logging, and cross-cutting concerns.
 */
export interface AgentLifecycleHook {
  /** Fires before the perceive phase begins. */
  beforePerceive?: (ctx: PerceptionContext) => Promise<void>;
  /** Fires after the decide phase completes. */
  afterDecide?: (decision: AgentDecision) => Promise<void>;
  /** Fires when any phase throws an error. */
  onError?: (error: Error, phase: AgentPhase) => Promise<void>;
}

// ============================================================================
// 9. AGENT CONFIGURATION
// ============================================================================

/**
 * Full configuration for an agent instance.
 * Passed to the BaseAgent constructor.
 */
export interface AgentConfig {
  /** Canonical agent name. */
  name: AgentName;
  /** Semantic version string — e.g. "1.0.0". */
  version: string;
  /** Human-readable agent description. */
  description: string;
  /** Circuit breaker settings for downstream calls. */
  circuitBreaker: CircuitBreakerConfig;
  /** Minimum confidence score to proceed without fallback. */
  confidenceThreshold: number;
  /** Max retries per lifecycle phase. */
  maxRetriesPerPhase: number;
  /** Per-phase timeout in milliseconds. */
  timeoutMs: number;
  /** Tools available to this agent. */
  tools: AgentTool[];
  /** Optional lifecycle hooks. */
  hooks?: AgentLifecycleHook;
  /** Event type patterns this agent subscribes to. */
  enabledEvents: string[];
}

// ============================================================================
// 10. PHASE RESULT TYPES (used by BaseAgent abstract methods)
// ============================================================================

/** Output of the perceive phase — structured signals extracted from raw event. */
export interface PerceptionResult {
  /** Structured signals extracted from the raw event. */
  signals: Record<string, unknown>;
  /** Entities identified in the event (user IDs, gig IDs, etc.). */
  entities: Record<string, string>;
  /** Perceived intent of the triggering event. */
  intent: string;
  /** Raw context preserved for downstream phases. */
  rawContext: PerceptionContext;
}

/** Output of the deliberate phase — hypotheses and planned approach. */
export interface DeliberationResult {
  /** Hypotheses generated during deliberation. */
  hypotheses: Array<{
    /** Hypothesis description. */
    description: string;
    /** Prior probability estimate. */
    priorProbability: number;
  }>;
  /** Tools the agent plans to use. */
  selectedToolNames: string[];
  /** Strategy rationale from the LLM or rule engine. */
  reasoning: string;
  /** Initial confidence estimate before tool use. */
  preliminaryConfidence: number;
}

/** Output of the tool_use phase — results from all invoked tools. */
export interface ToolUseResult {
  /** Individual tool invocation results. */
  toolOutputs: Array<{
    /** Name of the tool that was invoked. */
    toolName: string;
    /** Whether the tool call succeeded. */
    success: boolean;
    /** Tool output payload. */
    output: unknown;
    /** Latency of the tool call in ms. */
    latencyMs: number;
  }>;
  /** Any errors encountered during tool use. */
  errors: Array<{
    toolName: string;
    error: string;
  }>;
}

/** Output of the decide phase — the agent's committed action plan. */
export interface DecisionResult {
  /** The decision payload (agent-specific). */
  decision: unknown;
  /** Final confidence score after tool use. */
  confidence: ConfidenceScore;
  /** Reasoning chain for the decision. */
  reasoning: string;
  /** Actions to execute. */
  actions: AgentAction[];
}

/** Output of the act phase — results of executing the decided actions. */
export interface ActionResult {
  /** Per-action execution results. */
  executedActions: Array<{
    /** Action type that was executed. */
    type: string;
    /** Whether execution succeeded. */
    success: boolean;
    /** Action-specific result payload. */
    result: unknown;
    /** Generated action ID for observation tracking. */
    actionId: string;
  }>;
  /** Events emitted during action execution. */
  emittedEvents: AgentEvent[];
}

// ============================================================================
// 11. RE-EXPORT DOMAIN TYPE FOR CONVENIENCE
// ============================================================================

/** Re-export AgentDecisionLog so agent code doesn't need to import @/types directly. */
export type { AgentDecisionLog };
