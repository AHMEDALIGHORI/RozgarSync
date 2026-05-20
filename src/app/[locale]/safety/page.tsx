'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// unused import removed

export default function SafetyCenterPage() {
  const [sosActive, setSosActive] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);

  const handleSOS = () => {
    setSosActive(true);
    setLocationSharing(true);
    // In a real app, this would emit 'safety.sos_triggered' to the EventBus
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-24 pb-8 px-4 md:pt-28 md:pb-12 md:px-8 relative overflow-hidden">
      
      {/* SOS Active Background Pulse */}
      <AnimatePresence>
        {sosActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="max-w-xl mx-auto relative z-10 space-y-6">
        
        <header className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Safety Center</h1>
          <p className="text-dark-400 font-urdu text-lg">حفاظتی مرکز</p>
        </header>

        {/* Giant SOS Button */}
        <div className="flex justify-center py-8">
          <motion.button
            whileHover={!sosActive ? { scale: 1.05 } : {}}
            whileTap={!sosActive ? { scale: 0.95 } : {}}
            onClick={handleSOS}
            disabled={sosActive}
            className={`
              relative flex items-center justify-center w-48 h-48 rounded-full shadow-2xl transition-all
              ${sosActive 
                ? 'bg-red-600 cursor-not-allowed shadow-[0_0_60px_rgba(220,38,38,0.6)]' 
                : 'bg-gradient-to-br from-red-500 to-red-700 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]'}
            `}
          >
            {/* Ripples */}
            {sosActive && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-500"
                  animate={{ scale: [1, 2], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-500"
                  animate={{ scale: [1, 2], opacity: [1, 0] }}
                  transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                />
              </>
            )}
            
            <div className="text-center">
              <span className="block text-4xl font-display font-black text-white tracking-widest">
                SOS
              </span>
              <span className="block text-white/80 font-urdu mt-2">
                مدد طلب کریں
              </span>
            </div>
          </motion.button>
        </div>

        {/* Status Panel */}
        <AnimatePresence>
          {sosActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/50 border border-red-500/30 rounded-2xl p-6 text-center space-y-4"
            >
              <h3 className="text-xl font-bold text-red-400">Emergency Protocol Active</h3>
              <p className="text-red-200/80 font-urdu">
                آپ کی لوکیشن اور ایمرجنسی الرٹ سیفٹی گارڈین (SafetyGuardian) کو بھیج دیا گیا ہے۔
              </p>
              
              <div className="flex justify-center gap-4 pt-4 border-t border-red-500/20">
                <button className="px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white text-sm hover:bg-dark-800 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call Police 15
                </button>
                <button 
                  onClick={() => { setSosActive(false); setLocationSharing(false); }}
                  className="px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-dark-300 text-sm hover:bg-dark-800 hover:text-white transition-colors"
                >
                  Cancel Protocol
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Location Toggle */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Live Location Tracking</h3>
            <p className="text-sm text-dark-400">Share location with SafetyGuardian during gigs</p>
          </div>
          <button 
            onClick={() => setLocationSharing(!locationSharing)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${locationSharing ? 'bg-brand-500' : 'bg-dark-700'}`}
          >
            <motion.div 
              className="w-4 h-4 bg-white rounded-full shadow-md"
              animate={{ x: locationSharing ? 24 : 0 }}
            />
          </button>
        </div>

      </div>
    </div>
  );
}
