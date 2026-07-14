'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/authStore'

interface ThemeToggleProps {
  id?: string
  className?: string
}

export default function ThemeToggle({ id = 'theme-toggle', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const isDark = theme === 'dark'

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    if (!currentUser) return
    void api.activity
      .log({
        type: 'theme_change',
        title: 'Đổi chế độ giao diện',
        message: next === 'dark' ? 'Đã chuyển sang chế độ tối' : 'Đã chuyển sang chế độ sáng',
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
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
