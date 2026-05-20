// @ts-nocheck
// ============================================================================
// RozgarSync â€” FairWageNegotiator Agent
// ============================================================================
// Ensures fair wage negotiation between employers and workers in Pakistan's
// gig economy. Compares proposed rates against market data, inflation, and
// living costs. Can auto-generate counter-offers with bilingual reasoning.
//
// Implements the full Perceive â†’ Deliberate â†’ ToolUse â†’ Decide â†’ Act â†’ Observe
// agent lifecycle.
// ============================================================================

import type {
  ServiceCategory,
  Gig,
  GigApplicant,
  AgentDecisionLog,
  PriceRange,
} from '@/types';

import {
  type BaseAgent,
  type AgentContext,
  type AgentDecision,
  type AgentAction,
  type AgentError,
  type AgentEvent,
  type AgentEventBus,
  type AgentEventHandler,
  type AgentTool,
  type AgentStatus,
  type AgentLifecyclePhase,
  type BilingualText,
  type UnsubscribeFn,
  generateId,
  nowISO,
} from '@/lib/agents/core/types';

import {
  type AdjustedRateResult,
  type RateStats,
  calculateAdjustedRate,
  calculateLivingWage,
  getNationalAverageRate,
  getCityProfile,
  getSeasonalFactor,
  URGENCY_MULTIPLIERS,
  MINIMUM_WAGE_MONTHLY_PKR,
  MINIMUM_WAGE_DAILY_PKR,
  MINIMUM_WAGE_HOURLY_PKR,
  CURRENT_CPI_INFLATION_FACTOR,
} from './market-rates';

import {
  type WageClassification,
  type FairnessAssessment,
  type CounterOffer,
  type NegotiationInput,
  assessWageFairness,
  generateCounterOffer,
} from './negotiation-engine';

// ============================================================================
// 1. AGENT-SPECIFIC TYPES
// ============================================================================

/** Data extracted during the Perceive phase. */
export interface WagePerception {
  /** Source event type that triggered this invocation. */
  readonly trigger: 'gig.created' | 'application.submitted' | 'negotiation.requested';
  /** The gig being evaluated. */
  readonly gig: GigSnapshot;
  /** The rate being proposed (from employer budget or worker ask). */
  readonly proposedRate: number;
  /** Unit of the proposed rate. */
  readonly rateUnit: 'hourly' | 'daily' | 'fixed';
  /** Who proposed this rate. */
  readonly proposedBy: 'employer' | 'worker';
  /** Worker info (if applicable). */
  readonly worker?: WorkerSnapshot;
  /** Market rate for the category + city. */
  readonly marketRate: AdjustedRateResult;
  /** National average for comparison. */
  readonly nationalAverage: RateStats;
  /** City cost-of-living data. */
  readonly cityProfile: {
    readonly costOfLivingIndex: number;
    readonly livingWage: { monthly: number; daily: number; hourly: number };
  };
  /** Current seasonal factor. */
  readonly seasonalFactor: { factor: number; reason: string };
}

/** Minimal gig data needed for wage assessment. */
interface GigSnapshot {
  readonly id: string;
  readonly title: string;
  readonly category: ServiceCategory;
  readonly city: string;
  readonly budget: PriceRange;
  readonly urgency: 'low' | 'medium' | 'high' | 'emergency';
  readonly employerId: string;
  readonly employerName: string;
}

/** Minimal worker data needed for wage assessment. */
interface WorkerSnapshot {
  readonly id: string;
  readonly name: string;
  readonly experienceLevel: 'beginner' | 'intermediate' | 'expert';
  readonly rating: number;
  readonly completedJobs: number;
  readonly proposedRate: number;
  readonly proposedRateUnit: 'fixed' | 'hourly' | 'daily';
}

/** Analysis result from the Deliberate phase. */
export interface WageDeliberation {
  /** Comprehensive fairness assessment. */
  readonly assessment: FairnessAssessment;
  /** Input parameters used for the assessment. */
  readonly negotiationInput: NegotiationInput;
  /** Whether a counter-offer should be generated. */
  readonly needsCounterOffer: boolean;
  /** Whether the gig should be blocked for exploitative wages. */
  readonly shouldBlock: boolean;
  /** Urgency multiplier applied. */
  readonly urgencyMultiplier: number;
}

/** Tool results collected during the ToolUse phase. */
interface WageToolResults {
  readonly marketRateResult: {
    avg: number;
    median: number;
    p25: number;
    p75: number;
  };
  readonly fairnessScore: number;
  readonly counterOffer?: CounterOffer;
}

/** Event payload for `wage.assessed` events. */
export interface WageAssessedPayload {
  readonly gigId: string;
  readonly classification: WageClassification;
  readonly fairnessScore: number;
  readonly proposedRate: number;
  readonly marketMedian: number;
  readonly deviationPercent: number;
  readonly reasoning: BilingualText;
  readonly flags: Array<{ severity: string; code: string; message: BilingualText }>;
}

