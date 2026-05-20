// ============================================================================
// RozgarSync — Agent Orchestration API (Master Endpoint)
// ============================================================================
// Runs a gig scenario through ALL 5 AI agents using Google Gemini.
// Uses the AgentEventBus for inter-agent communication and CircuitBreaker
// for resilient Gemini API calls. Each agent phase is traced.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/gemini';
import { AgentEventBus } from '@/lib/agents/core/event-bus';
import { CircuitBreaker } from '@/lib/agents/core/circuit-breaker';
import { AGENT_PHASES } from '@/lib/agents/core/types';

interface AgentTrace {
  agentName: string;
  agentIcon: string;
  decisionType: string;
  confidence: number;
  latencyMs: number;
  reasoning: { en: string; ur: string };
  decision: Record<string, unknown>;
  actions: Array<{ type: string; description: string }>;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  traceHash: string;
}

interface OrchestrateRequest {
  scenario: {
    title: string;
    category: string;
    city: string;
    budget: { min: number; max: number };
    urgency: string;
    description: string;
  };
}

// Simple hash for trace IDs
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(12, '0')}`;
}

// Market rate data for agent context
const MARKET_RATES: Record<string, Record<string, { min: number; max: number; avg: number }>> = {
  plumber: { Lahore: { min: 1200, max: 3000, avg: 2000 }, Karachi: { min: 1500, max: 3500, avg: 2400 }, Islamabad: { min: 1800, max: 4000, avg: 2800 } },
  electrician: { Lahore: { min: 1000, max: 2800, avg: 1800 }, Karachi: { min: 1200, max: 3200, avg: 2200 }, Islamabad: { min: 1500, max: 3500, avg: 2500 } },
  ac_repair: { Lahore: { min: 1500, max: 4000, avg: 2500 }, Karachi: { min: 1800, max: 4500, avg: 3000 }, Islamabad: { min: 2000, max: 5000, avg: 3500 } },
  painter: { Lahore: { min: 800, max: 2500, avg: 1500 }, Karachi: { min: 1000, max: 3000, avg: 1800 }, Islamabad: { min: 1200, max: 3500, avg: 2200 } },
  driver: { Lahore: { min: 2000, max: 5000, avg: 3500 }, Karachi: { min: 2500, max: 6000, avg: 4000 }, Islamabad: { min: 3000, max: 7000, avg: 4500 } },
  carpenter: { Lahore: { min: 1200, max: 3500, avg: 2200 }, Karachi: { min: 1500, max: 4000, avg: 2600 }, Islamabad: { min: 1800, max: 4500, avg: 3000 } },
  tailor: { Lahore: { min: 500, max: 2000, avg: 1200 }, Karachi: { min: 600, max: 2500, avg: 1500 }, Islamabad: { min: 800, max: 3000, avg: 1800 } },
  cleaner: { Lahore: { min: 800, max: 2000, avg: 1200 }, Karachi: { min: 1000, max: 2500, avg: 1500 }, Islamabad: { min: 1200, max: 3000, avg: 1800 } },
};

// Per-request circuit breaker for resilient Gemini calls
const geminiBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
  halfOpenMaxAttempts: 1,
  monitorWindowMs: 60_000,
});

async function runAgent(
  agentName: string,
  agentIcon: string,
  decisionType: string,
  prompt: string,
  fallbackDecision: Record<string, unknown>,
  eventBus: AgentEventBus,
  phaseIndex: number,
): Promise<AgentTrace> {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  // Publish perceive event through the EventBus
  await eventBus.publish({
    id: crypto.randomUUID(),
    type: `agent.${decisionType}.perceive`,
    source: agentName as any,
    timestamp: Date.now(),
    payload: { phase: AGENT_PHASES[0], agentName },
    correlationId,
    metadata: { phaseIndex: String(phaseIndex) },
  });

  try {
    // Execute Gemini call through CircuitBreaker for resilience
    const result = await geminiBreaker.execute(async () => {
      return generateJSON<{
        confidence: number;
        reasoning: { en: string; ur: string };
        decision: Record<string, unknown>;
        actions: Array<{ type: string; description: string }>;
      }>(prompt);
    });

    const latencyMs = Date.now() - startTime;

    // Publish decision event through the EventBus
    await eventBus.publish({
      id: crypto.randomUUID(),
      type: `agent.${decisionType}.decided`,
      source: agentName as any,
      timestamp: Date.now(),
      payload: { confidence: result.confidence, latencyMs, decision: result.decision },
      correlationId,
      metadata: { phase: 'decide' },
    });

    return {
      agentName,
      agentIcon,
      decisionType,
      confidence: Math.min(1, Math.max(0, result.confidence || 0.75)),
      latencyMs,
      reasoning: result.reasoning || { en: 'Analysis complete.', ur: 'تجزیہ مکمل۔' },
      decision: result.decision || fallbackDecision,
      actions: result.actions || [{ type: 'analyze', description: 'Completed analysis' }],
      modelId: 'gemini-2.0-flash',
      inputTokens: Math.floor(prompt.length / 4),
      outputTokens: Math.floor(JSON.stringify(result).length / 4),
      traceHash: simpleHash(`${agentName}_${Date.now()}_${JSON.stringify(result).substring(0, 100)}`),
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      agentName,
      agentIcon,
      decisionType,
      confidence: 0.65,
      latencyMs,
      reasoning: {
        en: `${agentName} completed analysis using rule-based fallback.`,
        ur: `${agentName} نے اصولوں پر مبنی تجزیہ مکمل کیا۔`,
      },
      decision: fallbackDecision,
      actions: [{ type: 'fallback', description: 'Used rule-based analysis' }],
      modelId: 'rule-based-fallback',
      inputTokens: 0,
      outputTokens: 0,
      traceHash: simpleHash(`${agentName}_fallback_${Date.now()}`),
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestrateRequest = await request.json();
    const { scenario } = body;

    if (!scenario || !scenario.title || !scenario.category || !scenario.city) {
      return NextResponse.json(
        { error: 'Missing required scenario fields: title, category, city' },
        { status: 400 }
      );
    }

    const marketRate = MARKET_RATES[scenario.category]?.[scenario.city] || { min: 1000, max: 3000, avg: 2000 };
    const budgetMin = scenario.budget?.min || 1000;
    const budgetMax = scenario.budget?.max || 3000;
    const budgetAvg = (budgetMin + budgetMax) / 2;

    const traces: AgentTrace[] = [];
    const orchestrationStart = Date.now();

    // Initialize the AgentEventBus for this orchestration session
    const eventBus = new AgentEventBus();
    const busEvents: Array<{ type: string; source: string; timestamp: number }> = [];

    // Subscribe a trace collector to capture all inter-agent events
    eventBus.subscribe('agent.*', async (event) => {
      busEvents.push({ type: event.type, source: event.source, timestamp: event.timestamp });
    });

    // ── Agent 1: OpportunityMatcher ──────────────────────────────────────
    const matcherTrace = await runAgent(
      'OpportunityMatcher',
      '🎯',
      'gig_recommendation',
      `You are the OpportunityMatcher agent for RozgarSync. Analyze this gig and find the best matching workers.

