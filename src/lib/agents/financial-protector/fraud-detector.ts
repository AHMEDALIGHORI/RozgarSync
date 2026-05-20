// @ts-nocheck
// ============================================================================
// RozgarSync â€” FinancialProtector: Fraud Detection Engine
// ============================================================================

import type { AgentTool } from '../core/types';

// ============================================================================
// TYPES
// ============================================================================

export type FraudVerdict = 'clear' | 'suspicious' | 'blocked';

export interface FraudAssessment {
  readonly verdict: FraudVerdict;
  readonly riskScore: number; // 0â€“100
  readonly flags: FraudFlag[];
  readonly reasoning: string;
}

export interface FraudFlag {
  readonly type: FraudFlagType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly detail: string;
  readonly score: number; // contribution to risk score
}

export type FraudFlagType =
  | 'velocity_anomaly'
  | 'amount_outlier'
  | 'self_dealing'
  | 'rapid_withdrawal'
  | 'duplicate_transaction'
  | 'unusual_pattern'
  | 'new_account_high_value';

export interface TransactionPattern {
  readonly userId: string;
  readonly transactionCount24h: number;
  readonly transactionCount7d: number;
  readonly totalAmount24h: number;
  readonly totalAmount7d: number;
  readonly averageAmount: number;
  readonly maxSingleTransaction: number;
  readonly accountAgeInDays: number;
  readonly lastWithdrawalTimestamp?: string;
  readonly lastDepositTimestamp?: string;
}

// ============================================================================
// THRESHOLDS
// ============================================================================

const VELOCITY_THRESHOLD_24H = 10;       // Max 10 transactions per 24h
const VELOCITY_THRESHOLD_7D = 30;        // Max 30 transactions per 7d
const AMOUNT_OUTLIER_MULTIPLIER = 5;     // Flag if single TX > 5x average
const RAPID_WITHDRAWAL_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const NEW_ACCOUNT_THRESHOLD_DAYS = 7;
const HIGH_VALUE_FOR_NEW_ACCOUNT_PKR = 50_000;

// ============================================================================
// FRAUD DETECTION
// ============================================================================

/**
 * Analyze a transaction against historical patterns for fraud indicators.
 */
export function detectFraudPatterns(
  pattern: TransactionPattern,
  currentAmount: number,
  transactionType: string,
  relatedPartyId?: string
): FraudAssessment {
  const flags: FraudFlag[] = [];

  // 1. Velocity check â€” too many transactions in a short window
  if (pattern.transactionCount24h > VELOCITY_THRESHOLD_24H) {
    flags.push({
      type: 'velocity_anomaly',
      severity: 'high',
      detail: `${pattern.transactionCount24h} transactions in 24h (threshold: ${VELOCITY_THRESHOLD_24H}).`,
      score: 25,
    });
  } else if (pattern.transactionCount7d > VELOCITY_THRESHOLD_7D) {
    flags.push({
      type: 'velocity_anomaly',
      severity: 'medium',
      detail: `${pattern.transactionCount7d} transactions in 7d (threshold: ${VELOCITY_THRESHOLD_7D}).`,
      score: 15,
    });
  }

  // 2. Amount outlier â€” single transaction far exceeds average
  if (pattern.averageAmount > 0 && currentAmount > pattern.averageAmount * AMOUNT_OUTLIER_MULTIPLIER) {
    flags.push({
      type: 'amount_outlier',
      severity: 'high',
      detail: `Amount PKR ${currentAmount.toLocaleString()} is ${(currentAmount / pattern.averageAmount).toFixed(1)}x the average PKR ${pattern.averageAmount.toLocaleString()}.`,
      score: 20,
    });
  }

  // 3. Self-dealing â€” employer and worker are the same or linked accounts
  if (relatedPartyId && relatedPartyId === pattern.userId) {
    flags.push({
      type: 'self_dealing',
      severity: 'critical',
      detail: 'Transaction source and destination appear to be the same user.',
      score: 40,
    });
  }

  // 4. Rapid withdrawal after deposit
  if (transactionType === 'withdrawal' && pattern.lastDepositTimestamp) {
    const depositTime = new Date(pattern.lastDepositTimestamp).getTime();
    const now = Date.now();
    if (now - depositTime < RAPID_WITHDRAWAL_WINDOW_MS) {
      flags.push({
        type: 'rapid_withdrawal',
        severity: 'medium',
        detail: `Withdrawal within ${Math.round((now - depositTime) / 60000)} minutes of last deposit.`,
        score: 15,
      });
    }
  }

  // 5. New account + high value
  if (
    pattern.accountAgeInDays < NEW_ACCOUNT_THRESHOLD_DAYS &&
    currentAmount > HIGH_VALUE_FOR_NEW_ACCOUNT_PKR
  ) {
    flags.push({
      type: 'new_account_high_value',
      severity: 'medium',
      detail: `Account is ${pattern.accountAgeInDays} days old with a high-value transaction of PKR ${currentAmount.toLocaleString()}.`,
      score: 15,
    });
  }

  // Calculate risk score
  const riskScore = Math.min(100, flags.reduce((sum, f) => sum + f.score, 0));

  // Determine verdict
  let verdict: FraudVerdict;
  if (riskScore >= 60 || flags.some(f => f.severity === 'critical')) {
    verdict = 'blocked';
  } else if (riskScore >= 30) {
    verdict = 'suspicious';
  } else {
    verdict = 'clear';
  }

  return {
    verdict,
    riskScore,
    flags,
    reasoning: flags.length > 0
      ? `${flags.length} fraud indicator(s) detected: ${flags.map(f => f.type).join(', ')}.`
      : 'No fraud indicators detected.',
  };
}

// ============================================================================
// TOOL
// ============================================================================

export function createFraudDetectorTool(): AgentTool<
  { pattern: TransactionPattern; currentAmount: number; transactionType: string; relatedPartyId?: string },
  FraudAssessment
> {
  return {
    name: 'detect_fraud_patterns',
    description: 'Analyze transaction patterns for fraud indicators: velocity, outliers, self-dealing, rapid withdrawal.',
    execute: async (input) => detectFraudPatterns(
      input.pattern, input.currentAmount, input.transactionType, input.relatedPartyId
    ),
  };
}

