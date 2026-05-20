'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';

import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { AgentStatusOrb } from '@/components/ui/AgentStatusOrb';
import { GlowCard } from '@/components/ui/GlowCard';

export default function AgentDashboard() {
  const locale = useLocale();

  const [stats, setStats] = useState({ o: 1432, n: 890, s: 2104, f: 567, u: 342 });
  const [negStatus, setNegStatus] = useState<'processing' | 'completed'>('processing');

  useEffect(() => {
    const t1 = setInterval(() => {
      setStats(p => ({
        o: p.o + Math.floor(Math.random() * 3),
        n: p.n + Math.floor(Math.random() * 2),
        s: p.s + Math.floor(Math.random() * 4),
        f: p.f + Math.floor(Math.random() * 2),
        u: p.u + Math.floor(Math.random() * 2),
      }));
    }, 3000);
    const t2 = setInterval(() => setNegStatus(p => p === 'processing' ? 'completed' : 'processing'), 5000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const agents = [
    {
      id: 'opportunity',
      name: 'OpportunityMatcher',
      role: 'Gig matching & anti-starvation',
      status: 'completed' as const,
      eventsProcessed: stats.o,
      icon: '🎯'
    },
    {
      id: 'negotiator',
      name: 'FairWageNegotiator',
      role: 'Market rates & inflation adjustment',
      status: negStatus,
      eventsProcessed: stats.n,
      icon: '⚖️'
    },
    {
      id: 'safety',
      name: 'SafetyGuardian',
      role: 'SOS routing & employer verification',
      status: 'completed' as const,
      eventsProcessed: stats.s,
      icon: '🛡️'
    },
    {
      id: 'financial',
      name: 'FinancialProtector',
      role: 'Escrow locks & EOBI tracking',
      status: 'idle' as const,
      eventsProcessed: stats.f,
      icon: '💰'
    },
    {
      id: 'upskilling',
      name: 'UpskillingCoach',
      role: 'Skill gaps & TEVTA courses',
      status: 'completed' as const,
      eventsProcessed: stats.u,
      icon: '📈'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-950 p-6 md:p-8 relative">
      <div className="absolute inset-0 bg-mesh-pattern opacity-20 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-dark-800 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Agent Command Center</h1>
            <p className="text-dark-400 mt-1">Autonomous orchestration for your gig ecosystem</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/${locale}/demo`} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 border border-brand-500 rounded-lg text-sm text-white font-medium transition-colors shadow-glow">
              Judge Demo Mode
            </Link>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlowCard className="p-6">
            <div className="text-sm text-dark-400 mb-2">Total Workers</div>
            <div className="text-3xl font-display font-bold text-white">
              <AnimatedCounter value={10450} suffix="+" />
            </div>
            <div className="text-xs text-emerald-400 mt-2">↑ 12% this month</div>
          </GlowCard>
          
          <GlowCard className="p-6">
            <div className="text-sm text-dark-400 mb-2">Active Escrows</div>
            <div className="text-3xl font-display font-bold text-white">
              <AnimatedCounter value={43} suffix="M" />
            </div>
            <div className="text-xs text-emerald-400 mt-2">PKR Locked & Safe</div>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="text-sm text-dark-400 mb-2">Agent Decisions</div>
            <div className="text-3xl font-display font-bold text-white">
              <AnimatedCounter value={5335} />
            </div>
            <div className="text-xs text-brand-400 mt-2">Fully autonomous</div>
          </GlowCard>

          <GlowCard className="p-6 border-red-500/20 bg-red-950/10">
            <div className="text-sm text-red-400/80 mb-2">SOS Alerts Handled</div>
            <div className="text-3xl font-display font-bold text-red-400">
              <AnimatedCounter value={24} />
            </div>
            <div className="text-xs text-red-400/60 mt-2">Responded in &lt; 3s</div>
          </GlowCard>
        </div>

        <h2 className="text-xl font-bold text-white pt-4">Live Agent Fleet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-900 border border-dark-800 hover:border-brand-500/50 rounded-2xl p-6 transition-colors shadow-glass relative overflow-hidden group"
            >
              <div className={`absolute -inset-20 opacity-0 group-hover:opacity-10 blur-3xl transition-opacity pointer-events-none ${
                agent.status === 'processing' ? 'bg-blue-500' : 'bg-brand-500'
              }`} />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="text-3xl bg-dark-800 p-3 rounded-xl">{agent.icon}</div>
                <AgentStatusOrb status={agent.status} label={agent.status.toUpperCase()} />
              </div>

              <div className="space-y-1 relative z-10">
                <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                <p className="text-sm text-dark-400 h-10">{agent.role}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-dark-800 flex justify-between items-center relative z-10">
                <span className="text-xs text-dark-500 font-mono">EVENTS</span>
                <span className="text-sm font-mono text-dark-200">
                  <AnimatedCounter value={agent.eventsProcessed} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