/** Event payload for `wage.counter_offer` events. */
export interface WageCounterOfferPayload {
  readonly gigId: string;
  readonly originalRate: number;
  readonly suggestedRate: number;
  readonly rateUnit: 'hourly' | 'daily' | 'fixed';
  readonly strategy: string;
  readonly reasoning: BilingualText;
  readonly acceptableRange: { min: number; max: number };
  readonly acceptanceProbability: number;
  readonly breakdown: Record<string, number>;
}

/** Negotiation outcome tracked in Observe phase. */
interface NegotiationOutcome {
  readonly gigId: string;
  readonly originalRate: number;
  readonly suggestedRate: number;
  readonly finalRate?: number;
  readonly outcome: 'accepted' | 'rejected' | 'modified' | 'pending';
  readonly timestamp: string;
}

// ============================================================================
// 2. AGENT TOOLS
// ============================================================================

/**
 * Tool: calculate_market_rate
 * Returns rate statistics for a category + city combination.
 */
function createMarketRateTool(): AgentTool<
  { category: ServiceCategory; city: string; experienceLevel: 'beginner' | 'intermediate' | 'expert'; rateUnit: 'hourly' | 'daily' | 'fixed' },
  { avg: number; median: number; p25: number; p75: number }
> {
  return {
    name: 'calculate_market_rate',
    description: 'Calculate market rate statistics for a category + city + experience combination',
    async execute(input) {
      const result = calculateAdjustedRate(
        input.category,
        input.city,
        input.experienceLevel,
        input.rateUnit
      );
      return {
        avg: result.adjustedRate.avg,
        median: result.adjustedRate.median,
        p25: result.adjustedRate.p25,
        p75: result.adjustedRate.p75,
      };
    },
  };
}

/**
 * Tool: assess_wage_fairness
 * Returns a fairness score 0â€“100 for a proposed rate.
 */
function createFairnessTool(): AgentTool<NegotiationInput, number> {
  return {
    name: 'assess_wage_fairness',
    description: 'Assess the fairness of a proposed wage rate, returning a score 0â€“100',
    async execute(input) {
      const assessment = assessWageFairness(input);
      return assessment.fairnessScore;
    },
  };
}

/**
 * Tool: generate_counter_offer
 * Computes an optimal counter-offer based on negotiation strategy.
 */
function createCounterOfferTool(): AgentTool<
  { input: NegotiationInput; assessment: FairnessAssessment },
  CounterOffer
> {
  return {
    name: 'generate_counter_offer',
    description: 'Generate an optimal counter-offer with bilingual reasoning',
    async execute({ input, assessment }) {
      return generateCounterOffer(input, assessment);
    },
  };
}

// ============================================================================
// 3. FAIR WAGE NEGOTIATOR AGENT
// ============================================================================

/** Confidence threshold â€” decisions below this require human review. */
const CONFIDENCE_THRESHOLD = 0.70;

/** Maximum gap percentage before a counter-offer is recommended. */
const COUNTER_OFFER_GAP_THRESHOLD = 20;

/**
 * The FairWageNegotiator agent.
 *
 * Subscribes to:
 * - `gig.created` â€” analyze if posted budget is fair
 * - `application.submitted` â€” worker proposed a rate, compare to market
 * - `negotiation.requested` â€” explicit negotiation request
 *
 * Emits:
 * - `wage.assessed` â€” classification + recommendation
 * - `wage.counter_offer` â€” generated counter-offer (if applicable)
 */
export interface FairWageNegotiatorAgent extends BaseAgent<WagePerception, WageDeliberation> {
  /** Agent tools available during ToolUse phase. */
  readonly tools: ReadonlyMap<string, AgentTool>;
  /** Tracked negotiation outcomes for the Observe phase. */
  readonly outcomes: NegotiationOutcome[];
  /** Moving average of market rates (updated in Observe). */
  readonly marketMovingAverages: Map<string, number[]>;
}

/**
 * Create and configure a FairWageNegotiator agent instance.
 *
 * @param eventBus - The application-wide event bus for Pub/Sub.
 * @returns A fully initialized FairWageNegotiatorAgent ready to handle events.
 *
 * @example
 * ```ts
 * import { createFairWageNegotiator } from '@/lib/agents/fair-wage-negotiator';
 * import { createEventBus } from '@/lib/agents/core/event-bus';
 *
 * const eventBus = createEventBus();
 * const negotiator = createFairWageNegotiator(eventBus);
 * negotiator.initialize();
 * ```
 */
