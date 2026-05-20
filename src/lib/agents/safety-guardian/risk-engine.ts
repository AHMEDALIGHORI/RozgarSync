// @ts-nocheck
// ============================================================================
// RozgarSync â€” SafetyGuardian Agent: Risk Scoring Engine
// ============================================================================

import type { ServiceCategory, EmployerSafetyScoring, GeoLocation } from '@/types';
import type { AgentTool } from '../core/types';

// ============================================================================
// RISK LEVEL TYPES
// ============================================================================

export type RiskLevel = 'safe' | 'caution' | 'dangerous';
export type SOSSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EmployerVerdict = 'approved' | 'warning' | 'blocked';

export interface GigRiskAssessment {
  readonly overallRisk: RiskLevel;
  readonly riskScore: number; // 0â€“100 (higher = riskier)
  readonly factors: RiskFactor[];
  readonly recommendations: string[];
  readonly requiresPPE: boolean;
}

export interface RiskFactor {
  readonly name: string;
  readonly category: 'category' | 'location' | 'temporal' | 'employer' | 'history';
  readonly score: number; // 0â€“100
  readonly weight: number;
  readonly detail: string;
}

export interface EmployerVerification {
  readonly verdict: EmployerVerdict;
  readonly score: number;
  readonly flags: EmployerFlag[];
  readonly reasoning: string;
}

export interface EmployerFlag {
  readonly type: 'low_score' | 'high_dispute_rate' | 'unresolved_incidents' | 'payment_issues' | 'new_account';
  readonly severity: 'info' | 'warning' | 'critical';
  readonly detail: string;
}

// ============================================================================
// CATEGORY RISK LEVELS
// ============================================================================

/** Inherent risk level for each service category. */
const CATEGORY_RISK: Record<ServiceCategory, number> = {
  electrical: 85,
  ac_repair: 70,
  plumbing: 55,
  carpentry: 60,
  painting: 50,
  moving: 65,
  driving: 60,
  mobile_repair: 25,
  cleaning: 30,
  cooking: 35,
  tailoring: 15,
  tutoring: 10,
  beauty: 20,
  gardening: 40,
  other: 30,
};

/** Categories that require PPE. */
const PPE_REQUIRED: Set<ServiceCategory> = new Set([
  'electrical', 'ac_repair', 'plumbing', 'carpentry', 'painting', 'moving',
]);

// ============================================================================
// EMPLOYER VERIFICATION
// ============================================================================

/**
 * Deep-check an employer's safety scoring dimensions.
 * Returns a verdict: approved, warning, or blocked.
 */
export function verifyEmployer(
  scoring: EmployerSafetyScoring,
  totalHires: number,
  isVerified: boolean
): EmployerVerification {
  const flags: EmployerFlag[] = [];

  // 1. Overall score check
  if (scoring.overallScore < 40) {
    flags.push({
      type: 'low_score',
      severity: 'critical',
      detail: `Employer overall safety score is ${scoring.overallScore}/100 (below 40 threshold).`,
    });
  } else if (scoring.overallScore < 60) {
    flags.push({
      type: 'low_score',
      severity: 'warning',
      detail: `Employer safety score ${scoring.overallScore}/100 is below average.`,
    });
  }

  // 2. Dispute rate check
  if (scoring.disputeRate > 0.3) {
    flags.push({
      type: 'high_dispute_rate',
      severity: 'critical',
      detail: `Dispute rate ${(scoring.disputeRate * 100).toFixed(1)}% exceeds 30% threshold.`,
    });
  } else if (scoring.disputeRate > 0.15) {
    flags.push({
      type: 'high_dispute_rate',
      severity: 'warning',
      detail: `Dispute rate ${(scoring.disputeRate * 100).toFixed(1)}% is elevated.`,
    });
  }

  // 3. Unresolved incident check
  if (scoring.incidentCount > 3) {
    const resolved = scoring.completedGigCount > 0
      ? 1 - (scoring.incidentCount / scoring.completedGigCount)
      : 0;
    if (resolved < 0.5) {
      flags.push({
        type: 'unresolved_incidents',
        severity: 'critical',
        detail: `${scoring.incidentCount} incidents with low resolution rate.`,
      });
    }
  }

  // 4. Payment reliability
  if (scoring.paymentReliability < 0.7) {
    flags.push({
      type: 'payment_issues',
      severity: 'warning',
      detail: `Payment reliability ${(scoring.paymentReliability * 100).toFixed(0)}% â€” escrow funding is inconsistent.`,
    });
  }

  // 5. New account flag
  if (totalHires < 3 && !isVerified) {
    flags.push({
      type: 'new_account',
      severity: 'info',
      detail: 'New employer account with limited history. Extra caution recommended.',
    });
  }

  // Determine verdict
  const criticalFlags = flags.filter(f => f.severity === 'critical');
  let verdict: EmployerVerdict;
  if (criticalFlags.length >= 2) {
    verdict = 'blocked';
  } else if (criticalFlags.length === 1) {
    verdict = 'warning';
  } else if (flags.some(f => f.severity === 'warning')) {
    verdict = 'warning';
  } else {
    verdict = 'approved';
  }

  return {
    verdict,
    score: scoring.overallScore,
    flags,
    reasoning: flags.length > 0
      ? `Employer flagged: ${flags.map(f => f.detail).join(' | ')}`
      : 'Employer profile passed all safety checks.',
  };
}

