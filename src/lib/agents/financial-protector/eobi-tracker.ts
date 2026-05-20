// @ts-nocheck
// ============================================================================
// RozgarSync â€” FinancialProtector: EOBI Tracker
// ============================================================================

import type { EobiTracker } from '@/types';
import type { AgentTool } from '../core/types';

// ============================================================================
// TYPES
// ============================================================================

export type EOBIComplianceStatus = 'compliant' | 'contribution_due' | 'registration_needed';

export interface EOBIComplianceReport {
  readonly status: EOBIComplianceStatus;
  readonly isRegistered: boolean;
  readonly totalContributions: number;
  readonly expectedContributions: number;
  readonly gap: number;
  readonly lastContributionDaysAgo: number | null;
  readonly nextContributionDue: string;
  readonly compliancePercentage: number;
  readonly recommendation: string;
  readonly recommendationUrdu: string;
}

export interface MicroInsuranceRecommendation {
  readonly recommended: boolean;
  readonly products: InsuranceProduct[];
  readonly totalMonthlyPremium: number;
  readonly reasoning: string;
}

export interface InsuranceProduct {
  readonly id: string;
  readonly name: string;
  readonly nameUrdu: string;
  readonly type: 'accident' | 'health' | 'equipment';
  readonly coverageAmount: number;
  readonly monthlyPremium: number;
  readonly provider: string;
  readonly description: string;
}

// ============================================================================
// EOBI COMPLIANCE
// ============================================================================

/** EOBI contribution rate per gig (5% of worker payout). */
const EOBI_RATE = 0.05;
/** Maximum days between contributions before flagging. */
const MAX_CONTRIBUTION_GAP_DAYS = 45;

/**
 * Check EOBI compliance for a worker.
 */
