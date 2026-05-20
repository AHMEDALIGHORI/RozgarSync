// @ts-nocheck
// ============================================================================
// RozgarSync â€” FairWageNegotiator: Negotiation Engine
// ============================================================================
// Counter-offer generation logic. Given a proposed rate, market data, and
// negotiation parameters, produces an optimal counter-offer with bilingual
// reasoning suitable for both employer and worker audiences.
// ============================================================================

import type { ServiceCategory } from '@/types';
import type { BilingualText } from '@/lib/agents/core/types';
import {
  type AdjustedRateResult,
  type RateStats,
  calculateAdjustedRate,
  calculateLivingWage,
  URGENCY_MULTIPLIERS,
  MINIMUM_WAGE_HOURLY_PKR,
  MINIMUM_WAGE_DAILY_PKR,
} from './market-rates';

// ============================================================================
// 1. TYPES
// ============================================================================

/** Wage fairness classification. */
export type WageClassification =
  | 'fair'
  | 'below_market'
  | 'above_market'
  | 'exploitative';

/** Input parameters for the negotiation engine. */
export interface NegotiationInput {
  /** The proposed rate (from employer budget or worker ask). */
  readonly proposedRate: number;
  /** Unit of the proposed rate. */
  readonly rateUnit: 'hourly' | 'daily' | 'fixed';
  /** Service category. */
  readonly category: ServiceCategory;
  /** City where the gig is located. */
  readonly city: string;
  /** Worker's experience level. */
  readonly experienceLevel: 'beginner' | 'intermediate' | 'expert';
  /** Gig urgency level. */
  readonly urgency: 'low' | 'medium' | 'high' | 'emergency';
  /** Whether the rate was proposed by the employer or worker. */
  readonly proposedBy: 'employer' | 'worker';
  /** Optional: employer's original budget range. */
  readonly budgetMin?: number;
  readonly budgetMax?: number;
  /** Optional: worker's minimum acceptable rate. */
  readonly workerMinRate?: number;
}

/** Result of a fairness assessment. */
export interface FairnessAssessment {
  /** Overall classification. */
  readonly classification: WageClassification;
  /** Fairness score 0â€“100 (100 = perfectly fair). */
  readonly fairnessScore: number;
  /** How far off the proposed rate is from market median (percentage). */
  readonly deviationPercent: number;
  /** Whether the rate violates minimum wage laws. */
  readonly belowMinimumWage: boolean;
  /** Whether the rate is below city living wage. */
  readonly belowLivingWage: boolean;
  /** Market rate data used for comparison. */
  readonly marketRate: AdjustedRateResult;
  /** Living wage for the city. */
  readonly livingWage: number;
  /** Detailed reasoning. */
  readonly reasoning: BilingualText;
  /** Risk flags. */
  readonly flags: WageFlag[];
}

/** A specific risk or noteworthy flag. */
export interface WageFlag {
  readonly severity: 'info' | 'warning' | 'critical';
  readonly code: string;
  readonly message: BilingualText;
}

/** A generated counter-offer. */
export interface CounterOffer {
  /** The suggested counter rate. */
  readonly suggestedRate: number;
  /** Rate unit. */
  readonly rateUnit: 'hourly' | 'daily' | 'fixed';
  /** Strategy used to generate this counter. */
  readonly strategy: NegotiationStrategy;
  /** Detailed reasoning for both parties. */
  readonly reasoning: BilingualText;
  /** Breakdown showing how the rate was calculated. */
  readonly breakdown: CounterOfferBreakdown;
  /** Acceptable range â€” both parties should be OK within this band. */
  readonly acceptableRange: { min: number; max: number };
  /** Confidence that this counter-offer will be accepted. */
  readonly acceptanceProbability: number;
}

/** Strategy applied to generate the counter-offer. */
export type NegotiationStrategy =
  | 'split_the_difference'
  | 'minimum_floor_enforcement'
  | 'premium_allowance'
  | 'market_alignment'
  | 'living_wage_enforcement';