// ============================================================================
// GIG RISK ASSESSMENT
// ============================================================================

/**
 * Assess the multi-factor risk level of a gig.
 */
export function assessGigRisk(params: {
  category: ServiceCategory;
  location: GeoLocation;
  scheduledHour?: number; // 0-23
  employerScore: number;
  isNightGig: boolean;
}): GigRiskAssessment {
  const factors: RiskFactor[] = [];

  // Factor 1: Category inherent risk (40% weight)
  const categoryRisk = CATEGORY_RISK[params.category];
  factors.push({
    name: 'Category Risk',
    category: 'category',
    score: categoryRisk,
    weight: 0.40,
    detail: `${params.category} has inherent risk score of ${categoryRisk}/100.`,
  });

  // Factor 2: Temporal risk (20% weight)
  let temporalRisk = 10;
  if (params.isNightGig || (params.scheduledHour !== undefined && params.scheduledHour >= 22)) {
    temporalRisk = 70;
  } else if (params.scheduledHour !== undefined && params.scheduledHour >= 19) {
    temporalRisk = 40;
  }
  factors.push({
    name: 'Time Risk',
    category: 'temporal',
    score: temporalRisk,
    weight: 0.20,
    detail: params.isNightGig
      ? 'Night gig (after 10 PM) â€” elevated risk.'
      : `Scheduled at ${params.scheduledHour ?? 'daytime'} hours.`,
  });

  // Factor 3: Employer trust (30% weight) â€” inverse (low employer score = high risk)
  const employerRisk = Math.max(0, 100 - params.employerScore);
  factors.push({
    name: 'Employer Trust',
    category: 'employer',
    score: employerRisk,
    weight: 0.30,
    detail: `Employer safety score ${params.employerScore}/100 â†’ risk ${employerRisk}/100.`,
  });

  // Factor 4: Location â€” simplified (10% weight)
  const locationRisk = 20; // Baseline â€” would integrate GIS data in production
  factors.push({
    name: 'Location Risk',
    category: 'location',
    score: locationRisk,
    weight: 0.10,
    detail: `Location: ${params.location.city}, ${params.location.area ?? 'unknown area'}.`,
  });

  // Compute weighted risk score
  const riskScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  let overallRisk: RiskLevel;
  if (riskScore >= 70) overallRisk = 'dangerous';
  else if (riskScore >= 40) overallRisk = 'caution';
  else overallRisk = 'safe';

  // Recommendations
  const recommendations: string[] = [];
  if (PPE_REQUIRED.has(params.category)) {
    recommendations.push('Personal Protective Equipment (PPE) is required for this job category.');
  }
  if (params.isNightGig) {
    recommendations.push('Night work: share your live location with a trusted contact.');
  }
  if (employerRisk > 60) {
    recommendations.push('Employer has a low safety score. Request escrow funding before starting work.');
  }

  return {
    overallRisk,
    riskScore,
    factors,
    recommendations,
    requiresPPE: PPE_REQUIRED.has(params.category),
  };
}

// ============================================================================
// TOOL FACTORIES
// ============================================================================

/** Create the `verify_employer` tool. */
export function createVerifyEmployerTool(): AgentTool<
  { scoring: EmployerSafetyScoring; totalHires: number; isVerified: boolean },
  EmployerVerification
> {
  return {
    name: 'verify_employer',
    description: 'Deep-check employer safety scoring dimensions and return a verdict.',
    execute: async (input) => verifyEmployer(input.scoring, input.totalHires, input.isVerified),
  };
}

/** Create the `assess_gig_risk` tool. */
export function createAssessGigRiskTool(): AgentTool<
  { category: ServiceCategory; location: GeoLocation; scheduledHour?: number; employerScore: number; isNightGig: boolean },
  GigRiskAssessment
> {
  return {
    name: 'assess_gig_risk',
    description: 'Multi-factor risk assessment for a gig posting.',
    execute: async (input) => assessGigRisk(input),
  };
}