export function createFairWageNegotiator(
  eventBus: AgentEventBus
): FairWageNegotiatorAgent {
  // --- Internal State ---
  const tools = new Map<string, AgentTool>();
  const outcomes: NegotiationOutcome[] = [];
  const marketMovingAverages = new Map<string, number[]>();
  const unsubscribers: UnsubscribeFn[] = [];
  let status: AgentStatus = 'idle';

  // Register tools
  const marketRateTool = createMarketRateTool();
  const fairnessTool = createFairnessTool();
  const counterOfferTool = createCounterOfferTool();
  tools.set(marketRateTool.name, marketRateTool);
  tools.set(fairnessTool.name, fairnessTool);
  tools.set(counterOfferTool.name, counterOfferTool);

  // ========================================================================
  // LIFECYCLE METHODS
  // ========================================================================

  /**
   * **Phase 1: Perceive**
   * Extract and normalize data from the triggering event.
   * Loads market rates, city cost-of-living, and seasonal factors.
   */
  async function perceive(
    ctx: AgentContext<WagePerception, WageDeliberation>
  ): Promise<WagePerception> {
    const startTime = performance.now();

    try {
      const event = ctx.event;
      const payload = event.payload as Record<string, unknown>;

      // Extract trigger type
      const trigger = event.type as WagePerception['trigger'];

      // Extract gig data from payload
      const gig = extractGigSnapshot(payload);
      const rateUnit = extractRateUnit(payload, gig.budget);

      // Extract worker data if applicable
      const worker = trigger === 'application.submitted' || trigger === 'negotiation.requested'
        ? extractWorkerSnapshot(payload)
        : undefined;

      // Determine proposed rate and proposer
      const { proposedRate, proposedBy } = extractProposedRate(
        trigger,
        payload,
        gig,
        worker
      );

      // Determine experience level for rate calculation
      const experienceLevel = worker?.experienceLevel ?? 'intermediate';

      // Load market rate data
      const marketRate = calculateAdjustedRate(
        gig.category,
        gig.city,
        experienceLevel,
        rateUnit
      );

      // Load national average
      const nationalAverage = getNationalAverageRate(gig.category, rateUnit);

      // Load city cost-of-living data
      const cityProfileData = getCityProfile(gig.city);
      const livingWage = calculateLivingWage(gig.city);

      // Load seasonal factor
      const seasonalFactor = getSeasonalFactor(gig.category);

      const perception: WagePerception = {
        trigger,
        gig,
        proposedRate,
        rateUnit,
        proposedBy,
        worker,
        marketRate,
        nationalAverage,
        cityProfile: {
          costOfLivingIndex: cityProfileData.costOfLivingIndex,
          livingWage,
        },
        seasonalFactor,
      };

      ctx.timing.perceive = performance.now() - startTime;
      return perception;
    } catch (error) {
      const agentError: AgentError = {
        phase: 'perceive',
        message: error instanceof Error ? error.message : 'Unknown perception error',
        code: 'PERCEIVE_FAILED',
        recoverable: false,
        timestamp: nowISO(),
      };
      ctx.errors.push(agentError);
      throw error;
    }
  }

  /**
   * **Phase 2: Deliberate**
   * Analyze the perception data and form a preliminary assessment.
   * Compares proposed rate against market data, minimum wage, and living costs.
   */
  async function deliberate(
    ctx: AgentContext<WagePerception, WageDeliberation>
  ): Promise<WageDeliberation> {
    const startTime = performance.now();

    try {
      const perception = ctx.perception;
      if (!perception) {
        throw new Error('Deliberate called without perception data');
      }

      // Build negotiation input
      const negotiationInput: NegotiationInput = {
        proposedRate: perception.proposedRate,
        rateUnit: perception.rateUnit,
        category: perception.gig.category,
        city: perception.gig.city,
        experienceLevel: perception.worker?.experienceLevel ?? 'intermediate',
        urgency: perception.gig.urgency,
        proposedBy: perception.proposedBy,
        budgetMin: perception.gig.budget.min,
        budgetMax: perception.gig.budget.max,
        workerMinRate: perception.worker?.proposedRate,
      };

      // Run fairness assessment
      const assessment = assessWageFairness(negotiationInput);

      // Determine if counter-offer is needed
      const needsCounterOffer =
        assessment.classification === 'exploitative' ||
        assessment.classification === 'below_market' ||
        Math.abs(assessment.deviationPercent) > COUNTER_OFFER_GAP_THRESHOLD;

      // Determine if blocking is needed
      const shouldBlock = assessment.classification === 'exploitative';

      // Get urgency multiplier
      const urgencyMultiplier = URGENCY_MULTIPLIERS[perception.gig.urgency] ?? 1.0;

      const deliberation: WageDeliberation = {
        assessment,
        negotiationInput,
        needsCounterOffer,
        shouldBlock,
        urgencyMultiplier,
      };

      ctx.timing.deliberate = performance.now() - startTime;
      return deliberation;
    } catch (error) {
      const agentError: AgentError = {
        phase: 'deliberate',
        message: error instanceof Error ? error.message : 'Unknown deliberation error',
        code: 'DELIBERATE_FAILED',
        recoverable: false,
        timestamp: nowISO(),
      };
      ctx.errors.push(agentError);
      throw error;
    }
  }

  /**
   * **Phase 3: ToolUse**
   * Invoke tools for specialized computation.
   * Runs market rate calculation, fairness assessment, and optional counter-offer.
   */
  async function toolUse(
    ctx: AgentContext<WagePerception, WageDeliberation>
  ): Promise<void> {
    const startTime = performance.now();

    try {
      const perception = ctx.perception;
      const deliberation = ctx.deliberation;
      if (!perception || !deliberation) {
        throw new Error('ToolUse called without perception/deliberation data');
      }

      // Tool 1: Calculate market rate
      const marketRateResult = await marketRateTool.execute({
        category: perception.gig.category,
        city: perception.gig.city,
        experienceLevel: perception.worker?.experienceLevel ?? 'intermediate',
        rateUnit: perception.rateUnit,
      });
      ctx.toolResults.set('calculate_market_rate', marketRateResult);

      // Tool 2: Assess fairness score
      const fairnessScore = await fairnessTool.execute(deliberation.negotiationInput);
      ctx.toolResults.set('assess_wage_fairness', fairnessScore);

      // Tool 3: Generate counter-offer (only if needed)
      if (deliberation.needsCounterOffer) {
        const counterOffer = await counterOfferTool.execute({
          input: deliberation.negotiationInput,
          assessment: deliberation.assessment,
        });
        ctx.toolResults.set('generate_counter_offer', counterOffer);
      }

      ctx.timing.tool_use = performance.now() - startTime;
    } catch (error) {
      const agentError: AgentError = {
        phase: 'tool_use',
        message: error instanceof Error ? error.message : 'Unknown tool error',
        code: 'TOOL_USE_FAILED',
        recoverable: true,
        timestamp: nowISO(),
      };
      ctx.errors.push(agentError);
      // Don't rethrow â€” tools are supplementary, we can still decide
    }
  }

  /**
   * **Phase 4: Decide**
   * Make a final decision based on all accumulated evidence.
   * Classifies the wage and determines whether to block, counter-offer, or approve.
   */
  async function decide(
    ctx: AgentContext<WagePerception, WageDeliberation>
  ): Promise<AgentDecision> {
    const startTime = performance.now();

    try {
      const deliberation = ctx.deliberation;
      if (!deliberation) {
        throw new Error('Decide called without deliberation data');
      }

      const { assessment } = deliberation;
      const counterOffer = ctx.toolResults.get('generate_counter_offer') as CounterOffer | undefined;

      // Calculate confidence based on data quality
      const confidence = calculateConfidence(assessment, ctx);

      // Determine if human review is needed
      const requiresHumanReview = confidence < CONFIDENCE_THRESHOLD;

      // Build decision
      const decision: AgentDecision = {
        classification: assessment.classification,
        confidence,
        reasoning: assessment.reasoning.en,
        requiresHumanReview,
        data: {
          classification: assessment.classification,
          fairnessScore: assessment.fairnessScore,
          deviationPercent: assessment.deviationPercent,
          belowMinimumWage: assessment.belowMinimumWage,
          belowLivingWage: assessment.belowLivingWage,
          shouldBlock: deliberation.shouldBlock,
          needsCounterOffer: deliberation.needsCounterOffer,
          counterOffer: counterOffer ?? null,
          flags: assessment.flags,
          reasoning: assessment.reasoning,
        },
      };

      ctx.decision = decision;
      ctx.timing.decide = performance.now() - startTime;
      return decision;
    } catch (error) {
      const agentError: AgentError = {
        phase: 'decide',
        message: error instanceof Error ? error.message : 'Unknown decision error',
        code: 'DECIDE_FAILED',
        recoverable: false,
        timestamp: nowISO(),
      };
      ctx.errors.push(agentError);
      throw error;
    }
  }

  /**
   * **Phase 5: Act**
   * Execute the decision: emit events, send notifications.
   * - Emit `wage.assessed` with classification and recommendation
   * - Emit `wage.counter_offer` if applicable
   * - Notify both parties with bilingual explanation
   */
  async function act(
    ctx: AgentContext<WagePerception, WageDeliberation>
  ): Promise<AgentAction[]> {
    const startTime = performance.now();
    const actions: AgentAction[] = [];

    try {
      const perception = ctx.perception;
      const deliberation = ctx.deliberation;
      const decision = ctx.decision;
      if (!perception || !deliberation || !decision) {
        throw new Error('Act called without complete context');
      }

      const { assessment } = deliberation;
      const counterOffer = decision.data['counterOffer'] as CounterOffer | null;

      // Action 1: Emit `wage.assessed` event
      const assessedPayload: WageAssessedPayload = {
        gigId: perception.gig.id,
        classification: assessment.classification,
        fairnessScore: assessment.fairnessScore,
        proposedRate: perception.proposedRate,
        marketMedian: assessment.marketRate.adjustedRate.median,
        deviationPercent: assessment.deviationPercent,
        reasoning: assessment.reasoning,
        flags: assessment.flags,
      };

      await eventBus.publish({
        id: generateId(),
        type: 'wage.assessed',
        timestamp: nowISO(),
        payload: assessedPayload,
        sourceId: agent.agentId,
        correlationId: ctx.event.correlationId,
      });

      actions.push({
        type: 'emit_event',
        description: `Emitted wage.assessed: ${assessment.classification} (score: ${assessment.fairnessScore}/100)`,
        data: assessedPayload as unknown as Record<string, unknown>,
        timestamp: nowISO(),
      });

      // Action 2: Emit `wage.counter_offer` if applicable
      if (counterOffer) {
        const counterOfferPayload: WageCounterOfferPayload = {
          gigId: perception.gig.id,
          originalRate: perception.proposedRate,
          suggestedRate: counterOffer.suggestedRate,
          rateUnit: counterOffer.rateUnit,
          strategy: counterOffer.strategy,
          reasoning: counterOffer.reasoning,
          acceptableRange: counterOffer.acceptableRange,
          acceptanceProbability: counterOffer.acceptanceProbability,
          breakdown: counterOffer.breakdown as unknown as Record<string, number>,
        };

        await eventBus.publish({
          id: generateId(),
          type: 'wage.counter_offer',
          timestamp: nowISO(),
          payload: counterOfferPayload,
          sourceId: agent.agentId,
          correlationId: ctx.event.correlationId,
        });

        actions.push({
          type: 'emit_event',
          description: `Emitted wage.counter_offer: PKR ${counterOffer.suggestedRate} (${counterOffer.strategy})`,
          data: counterOfferPayload as unknown as Record<string, unknown>,
          timestamp: nowISO(),
        });
      }

      // Action 3: Block exploitative gig with mandatory warning
      if (deliberation.shouldBlock) {
        actions.push({
          type: 'block',
          description: `BLOCKED: Exploitative wage detected for gig ${perception.gig.id}`,
          data: {
            gigId: perception.gig.id,
            reason: 'exploitative_wage',
            reasoning: assessment.reasoning,
          },
          timestamp: nowISO(),
        });
      }

      // Action 4: Notify both parties
      const employerNotification = buildNotification(
        'employer',
        perception,
        assessment,
        counterOffer
      );
      actions.push({
        type: 'notify',
        description: `Notified employer ${perception.gig.employerId}`,
        data: {
          userId: perception.gig.employerId,
          ...employerNotification,
        },
        timestamp: nowISO(),
      });

      if (perception.worker) {
        const workerNotification = buildNotification(
          'worker',
          perception,
          assessment,
          counterOffer
        );
        actions.push({
          type: 'notify',
          description: `Notified worker ${perception.worker.id}`,
          data: {
            userId: perception.worker.id,
            ...workerNotification,
          },
          timestamp: nowISO(),
        });
      }

      // Action 5: Log the decision
      actions.push({
        type: 'log',
        description: 'Logged agent decision to audit trail',
        data: {
          decisionType: 'price_suggestion',
          classification: assessment.classification,
          confidence: decision.confidence,
          fairnessScore: assessment.fairnessScore,
        },
        timestamp: nowISO(),
      });

      ctx.actions = actions;
      ctx.timing.act = performance.now() - startTime;
      return actions;
    } catch (error) {
      const agentError: AgentError = {
        phase: 'act',
        message: error instanceof Error ? error.message : 'Unknown action error',
        code: 'ACT_FAILED',
        recoverable: true,
        timestamp: nowISO(),
      };
      ctx.errors.push(agentError);
      throw error;
    }
  }

  /**
   * **Phase 6: Observe**
   * Track negotiation outcomes and update market rate moving averages.
   */
  async function observe(
    ctx: AgentContext<WagePerception, WageDeliberation>
  ): Promise<void> {
    const startTime = performance.now();

    try {
      const perception = ctx.perception;
      const decision = ctx.decision;
      if (!perception || !decision) return;

      const counterOffer = decision.data['counterOffer'] as CounterOffer | null;

      // Track the negotiation outcome
      const outcome: NegotiationOutcome = {
        gigId: perception.gig.id,
        originalRate: perception.proposedRate,
        suggestedRate: counterOffer?.suggestedRate ?? perception.proposedRate,
        outcome: 'pending',
        timestamp: nowISO(),
      };
      outcomes.push(outcome);

      // Update market rate moving averages
      const key = `${perception.gig.category}:${perception.gig.city}:${perception.rateUnit}`;
      const existing = marketMovingAverages.get(key) ?? [];
      existing.push(perception.proposedRate);

      // Keep only the last 100 data points for each category+city combo
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      marketMovingAverages.set(key, existing);

      // Log performance metrics
      const totalLatency = Object.values(ctx.timing).reduce((sum, t) => sum + t, 0);

      // eslint-disable-next-line no-console
      console.info(
        `[FairWageNegotiator] Completed analysis for gig ${perception.gig.id}`,
        {
          classification: decision.classification,
          confidence: decision.confidence,
          fairnessScore: (decision.data['fairnessScore'] as number) ?? 0,
          latencyMs: Math.round(totalLatency),
          errors: ctx.errors.length,
          actionsCount: ctx.actions.length,
        }
      );

      ctx.timing.observe = performance.now() - startTime;
    } catch (error) {
      // Observe phase errors are non-fatal â€” log and continue
      const agentError: AgentError = {
        phase: 'observe',
        message: error instanceof Error ? error.message : 'Unknown observe error',
        code: 'OBSERVE_FAILED',
        recoverable: true,
        timestamp: nowISO(),
      };
      ctx.errors.push(agentError);
    }
  }

  // ========================================================================
  // EVENT HANDLING ORCHESTRATION
  // ========================================================================

  /**
   * Run the complete 6-phase lifecycle for a given event.
   * Returns an AgentDecisionLog suitable for the immutable audit trail.
   */
  async function handleEvent(event: AgentEvent): Promise<AgentDecisionLog> {
    const invocationId = generateId();
    const startTime = performance.now();

    // Initialize context
    const ctx: AgentContext<WagePerception, WageDeliberation> = {
      invocationId,
      event,
      perception: undefined,
      deliberation: undefined,
      toolResults: new Map(),
      decision: undefined,
      actions: [],
      timing: {
        perceive: 0,
        deliberate: 0,
        tool_use: 0,
        decide: 0,
        act: 0,
        observe: 0,
      },
      errors: [],
    };

    status = 'processing';

    try {
      // Phase 1: Perceive
      ctx.perception = await perceive(ctx);

      // Phase 2: Deliberate
      ctx.deliberation = await deliberate(ctx);

      // Phase 3: ToolUse
      await toolUse(ctx);

      // Phase 4: Decide
      ctx.decision = await decide(ctx);

      // Phase 5: Act
      await act(ctx);

      // Phase 6: Observe
      await observe(ctx);

      status = 'idle';
    } catch (error) {
      status = 'error';

      // Ensure we have a decision even on failure
      if (!ctx.decision) {
        ctx.decision = {
          classification: 'error',
          confidence: 0,
          reasoning: error instanceof Error ? error.message : 'Unknown error during processing',
          requiresHumanReview: true,
          data: { error: true },
        };
      }
    }

    // Build the audit log
    const totalLatency = performance.now() - startTime;
    const inputSerialized = JSON.stringify({
      eventType: event.type,
      payload: event.payload,
    });
    const outputSerialized = JSON.stringify(ctx.decision);

    const decisionLog: AgentDecisionLog = {
      id: invocationId,
      decisionType: 'price_suggestion',
      agentVersion: agent.agentVersion,
      modelId: 'fair-wage-negotiator-v1',
      inputHash: await hashSHA256(inputSerialized),
      outputHash: await hashSHA256(outputSerialized),
      parentTraceId: null,
      sessionTraceId: event.correlationId,
      traceChainHash: await hashSHA256(
        `null:${await hashSHA256(inputSerialized)}:${await hashSHA256(outputSerialized)}`
      ),
      rationale: ctx.decision?.reasoning ?? 'No decision reached',
      gigId: ctx.perception?.gig.id,
      workerId: ctx.perception?.worker?.id,
      employerId: ctx.perception?.gig.employerId,
      confidence: ctx.decision?.confidence,
      latencyMs: Math.round(totalLatency),
      timestamp: null as unknown as import('firebase/firestore').Timestamp, // Set by Firestore server
      triggeredBy: event.sourceId,
    };

    return decisionLog;
  }

  /**
   * Initialize the agent: subscribe to events on the bus.
   */
  function initialize(): void {
    const handler: AgentEventHandler = async (event) => {
      try {
        await handleEvent(event);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `[FairWageNegotiator] Unhandled error processing ${event.type}:`,
          error
        );
        status = 'error';
      }
    };

    const unsub = eventBus.subscribeMany(
      ['gig.created', 'application.submitted', 'negotiation.requested'],
      handler
    );
    unsubscribers.push(unsub);

    status = 'idle';

    // eslint-disable-next-line no-console
    console.info(
      `[FairWageNegotiator] Initialized v${agent.agentVersion} â€” listening for gig.created, application.submitted, negotiation.requested`
    );
  }

  /**
   * Gracefully shut down: unsubscribe from all events.
   */
  function shutdown(): void {
    for (const unsub of unsubscribers) {
      unsub();
    }
    unsubscribers.length = 0;
    status = 'idle';

    // eslint-disable-next-line no-console
    console.info('[FairWageNegotiator] Shut down gracefully');
  }

  // ========================================================================
  // AGENT INSTANCE
  // ========================================================================

  const agent: FairWageNegotiatorAgent = {
    agentId: 'fair-wage-negotiator',
    agentName: 'Fair Wage Negotiator',
    agentVersion: '1.0.0',
    decisionTypes: ['price_suggestion'],
    get status() {
      return status;
    },
    set status(s: AgentStatus) {
      status = s;
    },
    tools,
    outcomes,
    marketMovingAverages,

    // Lifecycle methods
    perceive,
    deliberate,
    toolUse,
    decide,
    act,
    observe,
    handleEvent,
    initialize,
    shutdown,
  };

  return agent;
}