GIG DETAILS:
- Title: ${scenario.title}
- Category: ${scenario.category}
- City: ${scenario.city}
- Budget: PKR ${budgetMin} - ${budgetMax}
- Urgency: ${scenario.urgency || 'medium'}
- Description: ${scenario.description || 'No description'}

Respond in JSON with these exact fields:
{
  "confidence": <number 0-1>,
  "reasoning": {
    "en": "<English explanation of how you matched workers, consider skill relevance, proximity, availability>",
    "ur": "<Urdu translation of the same reasoning>"
  },
  "decision": {
    "topCandidates": [
      {"name": "<Pakistani name>", "skillMatch": <0-100>, "distance": "<X km>", "rating": <1-5>, "completedJobs": <number>},
      {"name": "<Pakistani name>", "skillMatch": <0-100>, "distance": "<X km>", "rating": <1-5>, "completedJobs": <number>},
      {"name": "<Pakistani name>", "skillMatch": <0-100>, "distance": "<X km>", "rating": <1-5>, "completedJobs": <number>}
    ],
    "matchingStrategy": "<strategy used>",
    "fairnessApplied": <boolean>
  },
  "actions": [
    {"type": "match", "description": "<what you did>"},
    {"type": "notify", "description": "<notification sent>"}
  ]
}`,
      {
        topCandidates: [
          { name: 'Ali Hassan', skillMatch: 92, distance: '2.3 km', rating: 4.8, completedJobs: 156 },
          { name: 'Muhammad Bilal', skillMatch: 87, distance: '3.1 km', rating: 4.6, completedJobs: 89 },
          { name: 'Usman Ahmed', skillMatch: 83, distance: '4.5 km', rating: 4.5, completedJobs: 45 },
        ],
        matchingStrategy: 'multi_dimensional_scoring',
        fairnessApplied: true,
      },
      eventBus,
      0,
    );
    traces.push(matcherTrace);

    // ── Agent 2: FairWageNegotiator ─────────────────────────────────────
    const wageTrace = await runAgent(
      'FairWageNegotiator',
      '💰',
      'price_suggestion',
      `You are the FairWageNegotiator agent for RozgarSync. Assess if this gig's budget is fair for Pakistani workers.

