// @ts-nocheck
// ============================================================================
// RozgarSync â€” OpportunityMatcher Scoring Engine
// ============================================================================
// Multi-dimensional scoring functions for matching workers to gigs.
// Scoring dimensions:
//   - Skill Match (30%): Category match, skill level, endorsement count
//   - Proximity  (25%): Haversine distance, travel radius
//   - Availability (15%): Current availability, schedule overlap
//   - Rating     (15%): Worker rating, completion rate
//   - Fairness   (15%): Anti-starvation â€” fewer recent gigs = higher score
// ============================================================================

import type { ServiceCategory, WorkerSkill } from '@/types';
import type { HaversineOutput } from './tools';
import type { WorkerAvailabilityOutput } from './tools';
import type { WorkerGigHistoryOutput } from './tools';

// ============================================================================
// 1. SCORING WEIGHTS â€” tune these to adjust matching behavior
// ============================================================================

/** Scoring dimension weights. Must sum to 1.0. */
export const SCORING_WEIGHTS = {
  skill: 0.30,
  proximity: 0.25,
  availability: 0.15,
  rating: 0.15,
  fairness: 0.15,
} as const;

/** Confidence threshold â€” below this, return unranked top-5. */
export const CONFIDENCE_THRESHOLD = 0.65;

/** Maximum number of candidates returned in unranked mode. */
export const UNRANKED_MAX_CANDIDATES = 5;

/** Number of top matches returned in ranked mode. */
export const RANKED_MAX_CANDIDATES = 5;

/** Demotion factor applied to workers who monopolize recent gigs. */
export const FAIRNESS_DEMOTION_FACTOR = 0.85;

/** Number of recent gigs to check for fairness redistribution. */
export const FAIRNESS_LOOKBACK_GIGS = 5;

// ============================================================================
// 2. INDIVIDUAL DIMENSION SCORERS
// ============================================================================

/**
 * Input for the skill match scorer.
 */
export interface SkillMatchInput {
  /** The gig's required category. */
  readonly gigCategory: ServiceCategory;
  /** The gig's required skill names (optional). */
  readonly gigSkills: ReadonlyArray<string>;
  /** The worker's skills. */
  readonly workerSkills: ReadonlyArray<WorkerSkill>;
}

/**
 * Score a worker's skill match against a gig's requirements.
 *
 * Scoring breakdown:
 * - Category match: 40% of skill score
 * - Skill name overlap: 30% of skill score
 * - Skill level bonus: 20% of skill score
 * - Endorsement bonus: 10% of skill score
 *
 * @returns Score 0.0â€“1.0
 */
export function scoreSkillMatch(input: SkillMatchInput): number {
  const { gigCategory, gigSkills, workerSkills } = input;

  if (workerSkills.length === 0) return 0;

  // --- Category match (40%) ---
  const categorySkills = workerSkills.filter(
    (s) => s.category === gigCategory
  );
  const categoryScore = categorySkills.length > 0 ? 1.0 : 0;

  // --- Skill name overlap (30%) ---
  let skillOverlapScore = 0;
  if (gigSkills.length > 0 && categorySkills.length > 0) {
    const workerSkillNames = new Set(
      categorySkills.map((s) => s.name.toLowerCase())
    );
    const matchedSkills = gigSkills.filter((gs) =>
      workerSkillNames.has(gs.toLowerCase())
    );
    skillOverlapScore = matchedSkills.length / gigSkills.length;
  } else if (categorySkills.length > 0) {
    // No specific skill requirements â€” category match is enough
    skillOverlapScore = 0.7;
  }

  // --- Skill level bonus (20%) ---
  const levelWeights: Record<WorkerSkill['level'], number> = {
    beginner: 0.3,
    intermediate: 0.6,
    expert: 1.0,
  };
  let levelScore = 0;
  if (categorySkills.length > 0) {
    const bestLevel = categorySkills.reduce<number>((best, skill) => {
      const w = levelWeights[skill.level];
      return w > best ? w : best;
    }, 0);
    levelScore = bestLevel;
  }

  // --- Endorsement bonus (10%) ---
  let endorsementScore = 0;
  if (categorySkills.length > 0) {
    const maxEndorsements = categorySkills.reduce(
      (max, s) => Math.max(max, s.endorsementCount),
      0
    );
    // Diminishing returns: log scale capped at 20 endorsements = 1.0
    endorsementScore = Math.min(1.0, Math.log2(maxEndorsements + 1) / Math.log2(21));
  }

  return (
    categoryScore * 0.4 +
    skillOverlapScore * 0.3 +
    levelScore * 0.2 +
    endorsementScore * 0.1
  );
}

