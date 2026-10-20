'use client'

import { Moon, Sun } from 'lucide-react'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useTheme } from '@/components/theme/ThemeProvider'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/authStore'

interface ThemeToggleProps {
  id?: string
  className?: string
}

export default function ThemeToggle({ id = 'theme-toggle', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const currentUser = useAuthStore((s) => s.currentUser)
  const isDark = theme === 'dark'

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    if (!currentUser) return
    void api.activity
      .log({
        type: 'theme_change',
        title: t('theme.activityTitle'),
        message: next === 'dark' ? t('theme.activityDark') : t('theme.activityLight'),
        meta: { theme: next, source: 'header' },
      })
      .catch(() => {
        /* ignore when unauthenticated/offline */
      })
  }

  return (
    <button
      id={id}
      type="button"
      onClick={handleToggle}
      className={`rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary-400 ${className}`}
      aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