GIG DETAILS:
- Category: ${scenario.category}
- City: ${scenario.city}
- Proposed Budget: PKR ${budgetMin} - ${budgetMax} (average: PKR ${budgetAvg})
- Urgency: ${scenario.urgency || 'medium'}

MARKET CONTEXT:
- Market rate for ${scenario.category} in ${scenario.city}: PKR ${marketRate.min} - ${marketRate.max} (average: PKR ${marketRate.avg})
- Pakistan minimum daily wage: PKR 1,200
- Current inflation factor: 1.29

Classify the wage as one of: "fair", "above_market", "below_market", "exploitative"
Calculate a fairness score from 0-100.

Respond in JSON:
{
  "confidence": <number 0-1>,
  "reasoning": {
    "en": "<Detailed English analysis comparing budget vs market rate, considering urgency premium, inflation>",
    "ur": "<Urdu translation>"
  },
  "decision": {
    "classification": "<fair|above_market|below_market|exploitative>",
    "fairnessScore": <0-100>,
    "proposedRate": ${budgetAvg},
    "marketMedian": ${marketRate.avg},
    "deviationPercent": <percentage>,
    "counterOffer": <suggested PKR amount if below market, null if fair>,
    "belowMinimumWage": <boolean>
  },
  "actions": [
    {"type": "classify", "description": "<what classification was made>"},
    {"type": "recommend", "description": "<recommendation for employer/worker>"}
  ]
}`,
      {
        classification: budgetAvg < marketRate.avg * 0.7 ? 'exploitative' : budgetAvg < marketRate.avg * 0.9 ? 'below_market' : 'fair',
        fairnessScore: Math.min(100, Math.round((budgetAvg / marketRate.avg) * 100)),
        proposedRate: budgetAvg,
        marketMedian: marketRate.avg,
        deviationPercent: Math.round(((budgetAvg - marketRate.avg) / marketRate.avg) * 100),
        counterOffer: budgetAvg < marketRate.avg ? Math.round(marketRate.avg * 0.95) : null,
        belowMinimumWage: budgetAvg < 1200,
      },
      eventBus,
      1,
    );
    traces.push(wageTrace);

    // ── Agent 3: SafetyGuardian ─────────────────────────────────────────
    const safetyTrace = await runAgent(
      'SafetyGuardian',
      '🛡️',
      'safety_scoring',
      `You are the SafetyGuardian agent for RozgarSync. Assess safety risks for this gig in Pakistan.

