'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/providers/AuthProvider';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || user) return;

    const redirect = encodeURIComponent(pathname || `/${locale}/dashboard`);
    router.replace(`/${locale}/login?redirect=${redirect}`);
  }, [loading, locale, pathname, router, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-brand-400" />
          </div>
          <LoadingSpinner size="lg" />
          <p className="text-sm text-dark-400">Checking your secure session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
