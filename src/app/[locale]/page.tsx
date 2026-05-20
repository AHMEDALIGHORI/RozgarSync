'use client';

// ============================================
// Landing Page — Award-Winning Premium Design
// ============================================

import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRef } from 'react';
import {
  Brain,
  MapPin,
  Shield,
  Calendar,
  Star,
  Globe,
  UserPlus,
  Search,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  Briefcase,
  TrendingUp,
  Zap,
  Eye,
  FileText,
  MessageSquare,
  Activity,
  Sparkles,
  ChevronRight,
  Terminal,
  Bot,
} from 'lucide-react';

import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { GlowCard } from '@/components/ui/GlowCard';
import { ParticleBackground } from '@/components/ui/ParticleBackground';
import { AgentStatusOrb } from '@/components/ui/AgentStatusOrb';
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter';
import { TypewriterText } from '@/components/ui/TypewriterText';

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

// --- Agent Data ---
const agents = [
  {
    name: 'Matching Agent',
    icon: Brain,
    status: 'processing' as const,
    desc: 'AI-powered skill matching with context understanding',
    confidence: 0.94,
  },
  {
    name: 'Verification Agent',
    icon: Shield,
    status: 'completed' as const,
    desc: 'Identity & credential verification pipeline',
    confidence: 0.98,
  },
  {
    name: 'Pricing Agent',
    icon: TrendingUp,
    status: 'processing' as const,
    desc: 'Dynamic market-aware pricing optimization',
    confidence: 0.87,
  },
  {
    name: 'Communication Agent',
    icon: MessageSquare,
    status: 'idle' as const,
    desc: 'Bilingual natural language processing',
    confidence: 0.91,
  },
  {
    name: 'Insights Agent',
    icon: Eye,
    status: 'completed' as const,
    desc: 'Real-time analytics & pattern detection',
    confidence: 0.96,
  },
];

// --- Mock Terminal Events ---
const terminalEvents = [
  { time: '09:14:32', agent: 'MatchingAgent', event: 'TASK_RECEIVED', detail: 'Finding plumber in Lahore...' },
  { time: '09:14:33', agent: 'MatchingAgent', event: 'SKILL_MATCH', detail: 'Found 12 candidates (score > 0.85)' },
  { time: '09:14:34', agent: 'VerificationAgent', event: 'ID_VERIFIED', detail: 'Worker #4821 CNIC verified ✓' },
  { time: '09:14:35', agent: 'PricingAgent', event: 'PRICE_SET', detail: 'Market rate: PKR 2,500 (±15%)' },
  { time: '09:14:36', agent: 'MatchingAgent', event: 'MATCH_COMPLETE', detail: 'Top match: Ahmad (4.9★, 2.3km)' },
  { time: '09:14:37', agent: 'InsightsAgent', event: 'ANALYTICS', detail: 'Demand spike: +34% plumbing today' },
];

