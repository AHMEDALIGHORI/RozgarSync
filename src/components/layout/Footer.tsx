'use client';

// ============================================
// Footer Component — Premium Design
// ============================================

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Heart, Zap, ArrowUpRight } from 'lucide-react';
import { APP_NAME } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

export function Footer() {
  const t = useTranslations('footer');

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="relative bg-dark-950 pt-px">
      {/* Premium gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mt-px" />

      {/* Subtle glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-brand-500/5 blur-3xl pointer-events-none" />

      <div className="section-container relative pt-16 pb-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          
          {/* Brand Col */}
          <motion.div className="space-y-5" variants={fadeUp} custom={0}>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl gradient-brand-bg flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
                <span className="text-white font-display font-bold text-sm">RS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-display font-bold tracking-tight">
                  <span className="gradient-text">Rozgar</span>
                  <span className="text-dark-50">Sync</span>
                </span>
              </div>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed max-w-xs">
              {t('aboutDesc')}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-9 h-9 rounded-xl bg-dark-900/80 border border-dark-700/50 flex items-center justify-center text-dark-400 hover:text-brand-400 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>

            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </div>
          </motion.div>

          {/* Links Col 1 */}
          <motion.div variants={fadeUp} custom={1}>
            <h4 className="font-display font-bold text-dark-100 mb-6 text-sm uppercase tracking-wider">
              {t('about')}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/about', label: t('about') },
                { href: '/careers', label: 'Careers' },
                { href: '/blog', label: 'Blog' },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 hover:text-brand-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Links Col 2 */}
          <motion.div variants={fadeUp} custom={2}>
            <h4 className="font-display font-bold text-dark-100 mb-6 text-sm uppercase tracking-wider">
              {t('servicesTitle')}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/services', label: 'All Services' },
                { href: '/workers', label: 'Find Workers' },
                { href: '/map', label: 'Live Map' },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 hover:text-brand-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Links Col 3 */}
          <motion.div variants={fadeUp} custom={3}>
            <h4 className="font-display font-bold text-dark-100 mb-6 text-sm uppercase tracking-wider">
              {t('supportTitle')}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/help', label: t('helpCenter') },
                { href: '/terms', label: t('terms') },
                { href: '/privacy', label: t('privacy') },
                { href: '/contact', label: t('contact') },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 hover:text-brand-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

        </motion.div>

        {/* Bottom Bar */}
        <div className="relative">
          <div className="h-px bg-gradient-to-r from-transparent via-dark-700/50 to-transparent mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-dark-500">
              &copy; {new Date().getFullYear()} {APP_NAME}. {t('rights')}.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-xs text-dark-500 flex items-center gap-1.5">
                Made with <Heart className="w-3 h-3 text-red-500 animate-pulse" /> for Pakistan
              </p>
              <div className="h-3 w-px bg-dark-700" />
              <div className="flex items-center gap-1 text-xs text-dark-500">
                <Zap className="w-3 h-3 text-brand-400" />
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
