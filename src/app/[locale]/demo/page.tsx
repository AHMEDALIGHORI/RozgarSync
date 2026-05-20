'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentTraceViewer, type ExtendedAgentDecisionLog } from '@/components/ui/AgentTraceViewer';
import { generateId } from '@/lib/agents/core/types';
import { Timestamp } from 'firebase/firestore';

const MOCK_SCENARIOS = [
  {
    id: 's1',
    name: 'Standard Gig Match',
    agent: 'OpportunityMatcher',
    description: 'Finds top 3 plumbers in Gulberg within 5km.',
    simulate: () => [
      createMockLog('gig_recommendation', 0.85, 230, 'Successfully matched 3 candidates based on skill and proximity. Top candidate Ali has a 95% skill match.', { mode: 'ranked', candidates: 3 }),
    ]
  },
  {
    id: 's3',
    name: 'Counter-offer Generation',
    agent: 'FairWageNegotiator',
    description: 'Employer posts gig 15% below market rate.',
    simulate: () => [
      createMockLog('price_suggestion', 0.88, 320, 'Proposed budget (PKR 1500) is 15% below market median (PKR 1800). Generated counter-offer at PKR 1750.', { classification: 'below_market', suggestedRate: 1750 }),
    ]
  },
  {
    id: 's5',
    name: 'SOS Protocol Activation',
    agent: 'SafetyGuardian',
    description: 'Worker triggers SOS during active gig.',
    simulate: () => {
      const parentId = generateId();
      return [
        createMockLog('safety_alert', 0.99, 50, 'SOS signal received. Freezing active gig and escrow.', { action: 'freeze_gig' }, parentId),
        createMockLog('safety_alert', 0.98, 120, 'Routing live location to Police 15 and emergency contacts.', { action: 'notify_authorities' }, undefined, parentId),
      ]
    }
  },
  {
    id: 's7',
    name: 'Escrow Lock & EOBI Split',
    agent: 'FinancialProtector',
    description: 'Gig funded. Calculates splits including 5% EOBI.',
    simulate: () => [
      createMockLog('escrow_validation', 0.95, 80, 'Total PKR 2000 locked. Splits calculated: Worker (90%), Platform (5%), EOBI (5%).', { worker: 1800, eobi: 100 }),
    ]
  },
];

const AI_SCENARIOS = [
  {
    id: 'ai-1',
    name: 'AC Repair Emergency',
    description: 'Late night AC repair request with below-market budget.',
    payload: {
      title: 'AC Repair in Gulberg',
      category: 'ac_repair',
      city: 'Lahore',
      budget: { min: 1000, max: 1500 },
      urgency: 'high',
      description: 'Split AC unit stopped cooling. Need urgent fix.'
    }
  },
  {
    id: 'ai-2',
    name: 'Electrician (Fair Rate)',
    description: 'Standard wiring job with good budget.',
    payload: {
      title: 'House Wiring Repair',
      category: 'electrician',
      city: 'Islamabad',
      budget: { min: 3000, max: 4000 },
      urgency: 'medium',
      description: 'Main DB box is sparking.'
    }
  },
  {
    id: 'ai-3',
    name: 'Plumbing (Exploitative)',
    description: 'Major repair offered at fraction of minimum wage.',
    payload: {
      title: 'Underground Pipe Burst',
      category: 'plumber',
      city: 'Karachi',
      budget: { min: 300, max: 500 },
      urgency: 'high',
      description: 'Whole house flooded.'
    }
  }
];

function createMockLog(
  decisionType: string,
  confidence: number,
  latencyMs: number,
  reasoning: string,
  data: any,
  traceChainHash: string = generateId(),
  parentTraceId?: string | null
): ExtendedAgentDecisionLog {
  return {
    id: `log_${generateId()}`,
    rationale: reasoning,
    triggeredBy: 'system_demo',
    decisionType: decisionType as any,
    agentVersion: '1.0.0',
    modelId: 'gemini-1.5-pro',
    timestamp: Timestamp.now(),
    inputHash: `in_${generateId().slice(0, 16)}`,
    outputHash: `out_${generateId().slice(0, 16)}`,
    traceChainHash,
    parentTraceId: parentTraceId ?? null,
    sessionTraceId: 'demo_session',
    confidence,
    latencyMs,
    inputTokens: Math.floor(Math.random() * 500) + 100,
    outputTokens: Math.floor(Math.random() * 100) + 50,
    classificationData: data,
    reasoning: {
      en: reasoning,
      ur: 'ڈیمو کی وجوہات (Demo reasoning)'
    },
  };
}

