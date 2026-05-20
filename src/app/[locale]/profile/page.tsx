'use client';

import { motion } from 'framer-motion';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-dark-950 pt-24 pb-8 px-4 md:pt-28 md:pb-12 md:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <header className="flex items-center gap-6 bg-dark-900 border border-dark-800 rounded-2xl p-6 md:p-8">
          <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center text-4xl text-white font-urdu">
            ع
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Ali Raza</h1>
            <div className="flex items-center gap-2 text-sm text-dark-300">
              <span className="flex items-center gap-1 text-emerald-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                CNIC Verified
              </span>
              <span>•</span>
              <span>Lahore, PK</span>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-900 border border-dark-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">My Skills</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-dark-800 border border-dark-700 text-dark-200 rounded-full text-sm">Plumbing (Intermediate)</span>
            <span className="px-3 py-1 bg-dark-800 border border-dark-700 text-dark-200 rounded-full text-sm">PPRC Welding</span>
            <span className="px-3 py-1 bg-dark-800 border border-dark-700 text-dark-200 rounded-full text-sm">Pipe Fitting</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-900 border border-dark-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Reviews & Rating</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl font-display font-black text-white">4.8</div>
            <div className="flex flex-col">
              <div className="flex text-brand-500">
                ★ ★ ★ ★ ★
              </div>
              <span className="text-xs text-dark-400">Based on 142 completed gigs</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
