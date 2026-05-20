'use client';

// ============================================
// Header Component — Premium Glass Design
// ============================================

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User as UserIcon, LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/providers/AuthProvider';
import { LocaleSwitcher } from './LocaleSwitcher';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/dashboard', label: t('dashboard') },
    { href: '/wallet', label: 'Wallet' },
    { href: '/demo', label: 'Judge Demo' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-dark-950/70 backdrop-blur-2xl border-b border-white/[0.06] py-3 shadow-glass'
          : 'bg-transparent py-5'
      )}
    >
      <div className="section-container flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 gradient-brand-bg" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            <span className="relative text-white font-display font-bold text-lg">RS</span>
            {/* Glow effect on hover */}
            <div className="absolute -inset-2 gradient-brand-bg rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold tracking-tight">
              <span className="gradient-text">Rozgar</span>
              <span className="text-dark-50">Sync</span>
            </span>
            <span className="text-[9px] text-dark-400 font-medium tracking-wider uppercase -mt-0.5 hidden sm:block">
              AI-Powered Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors rounded-lg',
                  isActive
                    ? 'text-brand-400'
                    : 'text-dark-300 hover:text-dark-50 hover:bg-white/[0.03]'
                )}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <LocaleSwitcher />
          
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-dark-700/50 rtl:pl-0 rtl:pr-4 rtl:border-l-0 rtl:border-r">
              <Link href="/profile" className="flex items-center gap-2 text-sm text-dark-200 hover:text-brand-400 transition-colors">
                <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-brand-500/30 transition-all">
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt="User avatar" width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-dark-400" />
                  )}
                </div>
              </Link>
              <button 
                onClick={() => signOut()}
                className="text-dark-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/5"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-dark-700/50 rtl:pl-0 rtl:pr-4 rtl:border-l-0 rtl:border-r">
              <Link href="/login" className="text-sm font-medium text-dark-200 hover:text-brand-400 transition-colors">
                {t('login')}
              </Link>
              <Link
                href="/login?mode=signup"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 hover:no-underline"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <LocaleSwitcher />
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-dark-200 hover:text-dark-50 transition-colors rounded-lg hover:bg-white/5"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-dark-950/95 backdrop-blur-2xl border-b border-dark-800/50 overflow-hidden"
          >
            <motion.div
              className="px-4 py-6 flex flex-col gap-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
              }}
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'px-4 py-3 rounded-xl text-base font-medium transition-all flex items-center gap-3',
                        isActive
                          ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                          : 'text-dark-200 hover:bg-dark-800/50'
                      )}
                    >
                      {link.label}
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 ml-auto" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              
              <div className="h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent my-3" />
              
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link href="/profile" className="px-4 py-3 flex items-center gap-3 text-dark-200 hover:text-brand-400 rounded-xl hover:bg-dark-800/50 transition-all">
                    <UserIcon className="w-5 h-5" />
                    <span>{t('profile')}</span>
                  </Link>
                  <button onClick={() => signOut()} className="px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left">
                    <LogOut className="w-5 h-5" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-dark-600 bg-dark-800 px-5 text-sm font-medium text-dark-100 transition-colors hover:bg-dark-700 hover:no-underline"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-600 hover:no-underline"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