/** Breakdown showing calculation components. */
export interface CounterOfferBreakdown {
  readonly baseMarketRate: number;
  readonly experienceAdjustment: number;
  readonly cityAdjustment: number;
  readonly seasonalAdjustment: number;
  readonly urgencyPremium: number;
  readonly inflationAdjustment: number;
  readonly finalRate: number;
}

// ============================================================================
// 2. FAIRNESS ASSESSMENT
// ============================================================================

/**
 * Assess the fairness of a proposed wage rate.
 *
 * Scoring methodology:
 * - 100: Exactly at market median
 * - 80â€“100: Within P25â€“P75 (fair zone)
 * - 60â€“79: Slightly below P25 or above P75
 * - 40â€“59: Significantly below market
 * - 0â€“39: Exploitative (far below minimum wage or living wage)
 */
export function assessWageFairness(input: NegotiationInput): FairnessAssessment {
  const marketRate = calculateAdjustedRate(
    input.category,
    input.city,
    input.experienceLevel,
    input.rateUnit
  );

  const livingWageData = calculateLivingWage(input.city);
  const livingWageForUnit = getLivingWageForUnit(livingWageData, input.rateUnit);
  const minWageForUnit = getMinWageForUnit(input.rateUnit);

  const adjusted = marketRate.adjustedRate;
  const proposed = input.proposedRate;

  // Calculate deviation from median
  const deviationPercent = ((proposed - adjusted.median) / adjusted.median) * 100;

  // Check minimum wage and living wage violations
  const belowMinimumWage = proposed < minWageForUnit;
  const belowLivingWage = proposed < livingWageForUnit;

  // Calculate fairness score
  const fairnessScore = calculateFairnessScore(proposed, adjusted, minWageForUnit, livingWageForUnit);

  // Classify
  const classification = classifyWage(fairnessScore, deviationPercent, belowMinimumWage);

  // Build flags
  const flags = buildFlags(
    proposed,
    adjusted,
    minWageForUnit,
    livingWageForUnit,
    input
  );

  // Build reasoning
  const reasoning = buildFairnessReasoning(
    classification,
    proposed,
    adjusted,
    deviationPercent,
    input,
    belowMinimumWage,
    belowLivingWage
  );

  return {
    classification,
    fairnessScore,
    deviationPercent: Math.round(deviationPercent * 100) / 100,
    belowMinimumWage,
    belowLivingWage,
    marketRate,
    livingWage: livingWageForUnit,
    reasoning,
    flags,
  };
}

// ============================================================================
// 3. COUNTER-OFFER GENERATION
// ============================================================================

/**
 * Generate an optimal counter-offer based on the fairness assessment.
 *
 * Strategy selection:
 * 1. If exploitative (below min wage) â†’ minimum_floor_enforcement
 * 2. If below living wage â†’ living_wage_enforcement
 * 3. If gap â‰¤ 20% â†’ market_alignment (gentle nudge)
 * 4. If gap > 20% but â‰¤ 40% â†’ split_the_difference
 * 5. If urgent/emergency gig â†’ premium_allowance (on top of chosen strategy)
 */
