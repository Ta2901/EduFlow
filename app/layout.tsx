import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import { isLocale, localeOption, type Locale, type LocaleMode } from '@/lib/i18n/catalog'
import { LOCALE_MODE_KEY, LOCALE_STORAGE_KEY } from '@/lib/i18n/messages'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AuthHydrator from '@/components/auth/AuthHydrator'
import LanguageScript from '@/components/i18n/LanguageScript'
import { LanguageProvider } from '@/components/i18n/LanguageProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import ThemeScript from '@/components/theme/ThemeScript'

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
})

function readRequestLocale(): { locale: Locale; mode: LocaleMode } {
  const jar = cookies()
  const modeRaw = jar.get(LOCALE_MODE_KEY)?.value
  const stored = jar.get(LOCALE_STORAGE_KEY)?.value
  if (isLocale(stored) && (modeRaw === 'manual' || modeRaw === 'device')) {
    return { locale: stored, mode: modeRaw }
  }
  if (isLocale(stored)) return { locale: stored, mode: 'manual' }
  return { locale: 'vi', mode: 'device' }
}

export const metadata: Metadata = {
  title: 'EduFlow',
  description: 'Nền tảng học tập và giảng dạy hiện đại, hỗ trợ giáo viên và học sinh trong quá trình giáo dục',
  keywords: 'education, learning, teaching, online learning, vietnam',
  authors: [{ name: 'EduFlow Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale, mode } = readRequestLocale()
  return (
    <html lang={localeOption(locale).htmlLang} data-ssr-locale={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <LanguageScript ssrLocale={locale} />
      </head>
      <body className={`${inter.variable} font-sans bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        <LanguageProvider initialLocale={locale} initialMode={mode}>
        <ThemeProvider>
          <AuthHydrator />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-gray-100',
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
