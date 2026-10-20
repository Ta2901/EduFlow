'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import LanguageSwitcher, { VersionBadge } from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/components/i18n/LanguageProvider'
import LoginForm from './LoginForm'
import ThemeToggle from '@/components/theme/ThemeToggle'

export default function LoginPage() {
  const { t } = useI18n()
  return (
    <div
      id="auth-login"
      className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-8 sm:px-6"
    >
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <div className="flex items-center gap-2">
          <LanguageSwitcher id="auth-login-language" />
          <ThemeToggle id="auth-login-theme-toggle" />
        </div>
      </div>
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <motion.div id="auth-login-header" initial={false} className="text-center">
          <Link id="auth-login-logo" href="/" className="flex justify-center">
            <div className="flex items-center">
              <BookOpen className="h-12 w-12 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">EduFlow</span>
              <VersionBadge className="ml-2" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{t('auth.loginTitle')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('auth.loginSubtitle')}</p>
        </motion.div>

        <LoginForm />
      </div>
    </div>
  )
}
