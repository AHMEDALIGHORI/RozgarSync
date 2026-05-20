'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';

export default function OnboardingPage() {
  const router = useRouter();
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    language: 'ur',
    phone: '',
    otp: '',
    cnic: '',
    skills: [] as string[],
  });

  const nextStep = () => setStep((s) => s + 1);
  const finish = () => router.push(`/${locale}/dashboard`);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center pt-24 pb-8 px-4 md:pt-28 md:pb-12 md:px-8">
      <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl shadow-glass-lg overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-1 bg-dark-800 w-full">
          <motion.div 
            className="h-full bg-brand-500"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white">Choose Language</h2>
                  <p className="text-dark-400 font-urdu text-lg">زبان کا انتخاب کریں</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, language: 'ur' })}
                    className={`p-4 rounded-xl border ${formData.language === 'ur' ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-dark-700 hover:border-dark-600 text-dark-200'}`}
                  >
                    <span className="font-urdu text-2xl block mb-2">اردو</span>
                    <span className="text-xs">Urdu</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, language: 'en' })}
                    className={`p-4 rounded-xl border ${formData.language === 'en' ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-dark-700 hover:border-dark-600 text-dark-200'}`}
                  >
                    <span className="font-display text-2xl font-semibold block mb-2">EN</span>
                    <span className="text-xs font-urdu">English</span>
                  </button>
                </div>

                <button onClick={nextStep} className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-colors">
                  Continue / آگے بڑھیں
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white">Phone Verification</h2>
                  <p className="text-dark-400 font-urdu text-lg">موبائل نمبر کی تصدیق</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 block mb-1">Mobile Number (+92)</label>
                    <input 
                      type="text" 
                      placeholder="3XX XXXXXXX"
                      className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  {formData.phone.length >= 10 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="text-xs text-dark-400 block mb-1">6-digit OTP</label>
                      <input 
                        type="text" 
                        placeholder="123456"
                        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none tracking-widest text-center"
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                      />
                    </motion.div>
                  )}
                </div>

                <button onClick={nextStep} disabled={formData.otp.length < 6} className="w-full py-3 bg-brand-600 disabled:bg-dark-700 disabled:text-dark-400 text-white rounded-xl font-medium transition-colors">
                  Verify / تصدیق کریں
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white">Identity Verification</h2>
                  <p className="text-dark-400 font-urdu text-lg">شناختی کارڈ کی تصدیق</p>
                </div>
                
                <div className="bg-emerald-900/20 border border-emerald-900/50 p-4 rounded-xl flex gap-3">
                  <svg className="w-6 h-6 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    Your CNIC is encrypted using AES-256-GCM. We never store raw ID numbers. SafetyGuardian will verify your identity.
                  </p>
                </div>

                <div>
                  <label className="text-xs text-dark-400 block mb-1">CNIC Number</label>
                  <input 
                    type="text" 
                    placeholder="XXXXX-XXXXXXX-X"
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none tracking-wider text-center"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  />
                </div>

                <button onClick={nextStep} disabled={formData.cnic.length < 13} className="w-full py-3 bg-brand-600 disabled:bg-dark-700 disabled:text-dark-400 text-white rounded-xl font-medium transition-colors">
                  Encrypt & Submit / جمع کرائیں
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white">Your Skills</h2>
                  <p className="text-dark-400 font-urdu text-lg">اپنی مہارتیں منتخب کریں</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['Plumbing', 'Electrical', 'AC Repair', 'Carpentry', 'Painting', 'Cleaning'].map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        const skills = formData.skills.includes(skill)
                          ? formData.skills.filter(s => s !== skill)
                          : [...formData.skills, skill];
                        setFormData({ ...formData, skills });
                      }}
                      className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                        formData.skills.includes(skill) 
                          ? "bg-brand-500 border-brand-400 text-white" 
                          : "bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-500"
                      )}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                <button onClick={finish} disabled={formData.skills.length === 0} className="w-full py-3 bg-brand-600 disabled:bg-dark-700 disabled:text-dark-400 text-white rounded-xl font-medium transition-colors">
                  Complete Setup / مکمل کریں
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Needed since clsx was used
import clsx from 'clsx';