// ---------------------------------------------------------------------------

/**
 * Score proximity based on Haversine distance.
 *
 * Scoring curve:
 * - 0 km â†’ 1.0
 * - â‰¤ 5 km â†’ 0.9
 * - â‰¤ 10 km â†’ 0.75
 * - â‰¤ 20 km â†’ 0.5
 * - â‰¤ 50 km â†’ 0.25
 * - > 50 km â†’ linear decay down to 0.0 at 200 km
 *
 * Also penalizes workers outside their declared travel radius.
 *
 * @param haversine Haversine distance result from the tool.
 * @param maxTravelRadiusKm Worker's declared maximum travel radius (optional).
 * @returns Score 0.0â€“1.0
 */
export function scoreProximity(
  haversine: HaversineOutput,
  maxTravelRadiusKm?: number
): number {
  const { distanceKm } = haversine;

  // Base distance score â€” exponential decay
  let baseScore: number;
  if (distanceKm <= 0) {
    baseScore = 1.0;
  } else if (distanceKm <= 5) {
    baseScore = 0.9 + (5 - distanceKm) * 0.02;
  } else if (distanceKm <= 10) {
    baseScore = 0.75 + (10 - distanceKm) * 0.03;
  } else if (distanceKm <= 20) {
    baseScore = 0.5 + (20 - distanceKm) * 0.025;
  } else if (distanceKm <= 50) {
    baseScore = 0.25 + (50 - distanceKm) * (0.25 / 30);
  } else if (distanceKm <= 200) {
    baseScore = Math.max(0, 0.25 * (1 - (distanceKm - 50) / 150));
  } else {
    baseScore = 0;
  }

  // Travel radius penalty
  if (maxTravelRadiusKm !== undefined && distanceKm > maxTravelRadiusKm) {
    // Apply a 50% penalty when outside declared travel radius
    baseScore *= 0.5;
  }

  return Math.round(baseScore * 1000) / 1000;
}

// ---------------------------------------------------------------------------

/**
 * Score worker availability.
 * Uses the output from the `check_worker_availability` tool.
 *
 * @param availability Availability check result.
 * @returns Score 0.0â€“1.0
 */
export function scoreAvailability(
  availability: WorkerAvailabilityOutput
): number {
  return availability.availabilityScore;
}

// ---------------------------------------------------------------------------

/**
 * Score a worker's rating and reliability.
 *
 * Components:
 * - Rating (60%): Normalized from 1â€“5 scale to 0â€“1
 * - Completion rate (40%): completedJobs / (completedJobs + incomplete estimate)
 *
 * Workers with fewer than 3 completed gigs get a "new worker" baseline of 0.5.
 *
 * @param rating Worker's current rating (1.0â€“5.0)
 * @param completedJobs Number of completed gigs
 * @param totalReviews Total number of reviews
 * @returns Score 0.0â€“1.0
 */
export function scoreRating(
  rating: number,
  completedJobs: number,
  totalReviews: number
): number {
  // New worker baseline
  if (completedJobs < 3) {
    return 0.5;
  }

  // Rating component (1â€“5 â†’ 0â€“1, with minimum of 0.1)
  const normalizedRating = Math.max(0.1, (rating - 1) / 4);

  // Completion reliability component
  // Estimate: if totalReviews > completedJobs, some gigs were incomplete
  const estimatedTotal = Math.max(completedJobs, totalReviews);
  const completionRate =
    estimatedTotal > 0 ? completedJobs / estimatedTotal : 0.5;

  return normalizedRating * 0.6 + completionRate * 0.4;
}

