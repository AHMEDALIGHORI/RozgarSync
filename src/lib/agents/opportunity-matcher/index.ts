// @ts-nocheck
// ============================================================================
// RozgarSync â€” OpportunityMatcher Agent
// ============================================================================
// Matches open gigs with available workers using geospatial proximity,
// skill relevance, fairness scoring, and availability.
//
// Lifecycle:
//   Perceive  â†’ Extract gig requirements + nearby workers
//   Deliberate â†’ Multi-dimensional scoring (skill, proximity, availability,
//                rating, fairness)
//   ToolUse   â†’ Haversine distances, gig histories, availability checks
//   Decide    â†’ Rank by composite score, apply confidence threshold
//   Act       â†’ Emit worker.matched events, create notifications, log decisions
//   Observe   â†’ Track acceptance rates, feed back into fairness
//
// Event Subscriptions:
//   gig.created | gig.updated | worker.available | worker.skill_updated
// ============================================================================

import type {
  Gig,
  GeoPoint,
  ServiceCategory,
  WorkerProfile,
  WorkerSkill,
  WorkerAvailability,
} from '@/types';
import { BaseAgent } from '../core/base-agent';
import type {
  AgentAction,
  AgentContext,
  AgentDecision,
  AgentEvent,
  AgentEventBus,
  AgentEventType,
} from '../core/types';
import { generateId, nowISO } from '../core/types';
import {
  createOpportunityMatcherTools,
  type HaversineInput,
  type HaversineOutput,
  type WorkerAvailabilityInput,
  type WorkerAvailabilityOutput,
  type WorkerGigHistoryInput,
  type WorkerGigHistoryOutput,
} from './tools';
import {
  applyFairnessRedistribution,
  computeCompositeScore,
  generateRationale,
  produceMatchingResult,
  scoreAvailability,
  scoreFairness,
  scoreProximity,
  scoreRating,
  scoreSkillMatch,
  CONFIDENCE_THRESHOLD,
  type MatchingResult,
  type ScoreBreakdown,
  type ScoredCandidate,
} from './scoring';

// ============================================================================
// 1. PHASE OUTPUT TYPES
// ============================================================================

/** Gig requirements extracted during the Perceive phase. */
interface GigRequirements {
  readonly gigId: string;
  readonly category: ServiceCategory;
  readonly requiredSkills: ReadonlyArray<string>;
  readonly location: GeoPoint;
  readonly city: string;
  readonly urgency: Gig['urgency'];
  readonly budgetMin: number;
  readonly budgetMax: number;
  readonly budgetUnit: 'fixed' | 'hourly' | 'daily';
  readonly title: string;
  readonly description: string;
  readonly employerId: string;
}

/** A nearby worker candidate extracted during Perceive phase. */
interface WorkerCandidate {
  readonly workerId: string;
  readonly workerName: string;
  readonly location: GeoPoint;
  readonly skills: ReadonlyArray<WorkerSkill>;
  readonly rating: number;
  readonly completedJobs: number;
  readonly totalReviews: number;
  readonly availability: WorkerAvailability | undefined;
  readonly maxTravelRadiusKm: number | undefined;
}

/** Output of the Perceive phase. */
interface OpportunityPerception {
  readonly gigRequirements: GigRequirements;
  readonly candidates: ReadonlyArray<WorkerCandidate>;
  readonly triggerType: 'gig_event' | 'worker_event';
}

/** Output of the Deliberate phase. */
interface OpportunityDeliberation {
  readonly scoredCandidates: ReadonlyArray<ScoredCandidate>;
  readonly matchingResult: MatchingResult;
  readonly recentTopWorkerIds: ReadonlyArray<string>;
}

// ============================================================================
// 2. DEFAULT AVAILABILITY & WORKER FACTORIES
// ============================================================================

/** Default availability for workers who haven't set a schedule. */
const DEFAULT_AVAILABILITY: WorkerAvailability = {
  isAvailable: true,
  schedule: {
    monday: [{ start: '08:00', end: '20:00' }],
    tuesday: [{ start: '08:00', end: '20:00' }],
    wednesday: [{ start: '08:00', end: '20:00' }],
    thursday: [{ start: '08:00', end: '20:00' }],
    friday: [{ start: '08:00', end: '20:00' }],
    saturday: [{ start: '09:00', end: '18:00' }],
    sunday: [],
  },
  preferredAreas: [],
};

// ============================================================================
// 3. OPPORTUNITY MATCHER AGENT
// ============================================================================

