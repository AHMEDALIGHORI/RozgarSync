'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PulseBadge } from '@/components/ui/PulseBadge';

export default function GigDetailPage({ params }: { params: { id: string } }) {
  // locale not needed here currently
  const [applyState, setApplyState] = useState<'idle' | 'processing' | 'success'>('idle');

  const handleApply = () => {
    if (applyState !== 'idle') return;
    setApplyState('processing');
    // Optimistic UI: show success shortly after processing
    setTimeout(() => {
      setApplyState('success');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Title */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-900 border border-dark-800 rounded-2xl p-6 md:p-8 shadow-glass"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              Plumbing
            </span>
            <span className="text-dark-400 text-sm">Gig ID: {params.id}</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
            Urgent PPRC Pipe Leak Repair
          </h1>
          <p className="text-dark-300 font-urdu text-lg mb-6">
            پانی کی پائپ لائن لیک ہو گئی ہے، فوری مرمت درکار ہے۔
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-dark-200">
              <span className="text-dark-400">Location:</span> Gulberg III, Lahore
            </div>
            <div className="flex items-center gap-2 text-dark-200">
              <span className="text-dark-400">Budget:</span> PKR 2,500 - 3,500 (Fixed)
            </div>
            <div className="flex items-center gap-2 text-dark-200">
              <span className="text-dark-400">Urgency:</span> <span className="text-red-400 font-bold">High</span>
            </div>
          </div>
        </motion.div>

        {/* AI Agent Analysis Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* FairWageNegotiator Analysis */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <span className="text-xl">⚖️</span> Wage Analysis
              </h3>
              <PulseBadge status="processing" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Market Rate (Lahore)</span>
                <span className="text-dark-200">PKR 3,200</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Proposed Budget</span>
                <span className="text-dark-200">PKR 2,500 - 3,500</span>
              </div>
              
              <div className="pt-3 border-t border-dark-800">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Fair Wage Confirmed
                </span>
                <p className="text-xs text-dark-400 mt-2 font-urdu">
                  تجویز کردہ بجٹ مارکیٹ ریٹ کے مطابق ہے۔
                </p>
              </div>
            </div>
          </div>

          {/* SafetyGuardian Analysis */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative overflow-hidden group hover:border-brand-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <span className="text-xl">🛡️</span> Safety Check
              </h3>
              <PulseBadge status="active" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Employer Verification</span>
                <span className="text-brand-400 font-medium">Verified (Level 2)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Past Disputes</span>
                <span className="text-dark-200">0 in last 6 months</span>
              </div>
              
              <div className="pt-3 border-t border-dark-800">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Low Risk Gig
                </span>
                <p className="text-xs text-dark-400 mt-2 font-urdu">
                  کام کرنے کے لیے محفوظ ہے۔
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Apply Action */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 pt-4"
        >
          <button 
            onClick={handleApply}
            disabled={applyState !== 'idle'}
            className="flex-1 relative bg-brand-600 hover:bg-brand-500 disabled:opacity-90 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition-colors shadow-glow overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {applyState === 'idle' && (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Accept Match & Apply
                </motion.span>
              )}
              {applyState === 'processing' && (
                <motion.span key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                  <PulseBadge status="processing" className="border-none bg-transparent shadow-none px-0" />
                  Processing...
                </motion.span>
              )}
              {applyState === 'success' && (
                <motion.span key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-2 text-emerald-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Application Submitted
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>

      </div>
    </div>
  );
}
