// @ts-nocheck
// ============================================================================
// RozgarSync â€” FinancialProtector Agent
// ============================================================================
// Safeguards financial transactions: escrow state validation, EOBI compliance
// tracking, micro-insurance recommendations, and fraud detection.
// ============================================================================

import type {
  EscrowState,
  PriceRange,
  EobiTracker,
} from '@/types';
import type {
  AgentContext,
  AgentDecision,
  AgentAction,
  AgentEvent,
  AgentEventBus,
  AgentEventType,
} from '../core/types';
import { generateId, nowISO } from '../core/types';
import { BaseAgent } from '../core/base-agent';
import {
  validateEscrow,
  validateWithdrawal,
  createEscrowSplitTool,
  type EscrowValidation,
  type WithdrawalValidation,
} from './escrow-engine';
import {
  detectFraudPatterns,
  createFraudDetectorTool,
  type FraudAssessment,
  type TransactionPattern,
} from './fraud-detector';
import {
  checkEOBICompliance,
  assessInsuranceNeed,
  createEOBIComplianceTool,
  createInsuranceAssessmentTool,
  type EOBIComplianceReport,
  type MicroInsuranceRecommendation,
} from './eobi-tracker';

// ============================================================================
// PERCEPTION & DELIBERATION TYPES
// ============================================================================

interface FinancialPerception {
  readonly eventType: string;
  readonly gigId?: string;
  readonly workerId?: string;
  readonly employerId?: string;
  
  // Escrow specific
  readonly escrow?: EscrowState;
  readonly gigBudget?: PriceRange;
  readonly gigStatus?: string;
  
  // Withdrawal specific
  readonly requestedAmount?: number;
  readonly withdrawableBalance?: number;
  readonly pendingBalance?: number;
  readonly activeGigCount?: number;

  // EOBI / Insurance specific
  readonly eobiTracker?: EobiTracker;
  readonly totalEarnings?: number;
  readonly completedGigs?: number;
  readonly category?: string;
  readonly monthlyEarnings?: number;
  readonly existingCoverage?: string[];

  // Fraud specific
  readonly transactionPattern?: TransactionPattern;
  readonly currentAmount?: number;
  readonly transactionType?: string;
  readonly relatedPartyId?: string;
}

interface FinancialDeliberation {
  readonly escrowValidation?: EscrowValidation;
  readonly withdrawalValidation?: WithdrawalValidation;
  readonly fraudAssessment?: FraudAssessment;
  readonly eobiReport?: EOBIComplianceReport;
  readonly insuranceRecommendation?: MicroInsuranceRecommendation;
  
  readonly overallDecision: string;
  readonly confidenceFactors: Array<{
    name: string;
    weight: number;
    score: number;
    reasoning: string;
  }>;
}

// ============================================================================
// FINANCIAL PROTECTOR AGENT
// ============================================================================

export class FinancialProtectorAgent extends BaseAgent<FinancialPerception, FinancialDeliberation> {
  protected readonly subscribedEvents: ReadonlyArray<AgentEventType> = [
    'gig.assigned',
    'gig.completed',
    'escrow.disputed',
    'escrow.funded',
    'escrow.released',
  ];

  constructor(eventBus: AgentEventBus) {
    super(
      {
        agentId: `financial-protector-${generateId().slice(0, 8)}`,
        agentName: 'FinancialProtector',
        agentVersion: '1.0.0',
        decisionTypes: ['escrow_validation', 'fraud_detection'],
        circuitBreaker: {
          failureThreshold: 3,
          resetTimeoutMs: 60_000,
          successThreshold: 2,
        },
      },
      eventBus
    );

    // Register tools
    this.registerTool(createEscrowSplitTool());
    this.registerTool(createFraudDetectorTool());
    this.registerTool(createEOBIComplianceTool());
    this.registerTool(createInsuranceAssessmentTool());
  }

  // ===================================================================
  // Phase 1: PERCEIVE
  // ===================================================================

