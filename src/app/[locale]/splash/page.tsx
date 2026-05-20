'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';

export default function SplashPage() {
  const router = useRouter();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // Redirect to onboarding after 3 seconds
    const timer = setTimeout(() => {
      router.push(`/${locale}/onboarding`);
    }, 3500);

    return () => {
      clearTimeout(timer);
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, [router, locale]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-mesh-pattern opacity-30" />
      
      {/* Central Logo Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Animated Rings */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-brand-500 border-r-2 border-r-transparent opacity-70"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border-b-2 border-emerald-400 border-l-2 border-l-transparent opacity-50"
          />
          
          {/* Mock Truck Art Logo SVG */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative w-24 h-24 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-glow-lg"
          >
            <span className="text-4xl font-urdu text-white font-bold">ر</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-6 text-center space-y-2"
        >
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Rozgar<span className="text-brand-400">Sync</span>
          </h1>
          <p className="text-dark-300 font-urdu text-xl">اپنے ہنر سے کمائیں</p>
        </motion.div>
      </motion.div>

      {/* Built with Antigravity Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-10 z-10"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-dark-900/80 border border-dark-700 backdrop-blur-sm">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="text-sm font-mono text-dark-200">
            Built with <span className="text-white font-semibold">Antigravity</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
