'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PulseBadge } from '@/components/ui/PulseBadge';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [eobiTotal, setEobiTotal] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBalance(24500);
      setEobiTotal(12450);
      setIsLoaded(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 pt-24 pb-8 px-4 md:pt-28 md:pb-12 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Financial Hub</h1>
          <p className="text-dark-400 font-urdu">آپ کی کمائی اور مالی تحفظ</p>
        </header>

        {/* Main Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-brand rounded-3xl p-8 text-white relative overflow-hidden shadow-glow-lg"
        >
          {/* Abstract pattern */}
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFFFFF" d="M47.7,-57.2C59.4,-47.3,64.8,-29.4,66.8,-11.5C68.9,6.4,67.6,24.3,58.3,37.3C49.1,50.4,32,58.6,12.7,63.1C-6.6,67.6,-28,68.4,-43.8,58.7C-59.5,49,-69.5,28.8,-71.4,8.1C-73.3,-12.6,-67,-33.7,-53.4,-44.6C-39.7,-55.5,-18.6,-56.2,-0.2,-55.9C18.2,-55.6,35.9,-54.2,47.7,-57.2Z" transform="translate(100 100) scale(1.1)" />
            </svg>
          </div>

          <div className="relative z-10">
            <p className="text-brand-100 mb-1">Total Available Balance</p>
            <h2 className="text-5xl font-display font-black tracking-tight">
              <span className="text-3xl text-brand-200 mr-2">PKR</span>
              {isLoaded ? balance.toLocaleString() : '...'}
            </h2>

            <div className="mt-8 flex gap-4">
              <button className="px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
                Withdraw
              </button>
              <button className="px-6 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 border border-brand-400/50 transition-colors">
                Transaction History
              </button>
            </div>
          </div>
        </motion.div>

        {/* EOBI & Insurance (FinancialProtector Data) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* EOBI Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">EOBI Pension Tracker</h3>
                <p className="text-xs text-dark-400 font-urdu mt-1">آپ کا ریٹائرمنٹ فنڈ</p>
              </div>
              <PulseBadge status="active" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Total Contribution</span>
                <span className="text-white font-mono">PKR {isLoaded ? eobiTotal.toLocaleString() : '...'}</span>
              </div>
              <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 rounded-full" />
              </div>
              <p className="text-xs text-dark-400 text-right">33% of yearly target</p>
            </div>

            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3">
              <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-emerald-200/80 leading-relaxed font-urdu">
                فنانشل پروٹیکٹر (FinancialProtector) نے پچھلے گِگ سے 150 روپے کی کٹوتی آپ کے ای او بی آئی (EOBI) اکاؤنٹ میں جمع کر دی ہے۔
              </p>
            </div>
          </motion.div>

          {/* Micro-insurance (Sehat Sahulat) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Sehat Sahulat Card</h3>
                <p className="text-xs text-dark-400 font-urdu mt-1">صحت کی سہولت</p>
              </div>
              <span className="px-2 py-1 bg-dark-800 text-dark-300 rounded text-xs">Inactive</span>
            </div>

            <div className="text-center py-4">
              <div className="w-16 h-16 bg-dark-800 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <p className="text-sm text-dark-300">
                You are currently not enrolled in the micro-insurance program.
              </p>
            </div>

            <button className="w-full py-3 mt-2 bg-dark-800 hover:bg-dark-700 text-white text-sm font-medium rounded-xl transition-colors">
              Opt-in for PKR 100/month
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
