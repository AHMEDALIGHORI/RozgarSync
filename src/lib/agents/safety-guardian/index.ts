// @ts-nocheck
// ============================================================================
// RozgarSync â€” SafetyGuardian Agent
// ============================================================================
// Protects workers via employer verification, gig risk assessment, SOS
// emergency response, and safety score maintenance.
// ============================================================================

import type {
  EmployerSafetyScoring,
  Gig,
  GeoLocation,
  ServiceCategory,
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
  verifyEmployer,
  assessGigRisk,
  createVerifyEmployerTool,
  createAssessGigRiskTool,
  type EmployerVerification,
  type GigRiskAssessment,
  type EmployerVerdict,
  type RiskLevel,
} from './risk-engine';
import {
  assessSOS,
  createSOSProtocolTool,
  type SOSRequest,
  type SOSAssessment,
  type SOSSeverity,
} from './sos-protocol';

// ============================================================================
// PERCEPTION & DELIBERATION TYPES
// ============================================================================

interface SafetyPerception {
  readonly eventType: string;
  readonly gigId?: string;
  readonly employerId?: string;
  readonly workerId?: string;
  readonly category?: ServiceCategory;
  readonly location?: GeoLocation;
  readonly employerScoring?: EmployerSafetyScoring;
  readonly employerTotalHires?: number;
  readonly employerIsVerified?: boolean;
  readonly isNightGig: boolean;
  readonly scheduledHour?: number;
  readonly sosRequest?: SOSRequest;
}

interface SafetyDeliberation {
  readonly employerVerification?: EmployerVerification;
  readonly gigRiskAssessment?: GigRiskAssessment;
  readonly sosAssessment?: SOSAssessment;
  readonly overallSafetyDecision: string;
  readonly confidenceFactors: Array<{
    name: string;
    weight: number;
    score: number;
    reasoning: string;
  }>;
}

// ============================================================================
// SAFETY GUARDIAN AGENT
// ============================================================================

export class SafetyGuardianAgent extends BaseAgent<SafetyPerception, SafetyDeliberation> {
  protected readonly subscribedEvents: ReadonlyArray<AgentEventType> = [
    'gig.created',
    'gig.assigned',
    'gig.completed',
    'review.created',
  ];

  constructor(eventBus: AgentEventBus) {
    super(
      {
        agentId: `safety-guardian-${generateId().slice(0, 8)}`,
        agentName: 'SafetyGuardian',
        agentVersion: '1.0.0',
        decisionTypes: ['safety_scoring', 'fraud_detection'],
        circuitBreaker: {
          failureThreshold: 3,
          resetTimeoutMs: 60_000,
          successThreshold: 2,
        },
      },
      eventBus
    );

    // Register tools
    this.registerTool(createVerifyEmployerTool());
    this.registerTool(createAssessGigRiskTool());
    this.registerTool(createSOSProtocolTool());
  }

  // ===================================================================
  // Phase 1: PERCEIVE
  // ===================================================================

  async perceive(
    ctx: AgentContext<SafetyPerception, SafetyDeliberation>
  ): Promise<SafetyPerception> {
    const payload = ctx.event.payload as Record<string, unknown>;

    const perception: SafetyPerception = {
      eventType: ctx.event.type,
      gigId: payload['gigId'] as string | undefined,
      employerId: payload['employerId'] as string | undefined,
      workerId: payload['workerId'] as string | undefined,
      category: payload['category'] as ServiceCategory | undefined,
      location: payload['location'] as GeoLocation | undefined,
      employerScoring: payload['employerScoring'] as EmployerSafetyScoring | undefined,
      employerTotalHires: payload['employerTotalHires'] as number | undefined,
      employerIsVerified: payload['employerIsVerified'] as boolean | undefined,
      isNightGig: (payload['scheduledHour'] as number | undefined) !== undefined
        ? (payload['scheduledHour'] as number) >= 22
        : false,
      scheduledHour: payload['scheduledHour'] as number | undefined,
      sosRequest: payload['sosRequest'] as SOSRequest | undefined,
    };

    return perception;
  }

  // ===================================================================
  // Phase 2: DELIBERATE
  // ===================================================================