export function checkEOBICompliance(
  tracker: EobiTracker,
  totalEarnings: number,
  completedGigs: number
): EOBIComplianceReport {
  // 1. Check registration
  if (!tracker.isRegistered) {
    return {
      status: 'registration_needed',
      isRegistered: false,
      totalContributions: 0,
      expectedContributions: Math.round(totalEarnings * EOBI_RATE),
      gap: Math.round(totalEarnings * EOBI_RATE),
      lastContributionDaysAgo: null,
      nextContributionDue: 'Immediately upon registration',
      compliancePercentage: 0,
      recommendation: 'Register for EOBI (Employees\' Old-Age Benefits Institution) to secure your retirement benefits. Registration is free and protects your future.',
      recommendationUrdu: 'EOBI (Ù…Ù„Ø§Ø²Ù…ÛŒÙ† Ú©Û’ Ø¨Ú‘Ú¾Ø§Ù¾Û’ Ú©Û’ ÙÙˆØ§Ø¦Ø¯ Ø§Ø¯Ø§Ø±Û) Ù…ÛŒÚº Ø±Ø¬Ø³Ù¹Ø± ÛÙˆÚº ØªØ§Ú©Û Ø¢Ù¾ Ú©ÛŒ Ø±ÛŒÙ¹Ø§Ø¦Ø±Ù…Ù†Ù¹ Ú©Û’ ÙÙˆØ§Ø¦Ø¯ Ù…Ø­ÙÙˆØ¸ ÛÙˆÚºÛ” Ø±Ø¬Ø³Ù¹Ø±ÛŒØ´Ù† Ù…ÙØª ÛÛ’Û”',
    };
  }

  // 2. Calculate expected vs actual
  const expectedContributions = Math.round(totalEarnings * EOBI_RATE);
  const gap = Math.max(0, expectedContributions - tracker.totalContributions);
  const compliancePercentage = expectedContributions > 0
    ? Math.min(100, Math.round((tracker.totalContributions / expectedContributions) * 100))
    : 100;

  // 3. Check last contribution date
  let lastContributionDaysAgo: number | null = null;
  if (tracker.lastContributionDate) {
    const lastDate = tracker.lastContributionDate.toDate
      ? tracker.lastContributionDate.toDate()
      : new Date(tracker.lastContributionDate as unknown as string);
    lastContributionDaysAgo = Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 4. Determine status
  let status: EOBIComplianceStatus;
  if (gap > 0 || (lastContributionDaysAgo !== null && lastContributionDaysAgo > MAX_CONTRIBUTION_GAP_DAYS)) {
    status = 'contribution_due';
  } else {
    status = 'compliant';
  }

  // 5. Calculate next due date
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + Math.max(0, MAX_CONTRIBUTION_GAP_DAYS - (lastContributionDaysAgo ?? 0)));

  // 6. Recommendations
  let recommendation: string;
  let recommendationUrdu: string;

  if (status === 'contribution_due') {
    recommendation = `EOBI contribution gap of PKR ${gap.toLocaleString()}. ${completedGigs} gigs completed. Next contribution recommended immediately.`;
    recommendationUrdu = `EOBI Ø´Ø±Ø§Ú©Øª Ù…ÛŒÚº PKR ${gap.toLocaleString()} Ú©Ø§ ÙØ±Ù‚ ÛÛ’Û” ${completedGigs} Ú¯Ú¯Ø³ Ù…Ú©Ù…Ù„Û” ÙÙˆØ±ÛŒ Ø´Ø±Ø§Ú©Øª Ú©ÛŒ Ø³ÙØ§Ø±Ø´Û”`;
  } else {
    recommendation = `EOBI contributions are up to date. Total: PKR ${tracker.totalContributions.toLocaleString()} across ${tracker.contributionHistory.length} contributions.`;
    recommendationUrdu = `EOBI Ø´Ø±Ø§Ú©ØªÛŒÚº Ø§Ù¾ Ù¹Ùˆ ÚˆÛŒÙ¹ ÛÛŒÚºÛ” Ú©Ù„: PKR ${tracker.totalContributions.toLocaleString()} ${tracker.contributionHistory.length} Ø´Ø±Ø§Ú©ØªÙˆÚº Ù…ÛŒÚºÛ”`;
  }

  return {
    status,
    isRegistered: true,
    totalContributions: tracker.totalContributions,
    expectedContributions,
    gap,
    lastContributionDaysAgo,
    nextContributionDue: nextDueDate.toISOString().split('T')[0],
    compliancePercentage,
    recommendation,
    recommendationUrdu,
  };
}

// ============================================================================
// MICRO-INSURANCE
// ============================================================================

/** Available micro-insurance products. */
const INSURANCE_CATALOG: InsuranceProduct[] = [
  {
    id: 'accident-basic',
    name: 'Basic Accident Cover',
    nameUrdu: 'Ø¨Ù†ÛŒØ§Ø¯ÛŒ Ø­Ø§Ø¯Ø«Ø§ØªÛŒ Ø¨ÛŒÙ…Û',
    type: 'accident',
    coverageAmount: 500_000,
    monthlyPremium: 200,
    provider: 'State Life Insurance',
    description: 'Covers workplace accidents up to PKR 500,000.',
  },
  {
    id: 'accident-premium',
    name: 'Premium Accident Cover',
    nameUrdu: 'Ù¾Ø±ÛŒÙ…ÛŒÙ… Ø­Ø§Ø¯Ø«Ø§ØªÛŒ Ø¨ÛŒÙ…Û',
    type: 'accident',
    coverageAmount: 1_000_000,
    monthlyPremium: 450,
    provider: 'State Life Insurance',
    description: 'Comprehensive accident coverage up to PKR 1,000,000.',
  },
  {
    id: 'health-basic',
    name: 'Basic Health Cover',
    nameUrdu: 'Ø¨Ù†ÛŒØ§Ø¯ÛŒ ØµØ­Øª Ø¨ÛŒÙ…Û',
    type: 'health',
    coverageAmount: 300_000,
    monthlyPremium: 350,
    provider: 'Sehat Sahulat',
    description: 'Hospitalization and emergency care up to PKR 300,000.',
  },
  {
    id: 'equipment-cover',
    name: 'Equipment Protection',
    nameUrdu: 'Ø¢Ù„Ø§Øª Ú©Ø§ ØªØ­ÙØ¸',
    type: 'equipment',
    coverageAmount: 100_000,
    monthlyPremium: 150,
    provider: 'EFU General Insurance',
    description: 'Covers loss or damage to work equipment up to PKR 100,000.',
  },
];