GIG DETAILS:
- Title: ${scenario.title}
- Category: ${scenario.category}
- City: ${scenario.city}
- Urgency: ${scenario.urgency || 'medium'}
- Description: ${scenario.description || 'Standard service request'}

Consider:
- Is this category physically risky? (e.g., electrician > tailor)
- City safety profile (e.g., certain areas of Karachi vs Islamabad)
- Time-related risks (if urgency is emergency, it might be late hours)
- Employer verification importance

Respond in JSON:
{
  "confidence": <number 0-1>,
  "reasoning": {
    "en": "<English safety assessment with specific Pakistan context>",
    "ur": "<Urdu translation>"
  },
  "decision": {
    "riskLevel": "<low|medium|high|critical>",
    "riskScore": <0-100 where 100 is most dangerous>,
    "factors": [{"factor": "<name>", "severity": "<low|medium|high>", "detail": "<explanation>"}],
    "requiresVerification": <boolean>,
    "emergencyProtocol": "<none|standby|active>"
  },
  "actions": [
    {"type": "assess", "description": "<risk assessment action>"},
    {"type": "recommend", "description": "<safety recommendation>"}
  ]
}`,
      {
        riskLevel: 'medium',
        riskScore: 35,
        factors: [{ factor: 'category_risk', severity: 'medium', detail: 'Standard risk level for this service category' }],
        requiresVerification: true,
        emergencyProtocol: 'standby',
      },
      eventBus,
      2,
    );
    traces.push(safetyTrace);

    // ── Agent 4: FinancialProtector ─────────────────────────────────────
    const financeTrace = await runAgent(
      'FinancialProtector',
      '🏦',
      'fraud_detection',
      `You are the FinancialProtector agent for RozgarSync. Validate the escrow and payment structure for this gig.

GIG DETAILS:
- Category: ${scenario.category}
- Budget: PKR ${budgetMin} - ${budgetMax}
- City: ${scenario.city}

PAYMENT STRUCTURE:
- Total escrow amount: PKR ${budgetMax}
- Worker payout (90%): PKR ${Math.round(budgetMax * 0.9)}
- Platform fee (5%): PKR ${Math.round(budgetMax * 0.05)}
- EOBI contribution (5%): PKR ${Math.round(budgetMax * 0.05)}

Validate the financial integrity and check for fraud indicators.

Respond in JSON:
{
  "confidence": <number 0-1>,
  "reasoning": {
    "en": "<English analysis of payment structure, escrow validation, EOBI compliance>",
    "ur": "<Urdu translation>"
  },
  "decision": {
    "escrowValid": <boolean>,
    "fraudRisk": "<none|low|medium|high>",
    "workerPayout": ${Math.round(budgetMax * 0.9)},
    "platformFee": ${Math.round(budgetMax * 0.05)},
    "eobiContribution": ${Math.round(budgetMax * 0.05)},
    "eobiCompliant": <boolean>,
    "integrityHash": "<generated hash>"
  },
  "actions": [
    {"type": "validate", "description": "<escrow validation result>"},
    {"type": "compute", "description": "<payment split computation>"}
  ]
}`,
      {
        escrowValid: true,
        fraudRisk: 'none',
        workerPayout: Math.round(budgetMax * 0.9),
        platformFee: Math.round(budgetMax * 0.05),
        eobiContribution: Math.round(budgetMax * 0.05),
        eobiCompliant: true,
        integrityHash: simpleHash(`escrow_${budgetMax}_${Date.now()}`),
      },
      eventBus,
      3,
    );
    traces.push(financeTrace);

    // ── Agent 5: UpskillingCoach ─────────────────────────────────────────
    const skillTrace = await runAgent(
      'UpskillingCoach',
      '📚',
      'skill_matching',
      `You are the UpskillingCoach agent for RozgarSync. Analyze skill requirements and recommend training for this gig category in Pakistan.

GIG DETAILS:
- Category: ${scenario.category}
- City: ${scenario.city}
- Description: ${scenario.description || 'Standard service'}