  async deliberate(
    ctx: AgentContext<SafetyPerception, SafetyDeliberation>
  ): Promise<SafetyDeliberation> {
    const p = ctx.perception!;
    const confidenceFactors: Array<{ name: string; weight: number; score: number; reasoning: string }> = [];

    let employerVerification: EmployerVerification | undefined;
    let gigRiskAssessment: GigRiskAssessment | undefined;
    let sosAssessment: SOSAssessment | undefined;
    let overallSafetyDecision = 'safe';

    // Employer verification
    if (p.employerScoring) {
      employerVerification = verifyEmployer(
        p.employerScoring,
        p.employerTotalHires ?? 0,
        p.employerIsVerified ?? false
      );
      confidenceFactors.push({
        name: 'Employer Trust',
        weight: 0.40,
        score: employerVerification.verdict === 'approved' ? 0.9
             : employerVerification.verdict === 'warning' ? 0.5
             : 0.1,
        reasoning: employerVerification.reasoning,
      });

      if (employerVerification.verdict === 'blocked') {
        overallSafetyDecision = 'blocked';
      }
    }

    // Gig risk assessment
    if (p.category && p.location) {
      gigRiskAssessment = assessGigRisk({
        category: p.category,
        location: p.location,
        scheduledHour: p.scheduledHour,
        employerScore: p.employerScoring?.overallScore ?? 50,
        isNightGig: p.isNightGig,
      });
      confidenceFactors.push({
        name: 'Gig Risk Level',
        weight: 0.35,
        score: gigRiskAssessment.overallRisk === 'safe' ? 0.9
             : gigRiskAssessment.overallRisk === 'caution' ? 0.6
             : 0.2,
        reasoning: `Gig risk score: ${gigRiskAssessment.riskScore}/100.`,
      });

      if (gigRiskAssessment.overallRisk === 'dangerous' && overallSafetyDecision !== 'blocked') {
        overallSafetyDecision = 'dangerous';
      }
    }

    // SOS handling
    if (p.sosRequest) {
      sosAssessment = assessSOS(p.sosRequest);
      confidenceFactors.push({
        name: 'SOS Severity',
        weight: 0.25,
        score: 0.95, // High confidence in SOS classification
        reasoning: `SOS classified as ${sosAssessment.severity}. Action: ${sosAssessment.action}.`,
      });
      overallSafetyDecision = `sos_${sosAssessment.severity}`;
    }

    // Data completeness factor
    const dataPoints = [p.employerScoring, p.category, p.location].filter(Boolean).length;
    confidenceFactors.push({
      name: 'Data Completeness',
      weight: 0.25,
      score: dataPoints / 3,
      reasoning: `${dataPoints}/3 data points available for assessment.`,
    });

    return {
      employerVerification,
      gigRiskAssessment,
      sosAssessment,
      overallSafetyDecision,
      confidenceFactors,
    };
  }

  // ===================================================================
  // Phase 3: TOOL USE
  // ===================================================================

  async toolUse(
    ctx: AgentContext<SafetyPerception, SafetyDeliberation>
  ): Promise<void> {
    const p = ctx.perception!;

    // Tool results are already computed in deliberate phase via direct function calls.
    // In production, these would be async API calls through the tool registry.
    if (p.employerScoring) {
      const verifyTool = this.tools.get('verify_employer');
      if (verifyTool) {
        const result = await verifyTool.execute({
          scoring: p.employerScoring,
          totalHires: p.employerTotalHires ?? 0,
          isVerified: p.employerIsVerified ?? false,
        });
        ctx.toolResults.set('verify_employer', result);
      }
    }

    if (p.category && p.location) {
      const riskTool = this.tools.get('assess_gig_risk');
      if (riskTool) {
        const result = await riskTool.execute({
          category: p.category,
          location: p.location,
          scheduledHour: p.scheduledHour,
          employerScore: p.employerScoring?.overallScore ?? 50,
          isNightGig: p.isNightGig,
        });
        ctx.toolResults.set('assess_gig_risk', result);
      }
    }

    if (p.sosRequest) {
      const sosTool = this.tools.get('trigger_sos_protocol');
      if (sosTool) {
        const result = await sosTool.execute(p.sosRequest);
        ctx.toolResults.set('trigger_sos_protocol', result);
      }
    }
  }

  // ===================================================================
  // Phase 4: DECIDE
  // ===================================================================