// ============================================================================
// 4. INTERNAL HELPERS
// ============================================================================

/**
 * Extract a minimal GigSnapshot from the event payload.
 * Handles both full Gig objects and partial payloads.
 */
function extractGigSnapshot(payload: Record<string, unknown>): GigSnapshot {
  const gig = (payload['gig'] ?? payload) as Partial<Gig>;

  if (!gig.id || !gig.category || !gig.city) {
    throw new Error(
      'Invalid event payload: missing required gig fields (id, category, city)'
    );
  }

  return {
    id: gig.id,
    title: gig.title ?? 'Untitled Gig',
    category: gig.category,
    city: gig.city,
    budget: gig.budget ?? { min: 0, max: 0, currency: 'PKR', unit: 'fixed' },
    urgency: gig.urgency ?? 'low',
    employerId: gig.employerId ?? 'unknown',
    employerName: gig.employerName ?? 'Unknown Employer',
  };
}

/**
 * Extract worker snapshot from event payload.
 */
function extractWorkerSnapshot(payload: Record<string, unknown>): WorkerSnapshot | undefined {
  const applicant = payload['applicant'] as Partial<GigApplicant> | undefined;
  const worker = payload['worker'] as Record<string, unknown> | undefined;

  if (applicant) {
    return {
      id: applicant.workerId ?? 'unknown',
      name: applicant.workerName ?? 'Unknown Worker',
      experienceLevel: (applicant as Record<string, unknown>)['experienceLevel'] as
        | 'beginner'
        | 'intermediate'
        | 'expert' ?? 'intermediate',
      rating: applicant.workerRating ?? 0,
      completedJobs: 0,
      proposedRate: applicant.proposedRate ?? 0,
      proposedRateUnit: applicant.proposedRateUnit ?? 'fixed',
    };
  }

  if (worker) {
    return {
      id: (worker['id'] as string) ?? 'unknown',
      name: (worker['name'] as string) ?? 'Unknown Worker',
      experienceLevel: (worker['experienceLevel'] as 'beginner' | 'intermediate' | 'expert') ?? 'intermediate',
      rating: (worker['rating'] as number) ?? 0,
      completedJobs: (worker['completedJobs'] as number) ?? 0,
      proposedRate: (worker['proposedRate'] as number) ?? 0,
      proposedRateUnit: (worker['proposedRateUnit'] as 'fixed' | 'hourly' | 'daily') ?? 'fixed',
    };
  }

  return undefined;
}