/**
 * The OpportunityMatcher agent matches open gigs to available workers.
 *
 * It processes events from the gig and worker lifecycles, scores candidates
 * across five dimensions, applies fairness redistribution, and emits
 * `worker.matched` events for the top candidates.
 *
 * @example
 * ```ts
 * const matcher = createOpportunityMatcher(eventBus);
 * matcher.initialize();
 *
 * // Agent will now automatically process gig.created, gig.updated,
 * // worker.available, and worker.skill_updated events.
 * ```
 */
class OpportunityMatcherAgent extends BaseAgent<
  OpportunityPerception,
  OpportunityDeliberation
> {
  protected readonly subscribedEvents: ReadonlyArray<AgentEventType> = [
    'gig.created',
    'gig.updated',
  ];

  /**
   * In-memory tracker for recent top-worker IDs (fairness redistribution).
   * In production, this would be backed by Redis/Firestore.
   */
  private readonly recentTopWorkerIds: string[] = [];

  /** Maximum size of the recentTopWorkerIds buffer. */
  private static readonly FAIRNESS_BUFFER_SIZE = 15;

  /** Acceptance rate tracker for the Observe phase. */
  private readonly acceptanceTracker = {
    totalRecommendations: 0,
    totalAccepted: 0,
  };

  constructor(eventBus: AgentEventBus) {
    super(
      {
        agentId: 'opportunity-matcher',
        agentName: 'OpportunityMatcher',
        agentVersion: '1.0.0',
        decisionTypes: ['skill_matching', 'gig_recommendation'],
        circuitBreaker: {
          failureThreshold: 5,
          resetTimeoutMs: 30_000,
          successThreshold: 2,
        },
      },
      eventBus
    );

    // Register all tools
    const { haversineTool, gigHistoryTool, availabilityTool } =
      createOpportunityMatcherTools();
    this.registerTool(haversineTool);
    this.registerTool(gigHistoryTool);
    this.registerTool(availabilityTool);
  }

  // ==========================================================================
  // PHASE 1: PERCEIVE
  // ==========================================================================

  /**
   * Extract gig requirements and candidate workers from the event context.
   *
   * For `gig.created` / `gig.updated` events, the payload contains the gig data.
   * Candidate workers are extracted from the event metadata (injected by the
   * event bus middleware in production) or from mock data for development.
   */
  async perceive(
    ctx: AgentContext<OpportunityPerception, OpportunityDeliberation>
  ): Promise<OpportunityPerception> {
    const event = ctx.event;
    const payload = event.payload as Record<string, unknown>;

    // Determine trigger type
    const triggerType = this.classifyTrigger(event.type);

    // Extract gig requirements
    const gigRequirements = this.extractGigRequirements(payload);

    // Extract candidate workers from event metadata or context
    const candidates = this.extractCandidates(payload, event);

    return {
      gigRequirements,
      candidates,
      triggerType,
    };
  }

  /**
   * Classify the event trigger for downstream branching.
   */
  private classifyTrigger(
    eventType: AgentEventType
  ): 'gig_event' | 'worker_event' {
    switch (eventType) {
      case 'gig.created':
      case 'gig.updated':
        return 'gig_event';
      default:
        return 'worker_event';
    }
  }

  /**
   * Extract gig requirements from the event payload.
   * Handles both full Gig documents and partial update payloads.
   */
  private extractGigRequirements(
    payload: Record<string, unknown>
  ): GigRequirements {
    const gig = (payload['gig'] ?? payload) as Partial<Gig>;
    const location = gig.location?.geopoint ?? { latitude: 0, longitude: 0 };
    const budget = gig.budget ?? { min: 0, max: 0, currency: 'PKR' as const, unit: 'fixed' as const };

    // Extract skill names from requirements or tags
    const requiredSkills: string[] = [];
    if (Array.isArray(gig.requirements)) {
      requiredSkills.push(...gig.requirements);
    }
    if (Array.isArray(gig.tags)) {
      requiredSkills.push(
        ...gig.tags.filter((t): t is string => typeof t === 'string')
      );
    }

    return {
      gigId: gig.id ?? (payload['gigId'] as string) ?? generateId(),
      category: gig.category ?? 'other',
      requiredSkills,
      location,
      city: gig.city ?? gig.location?.city ?? '',
      urgency: gig.urgency ?? 'medium',
      budgetMin: budget.min,
      budgetMax: budget.max,
      budgetUnit: budget.unit,
      title: gig.title ?? '',
      description: gig.description ?? '',
      employerId: gig.employerId ?? (payload['employerId'] as string) ?? '',
    };
  }

  /**
   * Extract candidate workers from the event context.
   *
   * In production, this would query Firestore with a geohash prefix filter:
   * ```
   * db.collection('users')
   *   .where('role', '==', 'worker')
   *   .where('profile.location.geohash', '>=', geohashPrefix)
   *   .where('profile.location.geohash', '<=', geohashPrefix + '\uf8ff')
   *   .where('profile.availability.isAvailable', '==', true)
   *   .limit(50)
   * ```
   *
   * For development, we extract from event metadata.
   */
  private extractCandidates(
    payload: Record<string, unknown>,
    event: AgentEvent
  ): WorkerCandidate[] {
    // Try to get candidates from event metadata (injected by middleware)
    const rawCandidates = (
      event.metadata?.['nearbyWorkers'] ??
      payload['nearbyWorkers'] ??
      payload['candidates'] ??
      []
    ) as Array<Record<string, unknown>>;

    return rawCandidates.map((raw): WorkerCandidate => {
      const profile = (raw['profile'] ?? raw) as Partial<WorkerProfile>;
      const loc = profile.location?.geopoint ?? {
        latitude: (raw['latitude'] as number) ?? 0,
        longitude: (raw['longitude'] as number) ?? 0,
      };

      return {
        workerId: (raw['workerId'] ?? raw['uid'] ?? '') as string,
        workerName: (raw['workerName'] ?? raw['displayName'] ?? 'Unknown') as string,
        location: loc,
        skills: (profile.skills ?? []) as WorkerSkill[],
        rating: (profile.rating ?? (raw['rating'] as number) ?? 3.0) as number,
        completedJobs: (profile.completedJobs ?? (raw['completedJobs'] as number) ?? 0) as number,
        totalReviews: (profile.totalReviews ?? (raw['totalReviews'] as number) ?? 0) as number,
        availability: profile.availability,
        maxTravelRadiusKm: profile.availability?.maxTravelRadiusKm,
      };
    });
  }

  // ==========================================================================
  // PHASE 2: DELIBERATE
  // ==========================================================================

  /**
   * Score each candidate across all five dimensions and produce
   * preliminary rankings.
   *
   * This phase does NOT invoke tools â€” it uses data already in the context.
   * Tool-dependent scores (Haversine, gig history, availability) are
   * placeholders here and will be refined in the ToolUse phase.
   */
  async deliberate(
    ctx: AgentContext<OpportunityPerception, OpportunityDeliberation>
  ): Promise<OpportunityDeliberation> {
    const perception = ctx.perception;
    if (!perception) {
      throw new Error('Deliberate phase requires perception data.');
    }

    const { gigRequirements, candidates } = perception;

    // Initial scoring with available data
    const scoredCandidates: ScoredCandidate[] = candidates.map(
      (candidate): ScoredCandidate => {
        // Skill match â€” can be computed without tools
        const skillScore = scoreSkillMatch({
          gigCategory: gigRequirements.category,
          gigSkills: gigRequirements.requiredSkills,
          workerSkills: candidate.skills,
        });

        // Rating â€” can be computed without tools
        const ratingScore = scoreRating(
          candidate.rating,
          candidate.completedJobs,
          candidate.totalReviews
        );

        // Preliminary scores â€” will be refined after ToolUse
        const breakdown: ScoreBreakdown = {
          skillScore,
          proximityScore: 0.5, // Placeholder â€” refined in ToolUse
          availabilityScore: 0.5, // Placeholder â€” refined in ToolUse
          ratingScore,
          fairnessScore: 0.5, // Placeholder â€” refined in ToolUse
        };

        const compositeScore = computeCompositeScore(breakdown);

        const result: ScoredCandidate = {
          workerId: candidate.workerId,
          workerName: candidate.workerName,
          compositeScore,
          breakdown,
          distanceKm: 0, // Placeholder â€” refined in ToolUse
          rationale: '',
        };

        return {
          ...result,
          rationale: generateRationale(result),
        };
      }
    );

    // Sort by preliminary composite score
    const sorted = scoredCandidates.sort(
      (a, b) => b.compositeScore - a.compositeScore
    );

    const matchingResult = produceMatchingResult(sorted);

    return {
      scoredCandidates: sorted,
      matchingResult,
      recentTopWorkerIds: [...this.recentTopWorkerIds],
    };
  }

  // ==========================================================================
  // PHASE 3: TOOL USE
  // ==========================================================================

  /**
   * Invoke tools to refine scores:
   * 1. `compute_haversine_distance` â€” exact distances for all candidates
   * 2. `query_worker_gig_history` â€” fairness data for all candidates
   * 3. `check_worker_availability` â€” schedule overlap for all candidates
   *
   * After tool execution, recalculate composite scores and re-rank.
   */
  async toolUse(
    ctx: AgentContext<OpportunityPerception, OpportunityDeliberation>
  ): Promise<void> {
    const perception = ctx.perception;
    const deliberation = ctx.deliberation;
    if (!perception || !deliberation) {
      throw new Error('ToolUse phase requires perception and deliberation data.');
    }

    const { gigRequirements, candidates } = perception;
    const haversineTool = this.getTool<HaversineInput, HaversineOutput>(
      'compute_haversine_distance'
    );
    const gigHistoryTool = this.getTool<
      WorkerGigHistoryInput,
      WorkerGigHistoryOutput
    >('query_worker_gig_history');
    const availabilityTool = this.getTool<
      WorkerAvailabilityInput,
      WorkerAvailabilityOutput
    >('check_worker_availability');

    // --- Execute tools for each candidate in parallel ---
    const refinedCandidates = await Promise.all(
      candidates.map(async (candidate): Promise<ScoredCandidate> => {
        // 1. Haversine distance
        const haversineResult = await haversineTool.execute({
          from: gigRequirements.location,
          to: candidate.location,
        });

        // 2. Worker gig history
        const historyResult = await gigHistoryTool.execute({
          workerId: candidate.workerId,
          lookbackDays: 7,
        });

        // 3. Availability check
        const availabilityResult = await availabilityTool.execute({
          availability: candidate.availability ?? DEFAULT_AVAILABILITY,
        });

        // --- Recompute scores with tool data ---
        const skillScore = scoreSkillMatch({
          gigCategory: gigRequirements.category,
          gigSkills: gigRequirements.requiredSkills,
          workerSkills: candidate.skills,
        });

        const proximityScore = scoreProximity(
          haversineResult,
          candidate.maxTravelRadiusKm
        );

        const availabilityScore = scoreAvailability(availabilityResult);

        const ratingScore = scoreRating(
          candidate.rating,
          candidate.completedJobs,
          candidate.totalReviews
        );

        const fairnessScore = scoreFairness(historyResult);

        const breakdown: ScoreBreakdown = {
          skillScore,
          proximityScore,
          availabilityScore,
          ratingScore,
          fairnessScore,
        };

        const compositeScore = computeCompositeScore(breakdown);

        const result: ScoredCandidate = {
          workerId: candidate.workerId,
          workerName: candidate.workerName,
          compositeScore,
          breakdown,
          distanceKm: haversineResult.distanceKm,
          rationale: '',
        };

        return {
          ...result,
          rationale: generateRationale(result),
        };
      })
    );

    // Sort and apply fairness redistribution
    const sorted = refinedCandidates.sort(
      (a, b) => b.compositeScore - a.compositeScore
    );

    const redistributed = applyFairnessRedistribution(
      sorted,
      this.recentTopWorkerIds
    );

    // Store refined results in tool results
    ctx.toolResults.set('refined_candidates', redistributed);
    ctx.toolResults.set(
      'matching_result',
      produceMatchingResult(redistributed)
    );
  }

  // ==========================================================================
  // PHASE 4: DECIDE
  // ==========================================================================

  /**
   * Make a final matching decision based on refined scores.
   *
   * - If top score â‰¥ CONFIDENCE_THRESHOLD â†’ recommend ranked candidates
   * - Otherwise â†’ return unranked top-5 for employer review
   * - Special case: emergency urgency â†’ lower threshold by 10%
   */
  async decide(
    ctx: AgentContext<OpportunityPerception, OpportunityDeliberation>
  ): Promise<AgentDecision> {
    const perception = ctx.perception;
    const refinedCandidates = ctx.toolResults.get('refined_candidates') as
      | ScoredCandidate[]
      | undefined;
    const matchingResult = ctx.toolResults.get('matching_result') as
      | MatchingResult
      | undefined;

    if (!matchingResult || !refinedCandidates) {
      return {
        classification: 'no_match',
        confidence: 0,
        reasoning: 'No candidates available for matching.',
        requiresHumanReview: true,
        data: { candidates: [], mode: 'unranked' },
      };
    }

    // Adjust threshold for emergency gigs
    const effectiveThreshold =
      perception?.gigRequirements.urgency === 'emergency'
        ? CONFIDENCE_THRESHOLD * 0.9
        : CONFIDENCE_THRESHOLD;

    const topScore =
      refinedCandidates.length > 0
        ? refinedCandidates[0]!.compositeScore
        : 0;

    const isRanked = topScore >= effectiveThreshold;

    return {
      classification: isRanked ? 'ranked_recommendation' : 'unranked_suggestion',
      confidence: topScore,
      reasoning: matchingResult.summary,
      requiresHumanReview: !isRanked,
      data: {
        mode: matchingResult.mode,
        candidates: matchingResult.candidates.map((c, i) => ({
          ...c,
          rank: isRanked ? i + 1 : undefined,
        })),
        gigId: perception?.gigRequirements.gigId,
        effectiveThreshold,
        totalCandidatesEvaluated: refinedCandidates.length,
      },
    };
  }

  // ==========================================================================
  // PHASE 5: ACT
  // ==========================================================================

  /**
   * Execute the matching decision:
   * 1. Emit `worker.matched` events for top candidates
   * 2. Create notification actions for matched workers
   * 3. Log the AgentDecisionLog
   * 4. Update the fairness buffer with new top workers
   */
  async act(
    ctx: AgentContext<OpportunityPerception, OpportunityDeliberation>
  ): Promise<AgentAction[]> {
    const decision = ctx.decision;
    const perception = ctx.perception;
    if (!decision || !perception) {
      return [];
    }

    const actions: AgentAction[] = [];
    const decisionData = decision.data as {
      candidates: Array<ScoredCandidate & { rank?: number }>;
      mode: string;
      gigId?: string;
    };

    const gigId = perception.gigRequirements.gigId;

    // --- 1. Emit worker.matched events ---
    for (let i = 0; i < decisionData.candidates.length; i++) {
      const candidate = decisionData.candidates[i]!;
      const rank = candidate.rank ?? i + 1;

      const matchEvent: AgentEvent = {
        id: generateId(),
        type: 'gig.assigned', // Using closest available event type
        timestamp: nowISO(),
        payload: {
          gigId,
          workerId: candidate.workerId,
          workerName: candidate.workerName,
          matchScore: candidate.compositeScore,
          rank,
          rationale: candidate.rationale,
          matchBreakdown: candidate.breakdown,
        },
        sourceId: this.agentId,
        correlationId: ctx.event.correlationId,
        metadata: {
          agentId: this.agentId,
          agentVersion: this.agentVersion,
          matchMode: decisionData.mode,
        },
      };

      // Publish the match event
      await this.eventBus.publish(matchEvent);

      actions.push({
        type: 'emit_event',
        description: `Emitted worker.matched for ${candidate.workerName} (rank ${rank}, score ${(candidate.compositeScore * 100).toFixed(1)}%)`,
        data: {
          eventId: matchEvent.id,
          workerId: candidate.workerId,
          rank,
          score: candidate.compositeScore,
        },
        timestamp: nowISO(),
      });
    }

    // --- 2. Create notifications ---
    for (const candidate of decisionData.candidates) {
      actions.push({
        type: 'notify',
        description: `Notification queued for ${candidate.workerName}: new gig match "${perception.gigRequirements.title}"`,
        data: {
          userId: candidate.workerId,
          notificationType: 'gig_invite',
          title: `New Gig Match: ${perception.gigRequirements.title}`,
          titleUrdu: `Ù†Ø¦ÛŒ Ú¯ÙÚ¯: ${perception.gigRequirements.title}`,
          message: `You've been matched to a ${perception.gigRequirements.category} gig. ${candidate.rationale}`,
          messageUrdu: `Ø¢Ù¾ Ú©Ùˆ ${perception.gigRequirements.category} Ú©Ø§Ù… Ø³Û’ Ù…Ù„Ø§ÛŒØ§ Ú¯ÛŒØ§ ÛÛ’Û”`,
          deepLink: {
            screen: 'gig_detail',
            gigId,
          },
        },
        timestamp: nowISO(),
      });
    }

    // --- 3. Log decision ---
    actions.push({
      type: 'log',
      description: `AgentDecisionLog recorded: ${decisionData.mode} matching for gig ${gigId}`,
      data: {
        decisionType: 'gig_recommendation',
        gigId,
        candidateCount: decisionData.candidates.length,
        mode: decisionData.mode,
        confidence: decision.confidence,
      },
      timestamp: nowISO(),
    });

    // --- 4. Update fairness buffer ---
    const topWorkerIds = decisionData.candidates
      .slice(0, 3)
      .map((c) => c.workerId);
    this.updateFairnessBuffer(topWorkerIds);

    return actions;
  }

  /**
   * Update the in-memory fairness buffer with new top-worker IDs.
   * Keeps only the most recent entries to prevent unbounded growth.
   */
  private updateFairnessBuffer(newTopWorkerIds: ReadonlyArray<string>): void {
    this.recentTopWorkerIds.push(...newTopWorkerIds);

    // Trim to buffer size
    while (
      this.recentTopWorkerIds.length >
      OpportunityMatcherAgent.FAIRNESS_BUFFER_SIZE
    ) {
      this.recentTopWorkerIds.shift();
    }
  }

  // ==========================================================================
  // PHASE 6: OBSERVE
  // ==========================================================================

  /**
   * Post-action monitoring and feedback loop.
   *
   * Tracks:
   * - Recommendation acceptance rates
   * - Matching latency (via ctx.timing)
   * - Candidate pool sizes
   * - Score distribution statistics
   *
   * In production, this data feeds into:
   * - Real-time dashboards
   * - Scoring weight auto-tuning
   * - Fairness policy adjustments
   */
  async observe(
    ctx: AgentContext<OpportunityPerception, OpportunityDeliberation>
  ): Promise<void> {
    const decision = ctx.decision;
    if (!decision) return;

    const decisionData = decision.data as {
      candidates: ScoredCandidate[];
      totalCandidatesEvaluated: number;
    };

    // Update acceptance tracker
    this.acceptanceTracker.totalRecommendations +=
      decisionData.candidates.length;

    // Log observation metrics
    const metrics = {
      invocationId: ctx.invocationId,
      agentId: this.agentId,
      timestamp: nowISO(),
      timing: { ...ctx.timing },
      candidatePoolSize: ctx.perception?.candidates.length ?? 0,
      evaluatedCount: decisionData.totalCandidatesEvaluated,
      recommendedCount: decisionData.candidates.length,
      topScore:
        decisionData.candidates.length > 0
          ? decisionData.candidates[0]!.compositeScore
          : 0,
      confidence: decision.confidence,
      classification: decision.classification,
      acceptanceRate:
        this.acceptanceTracker.totalRecommendations > 0
          ? this.acceptanceTracker.totalAccepted /
            this.acceptanceTracker.totalRecommendations
          : 0,
      errors: ctx.errors.length,
    };

    // In production, emit to monitoring:
    // await this.metricsClient.record('opportunity_matcher', metrics);
    // For now, store in tool results for test observability
    ctx.toolResults.set('observation_metrics', metrics);
  }

  /**
   * Record that a recommendation was accepted (called externally).
   * Feeds back into the acceptance rate metric.
   */
  recordAcceptance(workerId: string, _gigId: string): void {
    this.acceptanceTracker.totalAccepted++;
    // In production: update worker fairness profile, tune scoring weights
    void workerId; // Consumed by production telemetry
  }
}

// ============================================================================
// 4. FACTORY FUNCTION
// ============================================================================

/**
 * Create and return an OpportunityMatcher agent instance.
 *
 * @param eventBus The application's event bus for Pub/Sub communication.
 * @returns A fully configured OpportunityMatcherAgent ready for `initialize()`.
 *
 * @example
 * ```ts
 * import { createOpportunityMatcher } from '@/lib/agents/opportunity-matcher';
 *
 * const matcher = createOpportunityMatcher(eventBus);
 * matcher.initialize(); // Subscribes to gig.created, gig.updated, etc.
 *
 * // Later, when shutting down:
 * matcher.shutdown();
 * ```
 */
export function createOpportunityMatcher(
  eventBus: AgentEventBus
): OpportunityMatcherAgent {
  return new OpportunityMatcherAgent(eventBus);
}

// ============================================================================
// 5. RE-EXPORTS
// ============================================================================

export type { OpportunityPerception, OpportunityDeliberation };
export type {
  MatchingResult,
  ScoredCandidate,
  ScoreBreakdown,
} from './scoring';
export {
  CONFIDENCE_THRESHOLD,
  SCORING_WEIGHTS,
} from './scoring';