export function generateCounterOffer(
  input: NegotiationInput,
  assessment: FairnessAssessment
): CounterOffer {
  const { adjustedRate: market } = assessment.marketRate;
  const proposed = input.proposedRate;
  const gap = Math.abs(assessment.deviationPercent);
  const urgencyMultiplier = URGENCY_MULTIPLIERS[input.urgency] ?? 1.0;

  // Determine strategy
  const strategy = selectStrategy(assessment, gap, input.urgency);

  // Calculate the counter rate based on strategy
  let suggestedRate: number;

  switch (strategy) {
    case 'minimum_floor_enforcement': {
      const minWage = getMinWageForUnit(input.rateUnit);
      // Enforce minimum wage with a small buffer above it
      suggestedRate = Math.round(minWage * 1.1 * urgencyMultiplier);
      break;
    }

    case 'living_wage_enforcement': {
      // Enforce living wage as the floor
      suggestedRate = Math.round(assessment.livingWage * urgencyMultiplier);
      break;
    }

    case 'split_the_difference': {
      // Meet in the middle between proposed and market median
      const midpoint = (proposed + market.median) / 2;
      suggestedRate = Math.round(midpoint * urgencyMultiplier);
      break;
    }

    case 'premium_allowance': {
      // Start from market median and add urgency premium
      suggestedRate = Math.round(market.median * urgencyMultiplier);
      break;
    }

    case 'market_alignment': {
      // Gently nudge toward market median
      const nudgeFactor = proposed < market.median ? 0.7 : 0.3;
      suggestedRate = Math.round(
        proposed + (market.median - proposed) * nudgeFactor
      );
      suggestedRate = Math.round(suggestedRate * urgencyMultiplier);
      break;
    }
  }

  // Enforce absolute floor
  const absoluteFloor = getMinWageForUnit(input.rateUnit);
  suggestedRate = Math.max(suggestedRate, absoluteFloor);

  // If employer-proposed, respect their budget max as a ceiling
  if (input.proposedBy === 'employer' && input.budgetMax !== undefined) {
    suggestedRate = Math.min(suggestedRate, Math.round(input.budgetMax * 1.1));
  }

  // Calculate acceptable range
  const acceptableRange = {
    min: Math.max(Math.round(suggestedRate * 0.9), absoluteFloor),
    max: Math.round(suggestedRate * 1.15),
  };

  // Build breakdown
  const breakdown = buildBreakdown(input, assessment.marketRate, urgencyMultiplier);

  // Calculate acceptance probability
  const acceptanceProbability = estimateAcceptanceProbability(
    proposed,
    suggestedRate,
    market,
    strategy
  );

  // Build bilingual reasoning
  const reasoning = buildCounterOfferReasoning(
    strategy,
    proposed,
    suggestedRate,
    market,
    input,
    assessment
  );

  return {
    suggestedRate,
    rateUnit: input.rateUnit,
    strategy,
    reasoning,
    breakdown,
    acceptableRange,
    acceptanceProbability: Math.round(acceptanceProbability * 100) / 100,
  };
}

// ============================================================================
// 4. INTERNAL HELPERS
// ============================================================================

/** Calculate fairness score 0â€“100. */
function calculateFairnessScore(
  proposed: number,
  market: RateStats,
  minWage: number,
  livingWage: number
): number {
  // Start with how close the proposed rate is to the median
  const deviation = Math.abs(proposed - market.median) / market.median;

  let score: number;

  if (proposed < minWage) {
    // Below minimum wage: score 0â€“20 based on how far below
    const ratio = proposed / minWage;
    score = Math.max(0, Math.round(ratio * 20));
  } else if (proposed < livingWage) {
    // Below living wage: score 20â€“40
    const ratio = (proposed - minWage) / (livingWage - minWage);
    score = 20 + Math.round(ratio * 20);
  } else if (proposed >= market.p25 && proposed <= market.p75) {
    // Within P25â€“P75: score 80â€“100
    // Closer to median = higher score
    const withinIQR = 1 - deviation;
    score = 80 + Math.round(withinIQR * 20);
  } else if (proposed < market.p25) {
    // Below P25 but above living wage: score 40â€“80
    const ratio = (proposed - livingWage) / Math.max(market.p25 - livingWage, 1);
    score = 40 + Math.round(Math.min(ratio, 1) * 40);
  } else {
    // Above P75: score 70â€“95 (generous but slightly unusual)
    const overshoot = (proposed - market.p75) / market.p75;
    score = Math.max(70, 95 - Math.round(overshoot * 50));
  }

  return Math.max(0, Math.min(100, score));
}

