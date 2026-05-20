// @ts-nocheck
// ============================================================================
// RozgarSync â€” FinancialProtector: Escrow Engine
// ============================================================================

import type { EscrowState, PriceRange } from '@/types';
import type { AgentTool } from '../core/types';

// ============================================================================
// CONSTANTS
// ============================================================================

export const PLATFORM_FEE_RATE = 0.05;       // 5%
export const EOBI_CONTRIBUTION_RATE = 0.05;  // 5%
export const WORKER_PAYOUT_RATE = 0.90;      // 90%
export const MINIMUM_ESCROW_PKR = 500;       // Minimum escrow amount

// ============================================================================
// TYPES
// ============================================================================

export interface EscrowSplit {
  readonly totalAmount: number;
  readonly workerPayout: number;
  readonly platformFee: number;
  readonly eobiContribution: number;
  readonly currency: 'PKR';
  readonly breakdown: string;
}

export type EscrowDecision = 'fund_recommended' | 'release_approved' | 'hold' | 'refund';

export interface EscrowValidation {
  readonly isValid: boolean;
  readonly decision: EscrowDecision;
  readonly issues: string[];
  readonly escrowSplit?: EscrowSplit;
}

// ============================================================================
// ESCROW CALCULATION
// ============================================================================

/**
 * Calculate the escrow split: 90% worker, 5% platform, 5% EOBI.
 * Uses Math.round() for PKR (no fractional currency).
 */
export function calculateEscrowSplit(totalAmount: number): EscrowSplit {
  const platformFee = Math.round(totalAmount * PLATFORM_FEE_RATE);
  const eobiContribution = Math.round(totalAmount * EOBI_CONTRIBUTION_RATE);
  const workerPayout = totalAmount - platformFee - eobiContribution;

  return {
    totalAmount,
    workerPayout,
    platformFee,
    eobiContribution,
    currency: 'PKR',
    breakdown: `Total: PKR ${totalAmount.toLocaleString()} â†’ Worker: PKR ${workerPayout.toLocaleString()} (90%) | Platform: PKR ${platformFee.toLocaleString()} (5%) | EOBI: PKR ${eobiContribution.toLocaleString()} (5%)`,
  };
}

/**
 * Validate an escrow state against the gig budget.
 */
export function validateEscrow(
  escrow: EscrowState,
  budget: PriceRange,
  gigStatus: string,
  assignedWorkerId?: string
): EscrowValidation {
  const issues: string[] = [];

  // Check minimum amount
  if (escrow.amount < MINIMUM_ESCROW_PKR) {
    issues.push(`Escrow amount PKR ${escrow.amount} is below minimum PKR ${MINIMUM_ESCROW_PKR}.`);
  }

  // Check escrow matches budget range
  if (escrow.amount < budget.min) {
    issues.push(`Escrow PKR ${escrow.amount} is below budget minimum PKR ${budget.min}.`);
  }
  if (escrow.amount > budget.max * 1.1) {
    issues.push(`Escrow PKR ${escrow.amount} exceeds budget maximum PKR ${budget.max} by >10%.`);
  }

  // Determine decision based on gig state
  let decision: EscrowDecision;

  if (gigStatus === 'open' && !escrow.isFunded) {
    decision = 'fund_recommended';
  } else if (gigStatus === 'completed' && escrow.isFunded && assignedWorkerId) {
    if (issues.length === 0) {
      decision = 'release_approved';
    } else {
      decision = 'hold';
    }
  } else if (gigStatus === 'cancelled') {
    decision = 'refund';
  } else if (gigStatus === 'disputed') {
    decision = 'hold';
  } else {
    decision = issues.length > 0 ? 'hold' : 'fund_recommended';
  }

  return {
    isValid: issues.length === 0,
    decision,
    issues,
    escrowSplit: issues.length === 0 ? calculateEscrowSplit(escrow.amount) : undefined,
  };
}

// ============================================================================
// WITHDRAWAL VALIDATION
// ============================================================================

export interface WithdrawalValidation {
  readonly approved: boolean;
  readonly reason: string;
  readonly maxWithdrawable: number;
  readonly requestedAmount: number;
}

const MINIMUM_BALANCE_PKR = 100;

/**
 * Validate a withdrawal request.
 */
export function validateWithdrawal(
  requestedAmount: number,
  withdrawableBalance: number,
  pendingBalance: number,
  activeGigCount: number
): WithdrawalValidation {
  const effectiveBalance = withdrawableBalance - MINIMUM_BALANCE_PKR;
  const maxWithdrawable = Math.max(0, effectiveBalance);

  if (requestedAmount <= 0) {
    return { approved: false, reason: 'Invalid withdrawal amount.', maxWithdrawable, requestedAmount };
  }

  if (requestedAmount > maxWithdrawable) {
    return {
      approved: false,
      reason: `Requested PKR ${requestedAmount} exceeds maximum withdrawable PKR ${maxWithdrawable} (balance: ${withdrawableBalance}, minimum hold: ${MINIMUM_BALANCE_PKR}).`,
      maxWithdrawable,
      requestedAmount,
    };
  }

  if (activeGigCount > 0 && requestedAmount > withdrawableBalance * 0.5) {
    return {
      approved: false,
      reason: `Cannot withdraw >50% of balance while ${activeGigCount} gig(s) are active.`,
      maxWithdrawable: Math.round(withdrawableBalance * 0.5),
      requestedAmount,
    };
  }

  return { approved: true, reason: 'Withdrawal approved.', maxWithdrawable, requestedAmount };
}

// ============================================================================
// TOOLS
// ============================================================================

export function createEscrowSplitTool(): AgentTool<{ amount: number }, EscrowSplit> {
  return {
    name: 'calculate_escrow_split',
    description: 'Compute the 90/5/5 escrow split with PKR rounding.',
    execute: async (input) => calculateEscrowSplit(input.amount),
  };
}

