// ============================================
// RozgarSync i18n Configuration
// ============================================

export const locales = ['ur', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ur';

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export const localeNames: Record<Locale, string> = {
  ur: 'اردو',
  en: 'English',
};

export const localeDirections: Record<Locale, 'rtl' | 'ltr'> = {
  ur: 'rtl',
  en: 'ltr',
};