  async perceive(
    ctx: AgentContext<FinancialPerception, FinancialDeliberation>
  ): Promise<FinancialPerception> {
    const payload = ctx.event.payload as Record<string, unknown>;

    const perception: FinancialPerception = {
      eventType: ctx.event.type,
      gigId: payload['gigId'] as string | undefined,
      workerId: payload['workerId'] as string | undefined,
      employerId: payload['employerId'] as string | undefined,

      escrow: payload['escrow'] as EscrowState | undefined,
      gigBudget: payload['gigBudget'] as PriceRange | undefined,
      gigStatus: payload['gigStatus'] as string | undefined,

      requestedAmount: payload['requestedAmount'] as number | undefined,
      withdrawableBalance: payload['withdrawableBalance'] as number | undefined,
      pendingBalance: payload['pendingBalance'] as number | undefined,
      activeGigCount: payload['activeGigCount'] as number | undefined,

      eobiTracker: payload['eobiTracker'] as EobiTracker | undefined,
      totalEarnings: payload['totalEarnings'] as number | undefined,
      completedGigs: payload['completedGigs'] as number | undefined,
      category: payload['category'] as string | undefined,
      monthlyEarnings: payload['monthlyEarnings'] as number | undefined,
      existingCoverage: payload['existingCoverage'] as string[] | undefined,

      transactionPattern: payload['transactionPattern'] as TransactionPattern | undefined,
      currentAmount: payload['currentAmount'] as number | undefined,
      transactionType: payload['transactionType'] as string | undefined,
      relatedPartyId: payload['relatedPartyId'] as string | undefined,
    };

    return perception;
  }

  // ===================================================================
  // Phase 2: DELIBERATE
  // ===================================================================

  async deliberate(
    ctx: AgentContext<FinancialPerception, FinancialDeliberation>
  ): Promise<FinancialDeliberation> {
    const p = ctx.perception!;
    const confidenceFactors: Array<{ name: string; weight: number; score: number; reasoning: string }> = [];

    let escrowValidation: EscrowValidation | undefined;
    let withdrawalValidation: WithdrawalValidation | undefined;
    let fraudAssessment: FraudAssessment | undefined;
    let eobiReport: EOBIComplianceReport | undefined;
    let insuranceRecommendation: MicroInsuranceRecommendation | undefined;
    
    let overallDecision = 'approved';

    // 1. Escrow Validation
    if (p.escrow && p.gigBudget && p.gigStatus) {
      escrowValidation = validateEscrow(p.escrow, p.gigBudget, p.gigStatus, p.workerId);
      
      confidenceFactors.push({
        name: 'Escrow Validation',
        weight: 0.35,
        score: escrowValidation.isValid ? 1.0 : 0.2,
        reasoning: escrowValidation.isValid ? 'Escrow parameters valid' : escrowValidation.issues.join(', '),
      });
      
      if (!escrowValidation.isValid) overallDecision = 'hold';
    }

    // 2. Withdrawal Validation
    if (p.requestedAmount !== undefined && p.withdrawableBalance !== undefined && p.pendingBalance !== undefined && p.activeGigCount !== undefined) {
      withdrawalValidation = validateWithdrawal(p.requestedAmount, p.withdrawableBalance, p.pendingBalance, p.activeGigCount);
      
      confidenceFactors.push({
        name: 'Withdrawal Limits',
        weight: 0.25,
        score: withdrawalValidation.approved ? 1.0 : 0.0,
        reasoning: withdrawalValidation.reason,
      });

      if (!withdrawalValidation.approved) overallDecision = 'rejected';
    }

    // 3. Fraud Detection
    if (p.transactionPattern && p.currentAmount && p.transactionType) {
      fraudAssessment = detectFraudPatterns(p.transactionPattern, p.currentAmount, p.transactionType, p.relatedPartyId);
      
      confidenceFactors.push({
        name: 'Fraud Check',
        weight: 0.40,
        score: fraudAssessment.verdict === 'clear' ? 1.0 : fraudAssessment.verdict === 'suspicious' ? 0.4 : 0.0,
        reasoning: fraudAssessment.reasoning,
      });

      if (fraudAssessment.verdict === 'blocked') overallDecision = 'blocked';
      else if (fraudAssessment.verdict === 'suspicious' && overallDecision !== 'blocked') overallDecision = 'hold';
    }

    // 4. EOBI Tracking
    if (p.eobiTracker && p.totalEarnings !== undefined && p.completedGigs !== undefined) {
      eobiReport = checkEOBICompliance(p.eobiTracker, p.totalEarnings, p.completedGigs);
    }

    // 5. Micro-insurance Assessment
    if (p.category && p.monthlyEarnings !== undefined) {
      insuranceRecommendation = assessInsuranceNeed(p.category, p.monthlyEarnings, p.existingCoverage);
    }

    // If no main tasks were executed, default to a safe pass
    if (confidenceFactors.length === 0) {
      confidenceFactors.push({
        name: 'No Financial Action Required',
        weight: 1.0,
        score: 1.0,
        reasoning: 'Event does not trigger core financial protections.',
      });
    }

    return {
      escrowValidation,
      withdrawalValidation,
      fraudAssessment,
      eobiReport,
      insuranceRecommendation,
      overallDecision,
      confidenceFactors,
    };
  }