/** Classify wage based on score and deviation. */
function classifyWage(
  score: number,
  deviationPercent: number,
  belowMinWage: boolean
): WageClassification {
  if (belowMinWage || score < 25) return 'exploitative';
  if (deviationPercent < -20 || score < 50) return 'below_market';
  if (deviationPercent > 30) return 'above_market';
  return 'fair';
}

/** Build warning/info flags. */
function buildFlags(
  proposed: number,
  market: RateStats,
  minWage: number,
  livingWage: number,
  input: NegotiationInput
): WageFlag[] {
  const flags: WageFlag[] = [];

  if (proposed < minWage) {
    flags.push({
      severity: 'critical',
      code: 'BELOW_MINIMUM_WAGE',
      message: {
        en: `Proposed rate PKR ${proposed} is below the legal minimum wage of PKR ${minWage}/${input.rateUnit}.`,
        ur: `ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­ ${proposed} Ø±ÙˆÙ¾Û’ Ù‚Ø§Ù†ÙˆÙ†ÛŒ Ú©Ù… Ø§Ø² Ú©Ù… Ø§Ø¬Ø±Øª ${minWage} Ø±ÙˆÙ¾Û’/${input.rateUnit === 'hourly' ? 'ÙÛŒ Ú¯Ú¾Ù†Ù¹Û' : input.rateUnit === 'daily' ? 'ÙÛŒ Ø¯Ù†' : 'Ù…Ù‚Ø±Ø±Û'} Ø³Û’ Ú©Ù… ÛÛ’Û”`,
      },
    });
  }

  if (proposed < livingWage && proposed >= minWage) {
    flags.push({
      severity: 'warning',
      code: 'BELOW_LIVING_WAGE',
      message: {
        en: `Proposed rate PKR ${proposed} is below the estimated living wage of PKR ${livingWage}/${input.rateUnit} for ${input.city}.`,
        ur: `ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­ ${proposed} Ø±ÙˆÙ¾Û’ ${input.city} Ú©Û’ Ù„ÛŒÛ’ ØªØ®Ù…ÛŒÙ†ÛŒ Ú¯Ø²Ø§Ø±Û’ Ú©ÛŒ Ø§Ø¬Ø±Øª ${livingWage} Ø±ÙˆÙ¾Û’ Ø³Û’ Ú©Ù… ÛÛ’Û”`,
      },
    });
  }

  if (proposed > market.p75 * 1.5) {
    flags.push({
      severity: 'info',
      code: 'SIGNIFICANTLY_ABOVE_MARKET',
      message: {
        en: `Proposed rate PKR ${proposed} is significantly above market rates (P75: PKR ${market.p75}). This is generous but may indicate inflated expectations.`,
        ur: `ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­ ${proposed} Ø±ÙˆÙ¾Û’ Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø±ÛŒÙ¹ (${market.p75} Ø±ÙˆÙ¾Û’) Ø³Û’ Ù†Ù…Ø§ÛŒØ§Úº Ø·ÙˆØ± Ù¾Ø± Ø²ÛŒØ§Ø¯Û ÛÛ’Û”`,
      },
    });
  }

  if (input.urgency === 'emergency') {
    flags.push({
      severity: 'info',
      code: 'EMERGENCY_GIG_PREMIUM',
      message: {
        en: 'This is an emergency gig â€” a 35% premium is standard for urgent work requiring immediate availability.',
        ur: 'ÛŒÛ Ø§ÛŒÚ© ÛÙ†Ú¯Ø§Ù…ÛŒ Ú©Ø§Ù… ÛÛ’ â€” ÙÙˆØ±ÛŒ Ø¯Ø³ØªÛŒØ§Ø¨ÛŒ Ú©Û’ Ù„ÛŒÛ’ 35% Ù¾Ø±ÛŒÙ…ÛŒÙ… Ù…Ø¹ÛŒØ§Ø±ÛŒ ÛÛ’Û”',
      },
    });
  }

  if (input.experienceLevel === 'beginner' && proposed > market.median) {
    flags.push({
      severity: 'info',
      code: 'BEGINNER_ABOVE_MEDIAN',
      message: {
        en: 'Rate is above median for a beginner-level worker. Consider experience-adjusted pricing.',
        ur: 'Ø´Ø±Ø­ Ù†Ø¦Û’ Ú©Ø§Ø±Ú©Ù† Ú©Û’ Ù„ÛŒÛ’ Ø¯Ø±Ù…ÛŒØ§Ù†Û’ Ø³Û’ Ø²ÛŒØ§Ø¯Û ÛÛ’Û” ØªØ¬Ø±Ø¨Û’ Ú©Û’ Ù…Ø·Ø§Ø¨Ù‚ Ù‚ÛŒÙ…Øª Ù¾Ø± ØºÙˆØ± Ú©Ø±ÛŒÚºÛ”',
      },
    });
  }

  return flags;
}

