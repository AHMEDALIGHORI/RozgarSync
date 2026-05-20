// ============================================
// Map Layout — Sidebar + Content Area
// ============================================

'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useEffect } from 'react';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-dark-950">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