export default function LandingPage() {
  const t = useTranslations();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const features = [
    {
      icon: Brain,
      title: t('features.aiMatching'),
      desc: t('features.aiMatchingDesc'),
    },
    {
      icon: MapPin,
      title: t('features.liveMap'),
      desc: t('features.liveMapDesc'),
    },
    {
      icon: Shield,
      title: t('features.securePayments'),
      desc: t('features.securePaymentsDesc'),
    },
    {
      icon: Calendar,
      title: t('features.instantBooking'),
      desc: t('features.instantBookingDesc'),
    },
    {
      icon: Star,
      title: t('features.ratingSystem'),
      desc: t('features.ratingSystemDesc'),
    },
    {
      icon: Globe,
      title: t('features.multilingual'),
      desc: t('features.multilingualDesc'),
    },
  ];

  const steps = [
    {
      icon: UserPlus,
      title: t('howItWorks.step1Title'),
      desc: t('howItWorks.step1Desc'),
    },
    {
      icon: Search,
      title: t('howItWorks.step2Title'),
      desc: t('howItWorks.step2Desc'),
    },
    {
      icon: CheckCircle,
      title: t('howItWorks.step3Title'),
      desc: t('howItWorks.step3Desc'),
    },
  ];

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Particle dot grid background */}
        <ParticleBackground dotCount={100} />

        {/* Background mesh gradient */}
        <div className="absolute inset-0 mesh-bg" />

        {/* Animated floating orbs */}
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-brand-500/20 blur-[100px]"
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-[15%] w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px]"
          animate={{
            y: [0, 20, 0],
            scale: [1, 0.95, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-400/10 blur-[150px]"
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="section-container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 py-20 lg:py-0"
        >
          {/* Left: Text Content */}
          <motion.div
            className="flex flex-col justify-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {t('hero.badge')}
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6"
            >
              <span className="gradient-text">{t('hero.title')}</span>
            </motion.h1>

            {/* Subtitle with typewriter */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-dark-300 leading-relaxed mb-8 max-w-xl"
            >
              <TypewriterText
                text={t('hero.subtitle')}
                speed={20}
                delay={800}
                showCursor={true}
              />
            </motion.div>

            {/* CTA Buttons with gradient border */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Link
                href="/ur/register"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 active:scale-[0.98] overflow-hidden"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 gradient-brand-bg" />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                <span className="relative text-white">{t('hero.ctaWorker')}</span>
                <ArrowLeft className="relative w-5 h-5 text-white rtl:hidden group-hover:-translate-x-1 transition-transform" />
                <ArrowRight className="relative w-5 h-5 text-white ltr:hidden group-hover:translate-x-1 transition-transform" />
                {/* Glow effect */}
                <div className="absolute -inset-1 gradient-brand-bg rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10" />
              </Link>
              <Link
                href="/ur/services"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-brand-500/30 hover:border-brand-500/60 text-brand-300 hover:text-brand-200 font-semibold text-lg transition-all duration-300 hover:bg-brand-500/5 hover:shadow-glow"
              >
                {t('hero.ctaClient')}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Animated Stats Row */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex flex-wrap gap-8"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <AnimatedCounter value={10000} suffix="+" className="text-sm font-bold text-dark-100" />
                <span className="text-sm text-dark-400">Workers</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-400" />
                <AnimatedCounter value={50} suffix="+" className="text-sm font-bold text-dark-100" />
                <span className="text-sm text-dark-400">Cities</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-brand-400" />
                <AnimatedCounter value={4.8} suffix="★" className="text-sm font-bold text-dark-100" decimals={1} duration={1500} />
                <span className="text-sm text-dark-400">Rating</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Premium Dashboard Preview */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative w-full max-w-lg">
              {/* Main glass card */}
              <div className="glass-premium rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-display font-bold text-dark-100">
                    {t('dashboard.overview')}
                  </h3>
                  <span className="flex items-center gap-1.5 text-2xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Mock stat cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t('dashboard.totalWorkers'), value: 12450, icon: Users, color: 'text-brand-400', bgColor: 'bg-brand-500/10' },
                    { label: t('dashboard.totalServices'), value: 3280, icon: Briefcase, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
                    { label: t('dashboard.activeBookings'), value: 847, icon: Calendar, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
                    { label: t('dashboard.revenue'), value: 2.4, icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="bg-dark-900/60 rounded-xl p-3 border border-dark-700/30 hover:border-dark-600/50 transition-colors"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <div className={`w-7 h-7 rounded-lg ${item.bgColor} flex items-center justify-center mb-2`}>
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <p className="text-lg font-bold text-dark-50">
                        {i === 3 ? (
                          <><span className="text-xs font-normal text-dark-400">PKR </span><AnimatedCounter value={item.value} suffix="M" decimals={1} duration={1500} /></>
                        ) : (
                          <AnimatedCounter value={item.value} duration={1500} />
                        )}
                      </p>
                      <p className="text-2xs text-dark-400 mt-0.5">{item.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Mock chart area */}
                <div className="h-28 bg-dark-900/40 rounded-xl border border-dark-700/20 flex items-end justify-around px-4 pb-3 pt-4 relative overflow-hidden">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between py-3 px-4 pointer-events-none">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-full h-px bg-dark-700/20" />
                    ))}
                  </div>
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-3 rounded-t-md bg-gradient-to-t from-brand-500 to-emerald-400 relative"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.2 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 opacity-0 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    </motion.div>
                  ))}
                </div>

                {/* AI Agent indicator */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-2xs text-dark-300">5 AI Agents Active</span>
                  </div>
                  <div className="flex -space-x-1">
                    {['bg-brand-400', 'bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-purple-400'].map((color, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full ${color} border-2 border-dark-900`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative glow behind card */}
              <div className="absolute -inset-4 bg-brand-500/5 rounded-3xl blur-xl -z-10" />
              <div className="absolute -inset-8 bg-emerald-500/3 rounded-3xl blur-2xl -z-20" />
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-dark-500/40 flex justify-center pt-1.5">
            <motion.div
              className="w-1 h-2 rounded-full bg-brand-400"
              animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ===== STATS BANNER ===== */}
      <section className="relative py-16 overflow-hidden border-y border-dark-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-900 to-dark-950" />
        <div className="section-container relative z-10">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {[
              { value: 10000, suffix: '+', label: 'Registered Workers', icon: Users },
              { value: 50, suffix: '+', label: 'Cities Covered', icon: MapPin },
              { value: 15, suffix: '+', label: 'Service Categories', icon: Briefcase },
              { value: 98, suffix: '%', label: 'Satisfaction Rate', icon: Star },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <stat.icon className="w-6 h-6 text-brand-400 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-display font-bold text-dark-50 mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2000} />
                </div>
                <p className="text-sm text-dark-400">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-24 relative">
        <div className="section-container">
          {/* Section Header */}
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-4">
              <Zap className="w-3 h-3" />
              Powerful Features
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              {t('features.title')}
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Built with cutting-edge AI technology to revolutionize how Pakistan&apos;s skilled workforce connects with opportunities.
            </p>
            <div className="w-24 h-1 mx-auto rounded-full gradient-brand-bg mt-6" />
          </motion.div>

          {/* Feature Cards Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={scaleIn}>
                <GlowCard className="h-full">
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-brand-400" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-dark-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-dark-400 text-sm leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== AI AGENTS SHOWCASE ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/50 to-dark-950" />
        <ParticleBackground dotCount={50} className="opacity-30" />

        <div className="section-container relative z-10">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
              <Bot className="w-3 h-3" />
              Multi-Agent Architecture
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              5 AI Agents, One Platform
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Our proprietary multi-agent system orchestrates specialized AI agents that work together to deliver intelligent labor marketplace automation.
            </p>
          </motion.div>

          {/* Agent Cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {agents.map((agent, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <GlowCard className="h-full" hoverLift={true}>
                  <div className="p-5 text-center">
                    {/* Agent icon with glow */}
                    <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 relative">
                      <agent.icon className="w-7 h-7 text-brand-400" />
                      <div className="absolute -top-1 -right-1">
                        <AgentStatusOrb status={agent.status} size="sm" />
                      </div>
                    </div>

                    <h3 className="text-sm font-display font-bold text-dark-100 mb-1.5">
                      {agent.name}
                    </h3>
                    <p className="text-2xs text-dark-400 leading-relaxed mb-4">
                      {agent.desc}
                    </p>

                    {/* Confidence Meter */}
                    <ConfidenceMeter
                      value={agent.confidence}
                      size={56}
                      strokeWidth={3}
                      label="Confidence"
                      className="mx-auto"
                    />
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== LIVE DEMO PREVIEW — AGENT TRACE VIEWER ===== */}
      <section className="py-24 relative">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Description */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={slideInLeft}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-4">
                <Terminal className="w-3 h-3" />
                Live Agent Traces
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Watch AI in Real-Time
              </h2>
              <p className="text-dark-400 leading-relaxed mb-6">
                Our transparent agent trace viewer lets you see exactly how each AI agent processes requests, makes decisions, and orchestrates multi-step workflows.
              </p>
              <div className="space-y-3">
                {[
                  'Real-time agent decision transparency',
                  'Multi-step task orchestration logs',
                  'Confidence scoring at every step',
                  'Complete audit trail for trust',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <span className="text-sm text-dark-200">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Terminal Preview */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={slideInRight}
            >
              <div className="terminal-style overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/10 bg-black/30">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-2xs text-dark-400 ml-2">agent-trace-viewer</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AgentStatusOrb status="processing" size="sm" />
                    <span className="text-2xs text-emerald-400">streaming</span>
                  </div>
                </div>

                {/* Terminal content */}
                <div className="p-4 space-y-1 max-h-72 overflow-hidden">
                  {terminalEvents.map((event, i) => (
                    <motion.div
                      key={i}
                      className="flex gap-2 text-xs font-mono"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                    >
                      <span className="text-dark-500 flex-shrink-0">{event.time}</span>
                      <span className="text-purple-400 flex-shrink-0 w-28 truncate">[{event.agent}]</span>
                      <span className="text-emerald-400 flex-shrink-0 w-24">{event.event}</span>
                      <span className="text-dark-300 truncate">{event.detail}</span>
                    </motion.div>
                  ))}

                  {/* Blinking cursor line */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-emerald-400 text-xs font-mono">❯</span>
                    <span className="w-1.5 h-4 bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="py-24 relative">
        <div className="section-container">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              {t('howItWorks.title')}
            </h2>
            <div className="w-24 h-1 mx-auto rounded-full gradient-brand-bg" />
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-px h-[calc(100%-8rem)] bg-gradient-to-b from-brand-500/50 via-brand-500/20 to-transparent hidden md:block" />
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent md:hidden" />

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={stagger}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  className="text-center relative"
                >
                  {/* Numbered circle */}
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 rounded-full gradient-brand-bg flex items-center justify-center shadow-glow">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-dark-900 border-2 border-brand-500 flex items-center justify-center text-xs font-bold text-brand-300">
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-dark-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-dark-400 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/30 to-dark-950" />
        <div className="section-container relative z-10">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-4">
              <Star className="w-3 h-3" />
              Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Trusted Across Pakistan
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {[
              {
                name: 'Ahmad Raza',
                role: 'Electrician, Lahore',
                text: 'RozgarSync transformed my business. I went from 2-3 jobs a week to getting daily requests. The AI matching is incredible!',
                rating: 5,
              },
              {
                name: 'Fatima Khan',
                role: 'Homeowner, Karachi',
                text: 'Finding reliable workers used to be a nightmare. Now I can verify credentials, check ratings, and book instantly. Game changer!',
                rating: 5,
              },
              {
                name: 'Hassan Ali',
                role: 'Plumber, Islamabad',
                text: 'The best part is the secure payment system. I always get paid on time and the AI suggests fair pricing for my area.',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <GlowCard className="h-full">
                  <div className="p-6">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>

                    <p className="text-dark-200 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{testimonial.text}&rdquo;
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-brand-bg flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-100">{testimonial.name}</p>
                        <p className="text-2xs text-dark-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand-bg opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />

        <motion.div
          className="section-container relative z-10 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl md:text-5xl font-display font-bold text-white mb-4"
          >
            {t('cta.title')}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-lg text-white/80 mb-8 max-w-xl mx-auto"
          >
            {t('cta.subtitle')}
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Link
              href="/ur/register"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white text-brand-500 font-bold text-lg hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-glass-lg"
            >
              {t('cta.button')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap justify-center gap-6 mt-10 text-white/60 text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>CNIC Verified</span>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
