// ============================================================================
// RozgarSync — Agent Core Module Barrel Export
// ============================================================================
// Single entry point for all agent framework primitives.
//
// Usage:
//   import { BaseAgent, AgentEventBus, CircuitBreaker, ... } from '@/lib/agents/core';
// ============================================================================

// --- Type System ---
export type {
  // Lifecycle
  AgentPhase,
  AgentName,

  // Confidence
  ConfidenceFactor,
  ConfidenceScore,
  ConfidenceStrategy,
  CalibrationEntry,

  // Circuit Breaker
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,

  // Events
  AgentEvent,
  EventPriority,
  EventHandler,
  SubscribeOptions,
  Unsubscribe,
  DeadLetterEntry,
  EventBusMetrics,

  // Decisions & Actions
  AgentAction,
  AgentDecision,

  // Perception & Observation
  PerceptionContext,
  ObservationResult,

  // Tools
  AgentTool,

  // Hooks & Config
  AgentLifecycleHook,
  AgentConfig,

  // Phase Results
  PerceptionResult,
  DeliberationResult,
  ToolUseResult,
  DecisionResult,
  ActionResult,

  // Domain re-export
  AgentDecisionLog,
} from './types';

export { AGENT_PHASES } from './types';

// --- Event Bus ---
export { AgentEventBus, createEventBus } from './event-bus';

// --- Circuit Breaker ---
export { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

// --- Confidence Engine ---
export { ConfidenceEngine } from './confidence';

// --- Base Agent ---
export { BaseAgent, AgentPhaseError } from './base-agent';