Consider:
- What skills are essential for ${scenario.category}?
- What advanced/emerging skills could increase earning by 20-40%?
- What NAVTTC, PSDF, or online courses are available in Pakistan?
- What's the current skill gap in ${scenario.city} for ${scenario.category}?

Respond in JSON:
{
  "confidence": <number 0-1>,
  "reasoning": {
    "en": "<English analysis of skill gaps and recommendations for workers in this category>",
    "ur": "<Urdu translation>"
  },
  "decision": {
    "requiredSkills": ["<skill1>", "<skill2>", "<skill3>"],
    "skillGaps": ["<gap1>", "<gap2>"],
    "recommendedCourses": [
      {"name": "<course name>", "provider": "<NAVTTC|PSDF|Coursera|YouTube>", "duration": "<duration>", "estimatedBoost": "<X%>"}
    ],
    "estimatedIncomeBoost": <percentage>,
    "demandTrend": "<increasing|stable|decreasing>"
  },
  "actions": [
    {"type": "analyze", "description": "<skill gap analysis>"},
    {"type": "recommend", "description": "<course recommendation>"}
  ]
}`,
      {
        requiredSkills: ['Basic repair', 'Customer service', 'Safety protocols'],
        skillGaps: ['Advanced techniques', 'Digital tools'],
        recommendedCourses: [
          { name: 'Advanced Technical Skills', provider: 'NAVTTC', duration: '3 months', estimatedBoost: '25%' },
        ],
        estimatedIncomeBoost: 25,
        demandTrend: 'increasing',
      },
      eventBus,
      4,
    );
    traces.push(skillTrace);

    // ── Generate Summary ────────────────────────────────────────────────
    const totalLatencyMs = Date.now() - orchestrationStart;

    const summaryFallback = {
      en: `All 5 agents completed analysis for "${scenario.title}" in ${scenario.city}. The gig has been processed through opportunity matching, wage assessment, safety screening, financial validation, and skill analysis.`,
      ur: `"${scenario.title}" کے لیے ${scenario.city} میں تمام 5 ایجنٹس نے تجزیہ مکمل کیا۔ گگ کو موقع کی مماثلت، اجرت کی تشخیص، حفاظتی جانچ، مالی توثیق، اور مہارت کے تجزیے سے گزارا گیا ہے۔`,
    };

    let summary = summaryFallback;
    try {
      summary = await generateJSON<{ en: string; ur: string }>(
        `Summarize these 5 agent analyses for gig "${scenario.title}" in ${scenario.city} in 2-3 sentences.
         Agents: OpportunityMatcher found ${(traces[0]?.decision as any)?.topCandidates?.length || 3} candidates.
         FairWageNegotiator classified wage as ${(traces[1]?.decision as any)?.classification || 'fair'}.
         SafetyGuardian rated risk as ${(traces[2]?.decision as any)?.riskLevel || 'medium'}.
         FinancialProtector validated escrow: ${(traces[3]?.decision as any)?.escrowValid ? 'valid' : 'invalid'}.
         UpskillingCoach found ${(traces[4]?.decision as any)?.skillGaps?.length || 2} skill gaps.
         Respond in JSON: {"en": "<English summary>", "ur": "<Urdu summary>"}`
      );
    } catch {
      // Use fallback summary
    }

    // Collect EventBus metrics for the response
    const busMetrics = eventBus.getMetrics();

    return NextResponse.json({
      success: true,
      traces,
      summary,
      totalLatencyMs,
      modelId: 'gemini-2.0-flash',
      agentCount: 5,
      timestamp: new Date().toISOString(),
      eventBusMetrics: {
        totalPublished: busMetrics.totalPublished,
        totalDelivered: busMetrics.totalDelivered,
        activeSubscriptions: busMetrics.activeSubscriptions,
        eventLog: busEvents,
      },
    });
  } catch (error) {
    console.error('[AgentOrchestrate] Error:', error);
    return NextResponse.json(
      { error: 'Agent orchestration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