// ---------------------------------------------------------------------------

/**
 * Score fairness (anti-starvation).
 *
 * Workers with fewer recent gigs get a HIGHER fairness score.
 * This prevents the same top-rated workers from monopolizing all gigs.
 *
 * Scoring:
 * - 0 recent gigs â†’ 1.0 (maximum boost)
 * - 1â€“2 recent gigs â†’ 0.8
 * - 3â€“5 recent gigs â†’ 0.5
 * - 6+ recent gigs â†’ linear decay to 0.1
 * - High-frequency workers â†’ additional penalty
 *
 * @param history Worker's recent gig history from the tool.
 * @returns Score 0.0â€“1.0
 */
export function scoreFairness(history: WorkerGigHistoryOutput): number {
  const { recentGigCount, isHighFrequency } = history;

  let baseScore: number;
  if (recentGigCount === 0) {
    baseScore = 1.0;
  } else if (recentGigCount <= 2) {
    baseScore = 0.8;
  } else if (recentGigCount <= 5) {
    baseScore = 0.5;
  } else {
    // Linear decay from 0.5 to 0.1 for 6â€“20 gigs
    baseScore = Math.max(0.1, 0.5 - (recentGigCount - 5) * (0.4 / 15));
  }

  // Additional penalty for high-frequency workers
  if (isHighFrequency) {
    baseScore *= 0.7;
  }

  return Math.round(baseScore * 1000) / 1000;
}

// ============================================================================
// 3. COMPOSITE SCORING
// ============================================================================

/** Breakdown of individual dimension scores for a worker candidate. */
export interface ScoreBreakdown {
  /** Skill match score 0â€“1. */
  readonly skillScore: number;
  /** Proximity score 0â€“1. */
  readonly proximityScore: number;
  /** Availability score 0â€“1. */
  readonly availabilityScore: number;
  /** Rating score 0â€“1. */
  readonly ratingScore: number;
  /** Fairness score 0â€“1. */
  readonly fairnessScore: number;
}

/** A fully scored worker candidate. */
export interface ScoredCandidate {
  /** Worker's UID. */
  readonly workerId: string;
  /** Worker's display name. */
  readonly workerName: string;
  /** Composite score 0â€“1 (weighted sum of dimensions). */
  readonly compositeScore: number;
  /** Per-dimension score breakdown. */
  readonly breakdown: ScoreBreakdown;
  /** Distance to gig in km. */
  readonly distanceKm: number;
  /** Human-readable rationale for this ranking. */
  readonly rationale: string;
}

/**
 * Compute the weighted composite score from individual dimension scores.
 *
 * @param breakdown Per-dimension scores.
 * @returns Composite score 0.0â€“1.0.
 */
export function computeCompositeScore(breakdown: ScoreBreakdown): number {
  const composite =
    breakdown.skillScore * SCORING_WEIGHTS.skill +
    breakdown.proximityScore * SCORING_WEIGHTS.proximity +
    breakdown.availabilityScore * SCORING_WEIGHTS.availability +
    breakdown.ratingScore * SCORING_WEIGHTS.rating +
    breakdown.fairnessScore * SCORING_WEIGHTS.fairness;

  return Math.round(composite * 1000) / 1000;
}

/**
 * Generate a human-readable rationale for a candidate's score.
 *
 * @param candidate Scored candidate.
 * @returns Rationale string.
 */
export function generateRationale(candidate: ScoredCandidate): string {
  const { breakdown, distanceKm, compositeScore } = candidate;

  const parts: string[] = [];

  // Highlight strongest dimensions
  if (breakdown.skillScore >= 0.8) {
    parts.push('strong skill match');
  } else if (breakdown.skillScore >= 0.5) {
    parts.push('partial skill match');
  } else {
    parts.push('weak skill match');
  }

  if (distanceKm <= 5) {
    parts.push(`very close (${distanceKm} km)`);
  } else if (distanceKm <= 20) {
    parts.push(`nearby (${distanceKm} km)`);
  } else {
    parts.push(`${distanceKm} km away`);
  }

  if (breakdown.availabilityScore >= 0.8) {
    parts.push('schedule aligns');
  }

  if (breakdown.ratingScore >= 0.8) {
    parts.push('highly rated');
  }

  if (breakdown.fairnessScore >= 0.8) {
    parts.push('needs more gigs (fairness boost)');
  } else if (breakdown.fairnessScore <= 0.3) {
    parts.push('already has many recent gigs');
  }

  return `Score: ${(compositeScore * 100).toFixed(1)}% â€” ${parts.join(', ')}.`;
}