/** Select the optimal negotiation strategy. */
function selectStrategy(
  assessment: FairnessAssessment,
  gap: number,
  urgency: string
): NegotiationStrategy {
  if (assessment.belowMinimumWage) return 'minimum_floor_enforcement';
  if (assessment.belowLivingWage) return 'living_wage_enforcement';
  if (urgency === 'emergency' || urgency === 'high') return 'premium_allowance';
  if (gap > 20) return 'split_the_difference';
  return 'market_alignment';
}

/** Build the calculation breakdown. */
function buildBreakdown(
  input: NegotiationInput,
  marketRate: AdjustedRateResult,
  urgencyMultiplier: number
): CounterOfferBreakdown {
  const base = marketRate.baseRate.median;
  const city = base * marketRate.costOfLivingIndex;
  const experience = city * marketRate.experienceMultiplier;
  const seasonal = experience * marketRate.seasonalFactor;
  const inflation = seasonal * marketRate.inflationFactor;
  const finalRate = inflation * urgencyMultiplier;

  return {
    baseMarketRate: Math.round(base),
    cityAdjustment: Math.round(city - base),
    experienceAdjustment: Math.round(experience - city),
    seasonalAdjustment: Math.round(seasonal - experience),
    inflationAdjustment: Math.round(inflation - seasonal),
    urgencyPremium: Math.round(finalRate - inflation),
    finalRate: Math.round(finalRate),
  };
}

/** Estimate the probability of the counter-offer being accepted. */
function estimateAcceptanceProbability(
  proposed: number,
  suggested: number,
  market: RateStats,
  strategy: NegotiationStrategy
): number {
  // Base probability from strategy
  const strategyBase: Record<NegotiationStrategy, number> = {
    market_alignment: 0.85,
    split_the_difference: 0.70,
    premium_allowance: 0.75,
    living_wage_enforcement: 0.55,
    minimum_floor_enforcement: 0.40,
  };

  let probability = strategyBase[strategy];

  // Adjust based on how close the counter is to the original proposal
  const changeRatio = Math.abs(suggested - proposed) / proposed;
  if (changeRatio < 0.1) probability += 0.10;
  else if (changeRatio < 0.2) probability += 0.05;
  else if (changeRatio > 0.4) probability -= 0.15;
  else if (changeRatio > 0.3) probability -= 0.10;

  // Adjust based on whether the counter is within market IQR
  if (suggested >= market.p25 && suggested <= market.p75) {
    probability += 0.05;
  }

  return Math.max(0.1, Math.min(0.95, probability));
}

/** Get the living wage value for a specific rate unit. */
function getLivingWageForUnit(
  livingWage: { monthly: number; daily: number; hourly: number },
  rateUnit: 'hourly' | 'daily' | 'fixed'
): number {
  switch (rateUnit) {
    case 'hourly':
      return livingWage.hourly;
    case 'daily':
      return livingWage.daily;
    case 'fixed':
      // For fixed-rate gigs, use daily living wage as proxy
      return livingWage.daily;
  }
}

