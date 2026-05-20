// ============================================================================
// RozgarSync — Confidence Scoring Engine
// ============================================================================
// Multi-factor confidence scoring with weighted composition strategies,
// temporal decay for stale data, configurable per-agent thresholds,
// and calibration history for accuracy tracking.
// ============================================================================

import type {
  ConfidenceFactor,
  ConfidenceScore,
  ConfidenceStrategy,
  CalibrationEntry,
  AgentName,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum calibration history entries to retain (FIFO eviction). */
const MAX_CALIBRATION_HISTORY = 1000;

/** Default confidence strategy if none specified. */
const DEFAULT_STRATEGY: ConfidenceStrategy = 'weighted_average';

/** Default temporal decay half-life in milliseconds (1 hour). */
const DEFAULT_DECAY_HALF_LIFE_MS = 3_600_000;

// ============================================================================
// CONFIDENCE ENGINE CLASS
// ============================================================================

/**
 * Engine for computing composite confidence scores from weighted factors.
 *
 * Supports three composition strategies:
 * - **weighted_average**: Σ(weight × score) / Σ(weight) — default, balanced
 * - **minimum**: min(scores) — conservative, used for safety-critical decisions
 * - **geometric_mean**: ∏(score^weight) — penalises any single low factor
 *
 * Features:
 * - **Per-agent thresholds**: different agents can have different pass criteria
 * - **Temporal decay**: factor scores decay over time for stale data
 * - **Calibration tracking**: records predicted vs. actual outcomes for tuning
 *
 * @example
 * ```typescript
 * const engine = new ConfidenceEngine(0.7);
 *
 * const score = engine.score([
 *   { name: 'skill_match', weight: 0.4, score: 0.9, reasoning: 'Exact skill match' },
 *   { name: 'location_proximity', weight: 0.3, score: 0.8, reasoning: 'Within 5km' },
 *   { name: 'rating_quality', weight: 0.3, score: 0.7, reasoning: 'Above average' },
 * ]);
 *
 * if (score.passesThreshold) {
 *   // Proceed with decision
 * }
 * ```
 */
export class ConfidenceEngine {
  /** Default threshold for agents that haven't set a custom one. */
  private readonly defaultThreshold: number;

  /** Per-agent threshold overrides. */
  private readonly agentThresholds: Map<AgentName, number> = new Map();

  /** Calibration history for tracking accuracy over time. */
  private readonly calibrationHistory: CalibrationEntry[] = [];

  /** Active composition strategy. */
  private strategy: ConfidenceStrategy = DEFAULT_STRATEGY;

  /** Half-life for temporal decay (ms). After this duration, score halves. */
  private decayHalfLifeMs: number = DEFAULT_DECAY_HALF_LIFE_MS;

  /**
   * Create a new ConfidenceEngine.
   *
   * @param defaultThreshold - Minimum confidence score (0.0–1.0) to pass.
   *   Agents can override this with `adjustThreshold()`.
   */
  constructor(defaultThreshold: number) {
    if (defaultThreshold < 0 || defaultThreshold > 1) {
      throw new RangeError(
        `defaultThreshold must be between 0 and 1, got ${defaultThreshold}`,
      );
    }
    this.defaultThreshold = defaultThreshold;
  }

  // --------------------------------------------------------------------------
  // SCORING
  // --------------------------------------------------------------------------

  /**
   * Compute a composite confidence score from weighted factors.
   *
   * @param factors - Individual confidence factors to aggregate.
   * @param agentName - Optional agent name for threshold lookup.
   * @returns Aggregated ConfidenceScore with pass/fail determination.
   * @throws {Error} If factors array is empty.
   */
  score(factors: ConfidenceFactor[], agentName?: AgentName): ConfidenceScore {
    if (factors.length === 0) {
      return {
        value: 0,
        factors: [],
        threshold: this.getThreshold(agentName),
        passesThreshold: false,
      };
    }

    // Validate individual factor values
    const validatedFactors = factors.map((f) => ({
      ...f,
      score: clamp(f.score, 0, 1),
      weight: Math.max(f.weight, 0),
    }));

    const value = this.computeValue(validatedFactors);
    const threshold = this.getThreshold(agentName);

    return {
      value,
      factors: validatedFactors,
      threshold,
      passesThreshold: value >= threshold,
    };
  }

  /**
   * Compute a confidence score with temporal decay applied to factors.
   *
   * Each factor's score is decayed based on how old its data is.
   * Uses exponential decay: `score * 2^(-age / halfLife)`.
   *
   * @param factors - Factors to score.
   * @param factorAgesMs - Map of factor name → age in milliseconds.
   * @param agentName - Optional agent name for threshold lookup.
   * @returns Decayed ConfidenceScore.
   */
  scoreWithDecay(
    factors: ConfidenceFactor[],
    factorAgesMs: Map<string, number>,
    agentName?: AgentName,
  ): ConfidenceScore {
    const decayedFactors = factors.map((f) => {
      const ageMs = factorAgesMs.get(f.name) ?? 0;
      const decayMultiplier = Math.pow(2, -(ageMs / this.decayHalfLifeMs));
      return {
        ...f,
        score: f.score * decayMultiplier,
        reasoning: `${f.reasoning} [decay: ${(decayMultiplier * 100).toFixed(1)}%]`,
      };
    });

    return this.score(decayedFactors, agentName);
  }

  // --------------------------------------------------------------------------
  // THRESHOLD MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Set a custom confidence threshold for a specific agent.
   *
   * @param agentName - The agent to configure.
   * @param newThreshold - New minimum confidence (0.0–1.0).
   * @throws {RangeError} If threshold is outside [0, 1].
   */
  adjustThreshold(agentName: AgentName, newThreshold: number): void {
    if (newThreshold < 0 || newThreshold > 1) {
      throw new RangeError(
        `Threshold must be between 0 and 1, got ${newThreshold}`,
      );
    }
    this.agentThresholds.set(agentName, newThreshold);
  }

  /**
   * Get the effective threshold for an agent.
   *
   * @param agentName - Optional agent name. Falls back to default.
   * @returns The effective threshold value.
   */
  getThreshold(agentName?: AgentName): number {
    if (agentName) {
      return this.agentThresholds.get(agentName) ?? this.defaultThreshold;
    }
    return this.defaultThreshold;
  }

  // --------------------------------------------------------------------------
  // STRATEGY CONFIGURATION
  // --------------------------------------------------------------------------

  /**
   * Set the composition strategy for combining factors.
   *
   * @param strategy - The strategy to use.
   */
  setStrategy(strategy: ConfidenceStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get the current composition strategy.
   * @returns The active strategy.
   */
  getStrategy(): ConfidenceStrategy {
    return this.strategy;
  }

  /**
   * Set the temporal decay half-life.
   *
   * @param halfLifeMs - Duration in ms after which a factor's score halves.
   */
  setDecayHalfLife(halfLifeMs: number): void {
    if (halfLifeMs <= 0) {
      throw new RangeError('Decay half-life must be positive');
    }
    this.decayHalfLifeMs = halfLifeMs;
  }

  // --------------------------------------------------------------------------
  // CALIBRATION
  // --------------------------------------------------------------------------

  /**
   * Record a calibration entry for tracking prediction accuracy.
   *
   * Call this after the real outcome is known to build a calibration dataset.
   * The engine retains the last {@link MAX_CALIBRATION_HISTORY} entries.
   *
   * @param agentName - Agent that made the prediction.
   * @param predictedConfidence - The confidence score the agent reported.
   * @param actualOutcome - Whether the decision was correct/successful.
   */
  recordCalibration(
    agentName: AgentName,
    predictedConfidence: number,
    actualOutcome: boolean,
  ): void {
    const entry: CalibrationEntry = {
      timestamp: Date.now(),
      agentName,
      predictedConfidence,
      actualOutcome,
      calibrationError: actualOutcome
        ? 1 - predictedConfidence // Should have been 1.0
        : predictedConfidence,   // Should have been 0.0
    };

    this.calibrationHistory.push(entry);

    // FIFO eviction
    while (this.calibrationHistory.length > MAX_CALIBRATION_HISTORY) {
      this.calibrationHistory.shift();
    }
  }

  /**
   * Get the full calibration history.
   * @returns Copy of all calibration entries.
   */
  getCalibrationHistory(): CalibrationEntry[] {
    return [...this.calibrationHistory];
  }

  /**
   * Compute the mean calibration error for an agent.
   * Lower is better — 0.0 means perfectly calibrated.
   *
   * @param agentName - Agent to compute calibration for.
   * @returns Mean calibration error, or null if no history.
   */
  getMeanCalibrationError(agentName: AgentName): number | null {
    const entries = this.calibrationHistory.filter(
      (e) => e.agentName === agentName,
    );

    if (entries.length === 0) return null;

    const totalError = entries.reduce((sum, e) => sum + e.calibrationError, 0);
    return totalError / entries.length;
  }

  // --------------------------------------------------------------------------
  // COMPOSITION STRATEGIES
  // --------------------------------------------------------------------------

  /**
   * Compute the aggregated confidence value using the active strategy.
   */
  private computeValue(factors: ConfidenceFactor[]): number {
    switch (this.strategy) {
      case 'weighted_average':
        return this.weightedAverage(factors);
      case 'minimum':
        return this.minimumScore(factors);
      case 'geometric_mean':
        return this.geometricMean(factors);
    }
  }

  /**
   * Weighted average: Σ(weight × score) / Σ(weight).
   * The most common strategy — balanced and intuitive.
   */
  private weightedAverage(factors: ConfidenceFactor[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const f of factors) {
      weightedSum += f.weight * f.score;
      totalWeight += f.weight;
    }

    if (totalWeight === 0) return 0;
    return clamp(weightedSum / totalWeight, 0, 1);
  }

  /**
   * Minimum: min(scores).
   * Conservative strategy — the chain is only as strong as its weakest link.
   * Ignores weights entirely.
   */
  private minimumScore(factors: ConfidenceFactor[]): number {
    let min = 1;
    for (const f of factors) {
      if (f.score < min) {
        min = f.score;
      }
    }
    return min;
  }

  /**
   * Geometric mean: ∏(score^(weight/totalWeight)).
   * Penalises any single low factor more than weighted average.
   * Useful when ALL factors must be reasonably good.
   */
  private geometricMean(factors: ConfidenceFactor[]): number {
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight === 0) return 0;

    let logSum = 0;
    for (const f of factors) {
      // Avoid log(0) — clamp minimum score to a tiny epsilon
      const safeScore = Math.max(f.score, 1e-10);
      logSum += (f.weight / totalWeight) * Math.log(safeScore);
    }

    return clamp(Math.exp(logSum), 0, 1);
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/** Clamp a value between min and max (inclusive). */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
