// ============================================
// Locale Layout — Main HTML structure with i18n
// ============================================

import type { Metadata } from 'next';
import { Inter, Outfit, Noto_Nastaliq_Urdu } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales, localeDirections, type Locale } from '@/i18n/i18n';
import { Providers } from '@/lib/providers/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '../globals.css';

// --- Google Fonts ---
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['600', '700', '800'],
  display: 'swap',
});

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  variable: '--font-noto-nastaliq',
  weight: ['400', '700'],
  display: 'swap',
});

// --- Static Params for all locales ---
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// --- Locale-aware Metadata ---
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isUrdu = locale === 'ur';
  return {
    title: isUrdu ? 'روزگار سنک — اپنے ہنر سے کمائیں' : 'RozgarSync — Earn with Your Skills',
    description: isUrdu
      ? 'پاکستان کے ہنرمند کاریگروں کے لیے AI سروس پلیٹ فارم'
      : "AI Service Orchestrator for Pakistan's informal gig workers",
    openGraph: {
      title: isUrdu ? 'روزگار سنک' : 'RozgarSync',
      description: isUrdu
        ? 'اپنے ہنر سے کمائیں — پاکستان کا پہلا AI سروس پلیٹ فارم'
        : "Pakistan's first AI-powered service marketplace",
      locale: locale,
      type: 'website',
    },
  };
}

// --- Layout Component ---
export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Determine text direction
  const direction = localeDirections[locale as Locale] ?? 'rtl';

  // Get all messages for the client provider
  const messages = await getMessages();

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0F5E38" />
        <link rel="icon" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} ${notoNastaliq.variable} font-sans bg-dark-950 text-dark-50 antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers locale={locale}>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