  // ===================================================================
  // Phase 3: TOOL USE
  // ===================================================================

  async toolUse(
    ctx: AgentContext<FinancialPerception, FinancialDeliberation>
  ): Promise<void> {
    const p = ctx.perception!;
    
    if (p.escrow && p.gigBudget && p.gigStatus) {
       // tool already run natively in deliberation
    }
  }

  // ===================================================================
  // Phase 4: DECIDE
  // ===================================================================

  async decide(
    ctx: AgentContext<FinancialPerception, FinancialDeliberation>
  ): Promise<AgentDecision> {
    const d = ctx.deliberation!;

    const totalWeight = d.confidenceFactors.reduce((s, f) => s + f.weight, 0);
    const confidence = totalWeight > 0
      ? d.confidenceFactors.reduce((s, f) => s + f.weight * f.score, 0) / totalWeight
      : 0;

    const CONFIDENCE_THRESHOLD = 0.85;

    let classification = d.overallDecision;
    let reasoning = 'Financial transaction authorized.';
    const requiresHumanReview = confidence < CONFIDENCE_THRESHOLD;

    if (d.fraudAssessment?.verdict === 'blocked') {
      classification = 'transaction_blocked';
      reasoning = `Fraud detection blocked transaction: ${d.fraudAssessment.reasoning}`;
    } else if (d.escrowValidation && !d.escrowValidation.isValid) {
      classification = 'escrow_hold';
      reasoning = `Escrow validation failed: ${d.escrowValidation.issues.join(', ')}`;
    } else if (d.withdrawalValidation && !d.withdrawalValidation.approved) {
      classification = 'withdrawal_rejected';
      reasoning = `Withdrawal rejected: ${d.withdrawalValidation.reason}`;
    }

    return {
      classification,
      confidence,
      reasoning,
      requiresHumanReview,
      data: {
        escrowSplit: d.escrowValidation?.escrowSplit,
        fraudRiskScore: d.fraudAssessment?.riskScore,
        fraudFlags: d.fraudAssessment?.flags,
        eobiStatus: d.eobiReport?.status,
        insuranceRecommended: d.insuranceRecommendation?.recommended,
      },
    };
  }

  // ===================================================================
  // Phase 5: ACT
  // ===================================================================

  async act(
    ctx: AgentContext<FinancialPerception, FinancialDeliberation>
  ): Promise<AgentAction[]> {
    const decision = ctx.decision!;
    const actions: AgentAction[] = [];
    const correlationId = ctx.event.correlationId;

    actions.push({
      type: 'log',
      description: `Financial decision: ${decision.classification} (confidence: ${decision.confidence.toFixed(2)})`,
      data: decision.data,
      timestamp: nowISO(),
    });

    if (decision.classification === 'transaction_blocked') {
      actions.push({
        type: 'block',
        description: 'Transaction blocked due to fraud flags',
        data: { reason: decision.reasoning },
        timestamp: nowISO(),
      });
      await this.eventBus.publish({
        id: generateId(),
        type: 'fraud.detected',
        timestamp: nowISO(),
        payload: {
          transactionType: ctx.perception?.transactionType,
          userId: ctx.perception?.workerId ?? ctx.perception?.employerId,
          reasoning: decision.reasoning,
          flags: ctx.deliberation?.fraudAssessment?.flags,
        },
        sourceId: this.agentId,
        correlationId,
      });
    }

    if (decision.data['eobiStatus'] === 'registration_needed' || decision.data['eobiStatus'] === 'contribution_due') {
        const eobiReport = ctx.deliberation!.eobiReport!;
        actions.push({
          type: 'notify',
          description: 'EOBI Compliance Notification',
          data: { recommendationUrdu: eobiReport.recommendationUrdu, gap: eobiReport.gap },
          timestamp: nowISO(),
        });
    }

    return actions;
  }

  // ===================================================================
  // Phase 6: OBSERVE
  // ===================================================================

  async observe(
    ctx: AgentContext<FinancialPerception, FinancialDeliberation>
  ): Promise<void> {
    const decision = ctx.decision!;
    console.log(
      `[FinancialProtector] Observation â€” event=${ctx.event.type} ` +
      `decision=${decision.classification} confidence=${decision.confidence.toFixed(2)} ` +
      `latency=${Object.values(ctx.timing).reduce((a, b) => a + b, 0)}ms`
    );
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createFinancialProtector(eventBus: AgentEventBus): FinancialProtectorAgent {
  const agent = new FinancialProtectorAgent(eventBus);
  agent.initialize();
  return agent;
}