// ============================================================================
// 4. FAIRNESS REDISTRIBUTION
// ============================================================================

/**
 * Apply fairness redistribution to prevent the same workers from
 * monopolizing the top positions.
 *
 * If the same workers appear in the top-N across multiple recent gigs,
 * their composite score is slightly demoted to give others a chance.
 *
 * @param candidates Sorted candidates (highest score first).
 * @param recentTopWorkerIds Worker IDs who were in top-3 of the last N gigs.
 * @returns Re-sorted candidates with fairness adjustments.
 */
export function applyFairnessRedistribution(
  candidates: ReadonlyArray<ScoredCandidate>,
  recentTopWorkerIds: ReadonlyArray<string>
): ScoredCandidate[] {
  if (recentTopWorkerIds.length === 0) return [...candidates];

  const recentTopSet = new Set(recentTopWorkerIds);

  const adjusted = candidates.map((candidate): ScoredCandidate => {
    if (recentTopSet.has(candidate.workerId)) {
      const demotedScore =
        Math.round(candidate.compositeScore * FAIRNESS_DEMOTION_FACTOR * 1000) /
        1000;
      return {
        ...candidate,
        compositeScore: demotedScore,
        rationale: `${candidate.rationale} (fairness demotion applied: was in top-3 of recent gigs)`,
      };
    }
    return candidate;
  });

  // Re-sort after adjustment
  return adjusted.sort((a, b) => b.compositeScore - a.compositeScore);
}

// ============================================================================
// 5. RANKING DECISION
// ============================================================================

/** The final matching result produced by the scoring engine. */
export interface MatchingResult {
  /** Whether candidates are ranked (high-confidence) or unranked (low-confidence). */
  readonly mode: 'ranked' | 'unranked';
  /** The recommended candidates. */
  readonly candidates: ReadonlyArray<ScoredCandidate>;
  /** Overall confidence in the matching quality. */
  readonly confidence: number;
  /** Human-readable summary of the matching outcome. */
  readonly summary: string;
}

/**
 * Produce the final matching result from scored candidates.
 *
 * - If the top candidate's composite score â‰¥ CONFIDENCE_THRESHOLD â†’ ranked mode
 * - Otherwise â†’ unranked mode (let employer choose)
 *
 * @param candidates Scored and fairness-adjusted candidates (sorted desc).
 * @returns Final matching result.
 */
export function produceMatchingResult(
  candidates: ReadonlyArray<ScoredCandidate>
): MatchingResult {
  if (candidates.length === 0) {
    return {
      mode: 'unranked',
      candidates: [],
      confidence: 0,
      summary: 'No matching workers found.',
    };
  }

  const topScore = candidates[0]!.compositeScore;

  if (topScore >= CONFIDENCE_THRESHOLD) {
    // High-confidence â€” return ranked recommendations
    const ranked = candidates.slice(0, RANKED_MAX_CANDIDATES);
    return {
      mode: 'ranked',
      candidates: ranked,
      confidence: topScore,
      summary: `Found ${ranked.length} ranked candidates. Top match: ${ranked[0]!.workerName} (${(topScore * 100).toFixed(1)}% match).`,
    };
  }

  // Low-confidence â€” return unranked top-5 for employer choice
  const unranked = candidates.slice(0, UNRANKED_MAX_CANDIDATES);
  return {
    mode: 'unranked',
    candidates: unranked,
    confidence: topScore,
    summary: `Confidence below threshold (${(topScore * 100).toFixed(1)}%). Returning ${unranked.length} unranked candidates for employer review.`,
  };
}

