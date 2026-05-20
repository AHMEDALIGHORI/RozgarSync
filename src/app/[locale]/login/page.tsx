'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Demo mode — simulate login success
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Store demo user in localStorage
    localStorage.setItem('rozgarsync_user', JSON.stringify({
      name: name || 'Ahmed Ali',
      email: email || 'demo@rozgarsync.pk',
      role: 'worker',
      city: 'Lahore',
      joinedAt: new Date().toISOString(),
    }));

    setLoading(false);
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-white font-display font-bold text-2xl">RS</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">RozgarSync</h1>
          <p className="text-dark-400 mt-2">AI-Powered Gig Economy Platform</p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-display font-bold text-white mb-6">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-400">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl py-3 pl-11 pr-11 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-display font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Demo login shortcut */}
          <button
            onClick={() => {
              setEmail('demo@rozgarsync.pk');
              setPassword('demo1234');
              setName('Ahmed Ali');
            }}
            className="w-full mt-3 py-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            ⚡ Use Demo Credentials
          </button>

          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-dark-400 hover:text-white transition-colors">
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Features badge */}
        <div className="flex justify-center gap-4 mt-6 text-xs text-dark-500">
          <span>🔐 SHA-256 Secured</span>
          <span>🤖 5 AI Agents</span>
          <span>🇵🇰 Pakistan-First</span>
        </div>
      </motion.div>
    </div>
  );
}