/**
 * Determine the rate unit from the payload or budget.
 */
function extractRateUnit(
  payload: Record<string, unknown>,
  budget: PriceRange
): 'hourly' | 'daily' | 'fixed' {
  const explicit = payload['rateUnit'] as string | undefined;
  if (explicit === 'hourly' || explicit === 'daily' || explicit === 'fixed') {
    return explicit;
  }
  return budget.unit;
}

/**
 * Extract the proposed rate and who proposed it from the event context.
 */
function extractProposedRate(
  trigger: WagePerception['trigger'],
  payload: Record<string, unknown>,
  gig: GigSnapshot,
  worker?: WorkerSnapshot
): { proposedRate: number; proposedBy: 'employer' | 'worker' } {
  switch (trigger) {
    case 'gig.created':
      // Employer set the budget â€” use midpoint of budget range
      return {
        proposedRate: Math.round((gig.budget.min + gig.budget.max) / 2),
        proposedBy: 'employer',
      };

    case 'application.submitted':
      // Worker proposed a rate
      return {
        proposedRate: worker?.proposedRate ?? Math.round((gig.budget.min + gig.budget.max) / 2),
        proposedBy: 'worker',
      };

    case 'negotiation.requested': {
      // Could be from either side
      const requestedRate = payload['requestedRate'] as number | undefined;
      const requestedBy = payload['requestedBy'] as 'employer' | 'worker' | undefined;
      return {
        proposedRate: requestedRate ?? Math.round((gig.budget.min + gig.budget.max) / 2),
        proposedBy: requestedBy ?? 'employer',
      };
    }
  }
}

