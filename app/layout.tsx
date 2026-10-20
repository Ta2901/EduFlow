import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AuthHydrator from '@/components/auth/AuthHydrator'
import LanguageScript from '@/components/i18n/LanguageScript'
import { LanguageProvider } from '@/components/i18n/LanguageProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import ThemeScript from '@/components/theme/ThemeScript'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduFlow 2.0',
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
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <LanguageScript />
      </head>
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        <LanguageProvider>
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