/** Category â†’ recommended insurance types mapping. */
const CATEGORY_INSURANCE: Record<string, Array<'accident' | 'health' | 'equipment'>> = {
  electrical: ['accident', 'health', 'equipment'],
  ac_repair: ['accident', 'equipment'],
  plumbing: ['accident', 'equipment'],
  carpentry: ['accident', 'equipment'],
  painting: ['accident', 'health'],
  moving: ['accident', 'health'],
  driving: ['accident', 'health'],
  cleaning: ['health'],
  cooking: ['accident', 'health'],
  mobile_repair: ['equipment'],
  tailoring: ['equipment'],
  tutoring: [],
  beauty: ['health'],
  gardening: ['accident'],
  other: ['accident'],
};

/**
 * Recommend micro-insurance products based on gig category and earnings tier.
 */
export function assessInsuranceNeed(
  category: string,
  monthlyEarnings: number,
  existingCoverage: string[] = []
): MicroInsuranceRecommendation {
  const recommendedTypes = CATEGORY_INSURANCE[category] ?? ['accident'];

  // Filter: exclude already-covered types, match recommended types
  const products = INSURANCE_CATALOG.filter(p =>
    recommendedTypes.includes(p.type) && !existingCoverage.includes(p.id)
  );

  // For low earners, prefer basic plans
  const selectedProducts = monthlyEarnings < 30_000
    ? products.filter(p => p.monthlyPremium <= 300)
    : products;

  const totalMonthlyPremium = selectedProducts.reduce((sum, p) => sum + p.monthlyPremium, 0);

  // Don't recommend if premium exceeds 5% of monthly earnings
  const affordablePremium = monthlyEarnings * 0.05;
  const recommended = selectedProducts.length > 0 && totalMonthlyPremium <= affordablePremium;

  return {
    recommended,
    products: selectedProducts,
    totalMonthlyPremium,
    reasoning: recommended
      ? `${selectedProducts.length} insurance product(s) recommended for ${category} workers. Total premium: PKR ${totalMonthlyPremium}/month (${((totalMonthlyPremium / monthlyEarnings) * 100).toFixed(1)}% of earnings).`
      : selectedProducts.length > 0
        ? `Insurance available but premium PKR ${totalMonthlyPremium}/month exceeds 5% affordability threshold.`
        : 'No additional insurance coverage needed for this category.',
  };
}

// ============================================================================
// TOOLS
// ============================================================================

export function createEOBIComplianceTool(): AgentTool<
  { tracker: EobiTracker; totalEarnings: number; completedGigs: number },
  EOBIComplianceReport
> {
  return {
    name: 'check_eobi_compliance',
    description: 'Verify EOBI contributions are up to date and identify gaps.',
    execute: async (input) => checkEOBICompliance(input.tracker, input.totalEarnings, input.completedGigs),
  };
}

export function createInsuranceAssessmentTool(): AgentTool<
  { category: string; monthlyEarnings: number; existingCoverage?: string[] },
  MicroInsuranceRecommendation
> {
  return {
    name: 'assess_insurance_need',
    description: 'Recommend micro-insurance products based on gig category and earnings.',
    execute: async (input) => assessInsuranceNeed(input.category, input.monthlyEarnings, input.existingCoverage),
  };
}

