'use client';

import { motion } from 'framer-motion';
import { PulseBadge } from '@/components/ui/PulseBadge';

export default function SkillsCenterPage() {
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex justify-between items-end border-b border-dark-800 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Skills Center</h1>
            <p className="text-dark-400 font-urdu">اپنی مہارت کو نکھاریں اور زیادہ کمائیں</p>
          </div>
          <div className="hidden md:block">
            <PulseBadge status="active" label="UpskillingCoach Active" />
          </div>
        </header>

        {/* AI Recommendations */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
          </div>

          <div className="bg-brand-900/20 border border-brand-500/30 rounded-2xl p-6 mb-6">
            <p className="text-brand-300 mb-2 font-urdu text-lg leading-relaxed">
              تجزیے کے مطابق، اگر آپ سولر پینل کی تنصیب کا کورس مکمل کر لیں تو آپ کی ماہانہ آمدنی میں 30٪ تک کا اضافہ ہو سکتا ہے۔
            </p>
            <p className="text-sm text-brand-400/80">
              Analysis based on your current level (Intermediate Electrician) and market demand in Lahore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Card 1 */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-dark-900 border border-dark-800 rounded-2xl p-6 hover:border-brand-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-bold uppercase">
                  NAVTTC
                </span>
                <span className="text-xs text-dark-400 font-mono">20 HOURS</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-400 transition-colors">
                Solar Panel Installation Certification
              </h3>
              <p className="text-dark-400 text-sm mb-6">
                Learn modern solar inverter installations and earn a government-recognized certificate.
              </p>
              <div className="pt-4 border-t border-dark-800 flex justify-between items-center">
                <span className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  +30% Income Potential
                </span>
                <span className="text-xs text-dark-300 font-medium px-3 py-1.5 bg-dark-800 rounded-lg group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  Enroll Free
                </span>
              </div>
            </motion.div>

            {/* Course Card 2 */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-dark-900 border border-dark-800 rounded-2xl p-6 hover:border-brand-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold uppercase">
                  DigiSkills
                </span>
                <span className="text-xs text-dark-400 font-mono">2 HOURS</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-400 transition-colors">
                Customer Communication for Freelancers
              </h3>
              <p className="text-dark-400 text-sm mb-6">
                Improve your soft skills to handle customer disputes and get better 5-star ratings.
              </p>
              <div className="pt-4 border-t border-dark-800 flex justify-between items-center">
                <span className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  +5% Income Potential
                </span>
                <span className="text-xs text-dark-300 font-medium px-3 py-1.5 bg-dark-800 rounded-lg group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  Enroll Free
                </span>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}