export default function DemoPage() {
  const [logs, setLogs] = useState<ExtendedAgentDecisionLog[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isLiveAiMode, setIsLiveAiMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const runMockScenario = (scenario: typeof MOCK_SCENARIOS[0]) => {
    setActiveScenario(scenario.id);
    const newLogs = scenario.simulate();
    setLogs(prev => [...newLogs, ...prev]);
  };

  const runAiScenario = async (scenario: typeof AI_SCENARIOS[0]) => {
    setActiveScenario(scenario.id);
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/agent-orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenario.payload })
      });
      
      const data = await res.json();
      
      if (data.traces) {
        // Convert API traces to AgentDecisionLog format for the viewer
        const newLogs = data.traces.map((trace: any, index: number) => ({
          id: `ai_log_${generateId()}`,
          rationale: trace.reasoning?.en || 'AI Decision',
          triggeredBy: 'api_orchestrator',
          decisionType: trace.decisionType,
          agentVersion: '2.0.0',
          modelId: trace.modelId,
          timestamp: Timestamp.now(),
          inputHash: `in_${generateId()}`,
          outputHash: `out_${generateId()}`,
          traceChainHash: trace.traceHash,
          parentTraceId: index > 0 ? data.traces[index - 1].traceHash : null,
          sessionTraceId: `session_${generateId()}`,
          confidence: trace.confidence,
          latencyMs: trace.latencyMs,
          inputTokens: trace.inputTokens,
          outputTokens: trace.outputTokens,
          classificationData: trace.decision,
          reasoning: trace.reasoning || { en: '', ur: '' },
          // Extra field for UI display if needed
          agentName: trace.agentName,
        }));
        
        setLogs(prev => [...newLogs, ...prev]);
      }
    } catch (err) {
      console.error('AI Scenario failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setActiveScenario(null);
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-24 pb-8 px-4 md:pt-28 md:pb-12 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-dark-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
              RozgarSync AI Mission Control
              {isLiveAiMode && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected to Gemini 2.0 Flash
                </span>
              )}
            </h1>
            <p className="text-dark-400">Simulate agent behaviors and trace decision logs in real-time.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-800">
              <button
                onClick={() => setIsLiveAiMode(false)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!isLiveAiMode ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
              >
                Mock Mode
              </button>
              <button
                onClick={() => setIsLiveAiMode(true)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isLiveAiMode ? 'bg-brand-600 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
              >
                Live AI Mode
              </button>
            </div>

            <button 
              onClick={clearLogs}
              className="px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg text-sm text-white font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Scenarios Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">
              {isLiveAiMode ? 'Live Orchestration Scenarios' : 'Mock Event Simulations'}
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence mode="wait">
                {isLiveAiMode ? (
                  <motion.div key="ai" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
                    {AI_SCENARIOS.map((s) => (
                      <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => runAiScenario(s)}
                        disabled={isLoading}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          activeScenario === s.id 
                            ? 'bg-brand-900/30 border-brand-500' 
                            : 'bg-dark-900 border-dark-800 hover:border-dark-600'
                        } ${isLoading && activeScenario === s.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-white text-base">{s.name}</div>
                          <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded">All 5 Agents</span>
                        </div>
                        <div className="text-sm text-dark-300 leading-relaxed mb-2">{s.description}</div>
                        <div className="text-xs font-mono text-emerald-400/70 truncate border-t border-dark-800 pt-2 mt-2">
                          {JSON.stringify(s.payload)}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="mock" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MOCK_SCENARIOS.map((s) => (
                      <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => runMockScenario(s)}
                        className={`text-left p-4 rounded-xl border transition-colors ${
                          activeScenario === s.id 
                            ? 'bg-blue-900/20 border-blue-500/50' 
                            : 'bg-dark-900 border-dark-800 hover:border-dark-600'
                        }`}
                      >
                        <div className="text-xs font-mono text-blue-400 mb-1">{s.agent}</div>
                        <div className="font-bold text-white text-sm mb-2">{s.name}</div>
                        <div className="text-xs text-dark-400 leading-relaxed">{s.description}</div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Trace Viewer Panel */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Live Agent Traces</h2>
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-brand-400">
                  <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  Gemini is thinking...
                </div>
              )}
            </div>
            <AgentTraceViewer logs={logs} className="h-[600px] border border-dark-800 rounded-xl bg-dark-900/50 shadow-inner-glow" />
          </div>

        </div>
      </div>
    </div>
  );
}