/** Get minimum wage for a specific rate unit. */
function getMinWageForUnit(rateUnit: 'hourly' | 'daily' | 'fixed'): number {
  switch (rateUnit) {
    case 'hourly':
      return MINIMUM_WAGE_HOURLY_PKR;
    case 'daily':
      return MINIMUM_WAGE_DAILY_PKR;
    case 'fixed':
      // For fixed gigs, use daily minimum wage as proxy floor
      return MINIMUM_WAGE_DAILY_PKR;
  }
}

/** Build bilingual reasoning for fairness assessment. */
function buildFairnessReasoning(
  classification: WageClassification,
  proposed: number,
  market: RateStats,
  deviationPercent: number,
  input: NegotiationInput,
  belowMinWage: boolean,
  belowLivingWage: boolean
): BilingualText {
  const direction = deviationPercent >= 0 ? 'above' : 'below';
  const absDeviation = Math.abs(Math.round(deviationPercent));

  switch (classification) {
    case 'exploitative':
      return {
        en: `âš ï¸ EXPLOITATIVE: The proposed rate of PKR ${proposed} is ${absDeviation}% below market median (PKR ${market.median}) for ${input.category} in ${input.city}. ${belowMinWage ? 'This violates Pakistan\'s minimum wage law (PKR 32,000/month).' : 'This is far below acceptable rates.'} Immediate counter-offer recommended.`,
        ur: `âš ï¸ Ø§Ø³ØªØ­ØµØ§Ù„ÛŒ: ${input.city} Ù…ÛŒÚº ${input.category} Ú©Û’ Ù„ÛŒÛ’ ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­ ${proposed} Ø±ÙˆÙ¾Û’ Ù…Ø§Ø±Ú©ÛŒÙ¹ Ù…ÛŒÚˆÛŒÙ† (${market.median} Ø±ÙˆÙ¾Û’) Ø³Û’ ${absDeviation}% Ú©Ù… ÛÛ’Û” ${belowMinWage ? 'ÛŒÛ Ù¾Ø§Ú©Ø³ØªØ§Ù† Ú©Û’ Ú©Ù… Ø§Ø² Ú©Ù… Ø§Ø¬Ø±Øª Ù‚Ø§Ù†ÙˆÙ† (32,000 Ø±ÙˆÙ¾Û’/Ù…Ø§Û) Ú©ÛŒ Ø®Ù„Ø§Ù ÙˆØ±Ø²ÛŒ ÛÛ’Û”' : 'ÛŒÛ Ù‚Ø§Ø¨Ù„ Ù‚Ø¨ÙˆÙ„ Ø´Ø±Ø­ÙˆÚº Ø³Û’ Ø¨ÛØª Ú©Ù… ÛÛ’Û”'} ÙÙˆØ±ÛŒ Ø¬ÙˆØ§Ø¨ÛŒ Ù¾ÛŒØ´Ú©Ø´ Ú©ÛŒ Ø³ÙØ§Ø±Ø´ Ú©ÛŒ Ø¬Ø§ØªÛŒ ÛÛ’Û”`,
      };

    case 'below_market':
      return {
        en: `ðŸ“‰ BELOW MARKET: The proposed rate of PKR ${proposed} is ${absDeviation}% below the market median (PKR ${market.median}) for ${input.category} in ${input.city}. ${belowLivingWage ? `It is also below the estimated living wage for ${input.city}.` : ''} A counter-offer is recommended to ensure fair compensation.`,
        ur: `ðŸ“‰ Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø³Û’ Ú©Ù…: ${input.city} Ù…ÛŒÚº ${input.category} Ú©Û’ Ù„ÛŒÛ’ ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­ ${proposed} Ø±ÙˆÙ¾Û’ Ù…Ø§Ø±Ú©ÛŒÙ¹ Ù…ÛŒÚˆÛŒÙ† (${market.median} Ø±ÙˆÙ¾Û’) Ø³Û’ ${absDeviation}% Ú©Ù… ÛÛ’Û” ${belowLivingWage ? `ÛŒÛ ${input.city} Ú©ÛŒ ØªØ®Ù…ÛŒÙ†ÛŒ Ú¯Ø²Ø§Ø±Û’ Ú©ÛŒ Ø§Ø¬Ø±Øª Ø³Û’ Ø¨Ú¾ÛŒ Ú©Ù… ÛÛ’Û”` : ''} Ù…Ù†ØµÙØ§Ù†Û Ù…Ø¹Ø§ÙˆØ¶Û’ Ú©Ùˆ ÛŒÙ‚ÛŒÙ†ÛŒ Ø¨Ù†Ø§Ù†Û’ Ú©Û’ Ù„ÛŒÛ’ Ø¬ÙˆØ§Ø¨ÛŒ Ù¾ÛŒØ´Ú©Ø´ Ú©ÛŒ Ø³ÙØ§Ø±Ø´ Ú©ÛŒ Ø¬Ø§ØªÛŒ ÛÛ’Û”`,
      };

    case 'above_market':
      return {
        en: `ðŸ“ˆ ABOVE MARKET: The proposed rate of PKR ${proposed} is ${absDeviation}% ${direction} the market median (PKR ${market.median}) for ${input.category} in ${input.city}. This is generous and should attract quality workers.`,
        ur: `ðŸ“ˆ Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø³Û’ Ø²ÛŒØ§Ø¯Û: ${input.city} Ù…ÛŒÚº ${input.category} Ú©Û’ Ù„ÛŒÛ’ ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­ ${proposed} Ø±ÙˆÙ¾Û’ Ù…Ø§Ø±Ú©ÛŒÙ¹ Ù…ÛŒÚˆÛŒÙ† (${market.median} Ø±ÙˆÙ¾Û’) Ø³Û’ ${absDeviation}% ${direction === 'above' ? 'Ø²ÛŒØ§Ø¯Û' : 'Ú©Ù…'} ÛÛ’Û” ÛŒÛ ÙØ±Ø§Ø®Ø¯Ù„Ø§Ù†Û ÛÛ’ Ø§ÙˆØ± Ù…Ø¹ÛŒØ§Ø±ÛŒ Ú©Ø§Ø±Ú©Ù†ÙˆÚº Ú©Ùˆ Ù…ØªÙˆØ¬Û Ú©Ø±Û’ Ú¯ÛŒÛ”`,
      };

    case 'fair':
      return {
        en: `âœ… FAIR: The proposed rate of PKR ${proposed} is within the fair market range (P25: PKR ${market.p25} â€“ P75: PKR ${market.p75}) for ${input.category} in ${input.city}. No counter-offer needed.`,
        ur: `âœ… Ù…Ù†ØµÙØ§Ù†Û: ${input.city} Ù…ÛŒÚº ${input.category} Ú©Û’ Ù„ÛŒÛ’ ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û Ø´Ø±Ø­ ${proposed} Ø±ÙˆÙ¾Û’ Ù…Ù†ØµÙØ§Ù†Û Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø±ÛŒÙ†Ø¬ (${market.p25} â€“ ${market.p75} Ø±ÙˆÙ¾Û’) Ù…ÛŒÚº ÛÛ’Û” Ø¬ÙˆØ§Ø¨ÛŒ Ù¾ÛŒØ´Ú©Ø´ Ú©ÛŒ Ø¶Ø±ÙˆØ±Øª Ù†ÛÛŒÚºÛ”`,
      };
  }
}