/**
 * Calculate decision confidence based on data quality and assessment agreement.
 */
function calculateConfidence(
  assessment: FairnessAssessment,
  ctx: AgentContext<WagePerception, WageDeliberation>
): number {
  let confidence = 0.80; // Base confidence

  // Higher confidence for clear-cut cases
  if (assessment.fairnessScore >= 90 || assessment.fairnessScore <= 10) {
    confidence += 0.10; // Very clear signal
  }

  // Lower confidence if there are tool errors
  const toolErrorCount = ctx.errors.filter((e) => e.phase === 'tool_use').length;
  confidence -= toolErrorCount * 0.10;

  // Lower confidence for edge cases (scores near thresholds)
  if (assessment.fairnessScore >= 45 && assessment.fairnessScore <= 55) {
    confidence -= 0.10; // Borderline case
  }

  // Higher confidence when tool results corroborate deliberation
  const toolFairness = ctx.toolResults.get('assess_wage_fairness') as number | undefined;
  if (toolFairness !== undefined) {
    const agreement = Math.abs(toolFairness - assessment.fairnessScore);
    if (agreement < 5) confidence += 0.05;
  }

  return Math.max(0.10, Math.min(0.99, confidence));
}

/**
 * Build a bilingual notification for either employer or worker.
 */
