// ============================================
// Next.js Middleware — Locale Detection & Routing
// ============================================

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except API routes, static files, and assets
  matcher: ['/', '/(ur|en)/:path*'],
};