  async decide(
    ctx: AgentContext<SafetyPerception, SafetyDeliberation>
  ): Promise<AgentDecision> {
    const d = ctx.deliberation!;

    // Calculate confidence from factors
    const totalWeight = d.confidenceFactors.reduce((s, f) => s + f.weight, 0);
    const confidence = totalWeight > 0
      ? d.confidenceFactors.reduce((s, f) => s + f.weight * f.score, 0) / totalWeight
      : 0;

    const CONFIDENCE_THRESHOLD = 0.80; // Safety-critical: higher threshold

    let classification = d.overallSafetyDecision;
    let reasoning = '';
    const requiresHumanReview = confidence < CONFIDENCE_THRESHOLD;

    if (d.sosAssessment) {
      classification = `sos_${d.sosAssessment.action}`;
      reasoning = `SOS ${d.sosAssessment.severity}: ${d.sosAssessment.action}. ` +
        `Escalation in ${d.sosAssessment.escalationTimeMinutes} minutes.`;
    } else if (d.employerVerification) {
      if (d.employerVerification.verdict === 'blocked') {
        classification = 'employer_blocked';
        reasoning = `Employer blocked: ${d.employerVerification.reasoning}`;
      } else if (d.employerVerification.verdict === 'warning') {
        classification = 'employer_warning';
        reasoning = `Employer warning: ${d.employerVerification.reasoning}`;
      } else {
        classification = d.gigRiskAssessment
          ? `gig_${d.gigRiskAssessment.overallRisk}`
          : 'employer_approved';
        reasoning = d.gigRiskAssessment
          ? `Gig risk: ${d.gigRiskAssessment.overallRisk} (${d.gigRiskAssessment.riskScore}/100). ` +
            `Employer: ${d.employerVerification.verdict}.`
          : `Employer ${d.employerVerification.verdict}.`;
      }
    }

    return {
      classification,
      confidence,
      reasoning,
      requiresHumanReview,
      data: {
        employerVerdict: d.employerVerification?.verdict,
        gigRiskLevel: d.gigRiskAssessment?.overallRisk,
        gigRiskScore: d.gigRiskAssessment?.riskScore,
        sosSeverity: d.sosAssessment?.severity,
        sosAction: d.sosAssessment?.action,
        recommendations: d.gigRiskAssessment?.recommendations ?? [],
        requiresPPE: d.gigRiskAssessment?.requiresPPE ?? false,
      },
    };
  }

  // ===================================================================
  // Phase 5: ACT
  // ===================================================================

  async act(
    ctx: AgentContext<SafetyPerception, SafetyDeliberation>
  ): Promise<AgentAction[]> {
    const decision = ctx.decision!;
    const actions: AgentAction[] = [];
    const correlationId = ctx.event.correlationId;

    // Log the decision
    actions.push({
      type: 'log',
      description: `Safety decision: ${decision.classification} (confidence: ${decision.confidence.toFixed(2)})`,
      data: decision.data,
      timestamp: nowISO(),
    });

    // Employer-related actions
    if (decision.data['employerVerdict'] === 'blocked') {
      actions.push({
        type: 'block',
        description: 'Employer blocked from gig visibility',
        data: { employerId: ctx.perception?.employerId, reason: decision.reasoning },
        timestamp: nowISO(),
      });

      await this.eventBus.publish({
        id: generateId(),
        type: 'safety.alert',
        timestamp: nowISO(),
        payload: {
          alertType: 'employer_blocked',
          employerId: ctx.perception?.employerId,
          reasoning: decision.reasoning,
        },
        sourceId: this.agentId,
        correlationId,
      });
    } else if (decision.data['employerVerdict'] === 'warning') {
      actions.push({
        type: 'notify',
        description: 'Safety warning notification sent',
        data: { workerId: ctx.perception?.workerId, warning: decision.reasoning },
        timestamp: nowISO(),
      });
    }

    // SOS actions
    const d = ctx.deliberation!;
    if (d.sosAssessment) {
      actions.push({
        type: 'emit_event',
        description: `SOS ${d.sosAssessment.action} triggered`,
        data: {
          severity: d.sosAssessment.severity,
          contacts: d.sosAssessment.contacts,
          autoActions: d.sosAssessment.autoActions,
        },
        timestamp: nowISO(),
      });

      await this.eventBus.publish({
        id: generateId(),
        type: 'safety.alert',
        timestamp: nowISO(),
        payload: {
          alertType: `sos_${d.sosAssessment.severity}`,
          workerId: ctx.perception?.workerId,
          gigId: ctx.perception?.gigId,
          assessment: d.sosAssessment,
        },
        sourceId: this.agentId,
        correlationId,
      });
    }

    return actions;
  }

  // ===================================================================
  // Phase 6: OBSERVE
  // ===================================================================

  async observe(
    ctx: AgentContext<SafetyPerception, SafetyDeliberation>
  ): Promise<void> {
    // In production: write metrics to analytics collection
    // Track: false positive rate for employer flags, SOS response times,
    // safety score accuracy over time
    const decision = ctx.decision!;
    console.log(
      `[SafetyGuardian] Observation â€” event=${ctx.event.type} ` +
      `decision=${decision.classification} confidence=${decision.confidence.toFixed(2)} ` +
      `latency=${Object.values(ctx.timing).reduce((a, b) => a + b, 0)}ms`
    );
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/** Create and initialize a SafetyGuardian agent. */
export function createSafetyGuardian(eventBus: AgentEventBus): SafetyGuardianAgent {
  const agent = new SafetyGuardianAgent(eventBus);
  agent.initialize();
  return agent;
}

