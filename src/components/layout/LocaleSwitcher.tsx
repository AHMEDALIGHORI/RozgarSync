// @ts-nocheck
﻿// @ts-nocheck
'use client';

// ============================================
// Locale Switcher Component
// ============================================

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// --- This needs a custom navigation setup for next-intl ---
// We'll assume the basic usage here, but normally next-intl provides createSharedPathnamesNavigation

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    setIsOpen(false);
    startTransition(() => {
      // @ts-expect-error - next-intl navigation types can be tricky
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/80 border border-dark-700 hover:bg-dark-700 transition-colors",
          isPending && "opacity-50 cursor-not-allowed"
        )}
      >
        <Globe className="w-4 h-4 text-dark-300" />
        <span className="text-sm font-medium text-dark-100">{localeNames[locale]}</span>
        <ChevronDown className={cn("w-4 h-4 text-dark-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 w-32 rounded-xl bg-dark-800 border border-dark-700 shadow-xl overflow-hidden z-50 ltr:right-0 rtl:left-0"
          >
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => handleLocaleChange(l)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-dark-700",
                  locale === l ? "text-brand-400 bg-brand-500/10 font-medium" : "text-dark-200"
                )}
              >
                {localeNames[l]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

