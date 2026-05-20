// ============================================
// Root Layout — Minimal shell (no <html> here)
// ============================================

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | RozgarSync',
    default: 'RozgarSync — روزگار سنک',
  },
  description:
    "AI Service Orchestrator for Pakistan's informal gig workers",
  keywords: [
    'RozgarSync',
    'Pakistan',
    'gig workers',
    'services',
    'AI',
    'روزگار',
    'کاریگر',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RozgarSync',
  },
};

export const viewport = {
  themeColor: '#0F5E38',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The locale layout renders <html> and <body>.
  // This root layout is a minimal pass-through required by Next.js App Router.
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
