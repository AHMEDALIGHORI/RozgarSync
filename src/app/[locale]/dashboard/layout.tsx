// ============================================
// Dashboard Layout — Sidebar + Content Area
// ============================================

import { unstable_setRequestLocale } from 'next-intl/server';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="p-6 md:p-8 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
