'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'eduflow-theme'

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  root.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const preferred =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
    setThemeState(preferred)
    applyTheme(preferred)
  }, [])

  const setTheme = (next: ThemeMode) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
