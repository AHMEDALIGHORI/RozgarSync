// ============================================
// next-intl Server Request Configuration
// Referenced by next.config.mjs
// ============================================

import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './i18n';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale = locales.includes(locale as Locale) ? locale : 'ur';

  return {
    messages: (await import(`../messages/${validLocale}.json`)).default,
  };
});