/** Build bilingual reasoning for counter-offer. */
function buildCounterOfferReasoning(
  strategy: NegotiationStrategy,
  proposed: number,
  suggested: number,
  market: RateStats,
  input: NegotiationInput,
  assessment: FairnessAssessment
): BilingualText {
  const strategyLabels: Record<NegotiationStrategy, { en: string; ur: string }> = {
    split_the_difference: {
      en: 'Split-the-difference',
      ur: 'ÙØ±Ù‚ ØªÙ‚Ø³ÛŒÙ… Ú©Ø±ÛŒÚº',
    },
    minimum_floor_enforcement: {
      en: 'Minimum wage enforcement',
      ur: 'Ú©Ù… Ø§Ø² Ú©Ù… Ø§Ø¬Ø±Øª Ù†ÙØ§Ø°',
    },
    premium_allowance: {
      en: 'Urgency premium',
      ur: 'ÙÙˆØ±ÛŒ Ù¾Ø±ÛŒÙ…ÛŒÙ…',
    },
    market_alignment: {
      en: 'Market rate alignment',
      ur: 'Ù…Ø§Ø±Ú©ÛŒÙ¹ Ø±ÛŒÙ¹ ÛÙ… Ø¢ÛÙ†Ú¯ÛŒ',
    },
    living_wage_enforcement: {
      en: 'Living wage enforcement',
      ur: 'Ú¯Ø²Ø§Ø±Û’ Ú©ÛŒ Ø§Ø¬Ø±Øª Ù†ÙØ§Ø°',
    },
  };

  const label = strategyLabels[strategy];

  return {
    en: [
      `ðŸ’° Counter-offer: PKR ${suggested} (${input.rateUnit})`,
      `Strategy: ${label.en}`,
      `Original proposal: PKR ${proposed} â†’ Suggested: PKR ${suggested}`,
      `Market median: PKR ${market.median} | P25â€“P75: PKR ${market.p25}â€“${market.p75}`,
      `Fairness score: ${assessment.fairnessScore}/100`,
      `Estimated acceptance probability: ${Math.round(assessment.fairnessScore * 0.8)}%`,
      input.urgency !== 'low' ? `Urgency adjustment applied: ${input.urgency}` : '',
    ].filter(Boolean).join('\n'),
    ur: [
      `ðŸ’° Ø¬ÙˆØ§Ø¨ÛŒ Ù¾ÛŒØ´Ú©Ø´: ${suggested} Ø±ÙˆÙ¾Û’ (${input.rateUnit === 'hourly' ? 'ÙÛŒ Ú¯Ú¾Ù†Ù¹Û' : input.rateUnit === 'daily' ? 'ÙÛŒ Ø¯Ù†' : 'Ù…Ù‚Ø±Ø±Û'})`,
      `Ø­Ú©Ù…Øª Ø¹Ù…Ù„ÛŒ: ${label.ur}`,
      `Ø§ØµÙ„ ØªØ¬ÙˆÛŒØ²: ${proposed} Ø±ÙˆÙ¾Û’ â†’ ØªØ¬ÙˆÛŒØ² Ú©Ø±Ø¯Û: ${suggested} Ø±ÙˆÙ¾Û’`,
      `Ù…Ø§Ø±Ú©ÛŒÙ¹ Ù…ÛŒÚˆÛŒÙ†: ${market.median} Ø±ÙˆÙ¾Û’ | Ø±ÛŒÙ†Ø¬: ${market.p25}â€“${market.p75} Ø±ÙˆÙ¾Û’`,
      `Ù…Ù†ØµÙØ§Ù†Û Ø³Ú©ÙˆØ±: ${assessment.fairnessScore}/100`,
      input.urgency !== 'low' ? `ÙÙˆØ±ÛŒ Ø§ÛŒÚˆØ¬Ø³Ù¹Ù…Ù†Ù¹: ${input.urgency}` : '',
    ].filter(Boolean).join('\n'),
  };
}