function buildNotification(
  recipient: 'employer' | 'worker',
  perception: WagePerception,
  assessment: FairnessAssessment,
  counterOffer: CounterOffer | null
): { title: BilingualText; message: BilingualText } {
  if (recipient === 'employer') {
    return {
      title: {
        en: `Wage Assessment: ${assessment.classification.replace('_', ' ').toUpperCase()}`,
        ur: `Ø§Ø¬Ø±Øª Ú©ÛŒ ØªØ´Ø®ÛŒØµ: ${getClassificationUrdu(assessment.classification)}`,
      },
      message: {
        en: counterOffer
          ? `Your proposed budget of PKR ${perception.proposedRate} for "${perception.gig.title}" has been assessed. Market rate is PKR ${assessment.marketRate.adjustedRate.median}. We suggest PKR ${counterOffer.suggestedRate} for a fair agreement.`
          : `Your proposed budget of PKR ${perception.proposedRate} for "${perception.gig.title}" has been assessed as ${assessment.classification.replace('_', ' ')}. Market rate: PKR ${assessment.marketRate.adjustedRate.median}.`,
        ur: counterOffer
          ? `"${perception.gig.title}" Ú©Û’ Ù„ÛŒÛ’ Ø¢Ù¾ Ú©ÛŒ ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û ${perception.proposedRate} Ø±ÙˆÙ¾Û’ Ú©Ø§ Ø¬Ø§Ø¦Ø²Û Ù„ÛŒØ§ Ú¯ÛŒØ§Û” Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø±ÛŒÙ¹ ${assessment.marketRate.adjustedRate.median} Ø±ÙˆÙ¾Û’ ÛÛ’Û” Ù…Ù†ØµÙØ§Ù†Û Ù…Ø¹Ø§ÛØ¯Û’ Ú©Û’ Ù„ÛŒÛ’ ÛÙ… ${counterOffer.suggestedRate} Ø±ÙˆÙ¾Û’ ØªØ¬ÙˆÛŒØ² Ú©Ø±ØªÛ’ ÛÛŒÚºÛ”`
          : `"${perception.gig.title}" Ú©Û’ Ù„ÛŒÛ’ Ø¢Ù¾ Ú©ÛŒ ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û ${perception.proposedRate} Ø±ÙˆÙ¾Û’ ${getClassificationUrdu(assessment.classification)} Ù‚Ø±Ø§Ø± Ø¯ÛŒ Ú¯Ø¦ÛŒÛ” Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø±ÛŒÙ¹: ${assessment.marketRate.adjustedRate.median} Ø±ÙˆÙ¾Û’Û”`,
      },
    };
  }

  // Worker notification
  return {
    title: {
      en: `Wage Fairness Check: ${assessment.classification.replace('_', ' ').toUpperCase()}`,
      ur: `Ø§Ø¬Ø±Øª Ù…Ù†ØµÙØ§Ù†Û Ø¬Ø§Ù†Ú†: ${getClassificationUrdu(assessment.classification)}`,
    },
    message: {
      en: counterOffer
        ? `The rate for "${perception.gig.title}" has been reviewed. Your proposed PKR ${perception.proposedRate} vs market rate PKR ${assessment.marketRate.adjustedRate.median}. Recommended rate: PKR ${counterOffer.suggestedRate}.`
        : `The rate for "${perception.gig.title}" is ${assessment.classification.replace('_', ' ')} at PKR ${perception.proposedRate}. Market rate: PKR ${assessment.marketRate.adjustedRate.median}.`,
      ur: counterOffer
        ? `"${perception.gig.title}" Ú©ÛŒ Ø´Ø±Ø­ Ú©Ø§ Ø¬Ø§Ø¦Ø²Û Ù„ÛŒØ§ Ú¯ÛŒØ§Û” Ø¢Ù¾ Ú©ÛŒ ØªØ¬ÙˆÛŒØ² ${perception.proposedRate} Ø±ÙˆÙ¾Û’ Ø¨Ù…Ù‚Ø§Ø¨Ù„Û Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø±ÛŒÙ¹ ${assessment.marketRate.adjustedRate.median} Ø±ÙˆÙ¾Û’Û” ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­: ${counterOffer.suggestedRate} Ø±ÙˆÙ¾Û’Û”`
        : `"${perception.gig.title}" Ú©ÛŒ Ø´Ø±Ø­ ${perception.proposedRate} Ø±ÙˆÙ¾Û’ ${getClassificationUrdu(assessment.classification)} ÛÛ’Û” Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø±ÛŒÙ¹: ${assessment.marketRate.adjustedRate.median} Ø±ÙˆÙ¾Û’Û”`,
    },
  };
}

/**
 * Get Urdu translation for wage classification.
 */
function getClassificationUrdu(classification: WageClassification): string {
  const translations: Record<WageClassification, string> = {
    fair: 'Ù…Ù†ØµÙØ§Ù†Û',
    below_market: 'Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø³Û’ Ú©Ù…',
    above_market: 'Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø³Û’ Ø²ÛŒØ§Ø¯Û',
    exploitative: 'Ø§Ø³ØªØ­ØµØ§Ù„ÛŒ',
  };
  return translations[classification];
}

/**
 * Compute SHA-256 hash using the Web Crypto API.
 * Used for audit trail integrity hashes.
 */
async function hashSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

