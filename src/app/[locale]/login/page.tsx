'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/providers/AuthProvider';
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/firebase';

type AuthMode = 'signin' | 'signup';

function hasLikelyFirebaseWebKey(): boolean {
  return (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').startsWith('AIza');
}

function shouldUseLocalAuthFallback(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  return (
    code.includes('api-key') ||
    code === 'auth/configuration-not-found' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/unauthorized-domain'
  );
}

function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for this email.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.';
    case 'auth/unauthorized-domain':
      return 'This domain/port is not authorized in Firebase Console settings. Access via http://localhost:3001 or add this domain to authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase.';
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/configuration-not-found':
      return 'Firebase authentication is not configured with a valid project key.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return error instanceof Error
        ? error.message
        : 'Authentication failed. Please try again.';
  }
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectPath, setRedirectPath] = useState('');

  const router = useRouter();
  const locale = useLocale();
  const { user, loading: authLoading, signInLocalUser } = useAuth();

  const isSignUp = mode === 'signup';
  const targetPath = useMemo(
    () => redirectPath || `/${locale}/dashboard`,
    [locale, redirectPath]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get('mode');
    const requestedRedirect = params.get('redirect');

    if (requestedMode === 'signup') {
      setMode('signup');
    }

    if (requestedRedirect?.startsWith(`/${locale}/`)) {
      setRedirectPath(requestedRedirect);
    } else {
      setRedirectPath(`/${locale}/dashboard`);
    }
  }, [locale]);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(targetPath);
    }
  }, [authLoading, router, targetPath, user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    if (isSignUp && !trimmedName) {
      setError('Full name is required to create an account.');
      return;
    }

    setLoading(true);
    try {
      if (!hasLikelyFirebaseWebKey()) {
        signInLocalUser({
          email: trimmedEmail,
          displayName: isSignUp ? trimmedName : undefined,
        });
        router.replace(targetPath);
        return;
      }

      if (isSignUp) {
        await registerWithEmail(trimmedEmail, password, trimmedName);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
      router.replace(targetPath);
    } catch (err) {
      if (shouldUseLocalAuthFallback(err)) {
        signInLocalUser({
          email: trimmedEmail,
          displayName: isSignUp ? trimmedName : undefined,
        });
        router.replace(targetPath);
        return;
      }

      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      if (!hasLikelyFirebaseWebKey()) {
        signInLocalUser({
          email: 'mock-google-user@example.com',
          displayName: 'Google Test User',
        });
        router.replace(targetPath);
        return;
      }

      await signInWithGoogle();
      router.replace(targetPath);
    } catch (err) {
      if (shouldUseLocalAuthFallback(err)) {
        signInLocalUser({
          email: 'mock-google-user@example.com',
          displayName: 'Google Test User',
        });
        router.replace(targetPath);
        return;
      }

      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center pt-24 pb-8 px-4 md:pt-28 md:pb-12 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh-pattern opacity-30" />
      <div className="absolute inset-0 grid-pattern opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-white font-display font-bold text-2xl">RS</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">RozgarSync</h1>
          <p className="text-dark-400 mt-2">Secure access for workers and employers</p>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 md:p-8 shadow-glass">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-950 border border-dark-800 mb-6">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                !isSignUp
                  ? 'bg-brand-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                isSignUp
                  ? 'bg-brand-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <h2 className="text-xl font-display font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-dark-400 mb-6">
            {isSignUp
              ? 'Register with email and password to open your dashboard.'
              : 'Sign in to continue to your dashboard.'}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-300 flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <label className="block">
                <span className="sr-only">Full name</span>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required={isSignUp}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none transition-colors"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="sr-only">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl py-3 pl-11 pr-11 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </label>

            <Button
              type="submit"
              fullWidth
              isLoading={loading}
              disabled={googleLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="mt-2"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-dark-800" />
            <span className="text-xs uppercase tracking-wider text-dark-500">or</span>
            <div className="h-px flex-1 bg-dark-800" />
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            isLoading={googleLoading}
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode(isSignUp ? 'signin' : 'signup');
              }}
              className="text-sm text-dark-400 hover:text-white transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
