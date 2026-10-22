'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api/client'
import {
  deviceLanguages,
  isLocale,
  localeOption,
  matchDeviceLocale,
  type Locale,
  type LocaleMode,
} from '@/lib/i18n/catalog'
import { LOCALE_MODE_KEY, LOCALE_STORAGE_KEY } from '@/lib/i18n/messages'
import { translate } from '@/lib/i18n/translate'
import { useAuthStore } from '@/lib/stores/authStore'

interface LanguageContextValue {
  locale: Locale
  localeMode: LocaleMode
  setLocale: (locale: Locale) => void
  useDeviceLocale: () => void
  t: (path: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function applyLocale(locale: Locale) {
  const root = document.documentElement
  root.lang = localeOption(locale).htmlLang
  root.dataset.locale = locale
  root.classList.remove('locale-pending')
}

function writeLocaleCookie(locale: Locale, mode: LocaleMode) {
  const maxAge = 'max-age=31536000'
  document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(locale)};path=/;${maxAge};SameSite=Lax`
  document.cookie = `${LOCALE_MODE_KEY}=${mode};path=/;${maxAge};SameSite=Lax`
}

function readInitial(): { locale: Locale; mode: LocaleMode } {
  const modeRaw = localStorage.getItem(LOCALE_MODE_KEY)
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (modeRaw === 'device') {
    return { locale: matchDeviceLocale(deviceLanguages()), mode: 'device' }
  }
  if (isLocale(stored)) {
    return { locale: stored, mode: 'manual' }
  }
  return { locale: matchDeviceLocale(deviceLanguages()), mode: 'device' }
}

export function LanguageProvider({
  children,
  initialLocale = 'vi',
  initialMode = 'device',
}: {
  children: React.ReactNode
  initialLocale?: Locale
  initialMode?: LocaleMode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [localeMode, setLocaleMode] = useState<LocaleMode>(initialMode)
  const localeRef = useRef<Locale>(initialLocale)
  const modeRef = useRef<LocaleMode>(initialMode)

  const announce = useCallback((next: Locale) => {
    const user = useAuthStore.getState().currentUser
    if (!user) return
    const name = localeOption(next).nativeName
    void api.activity
      .log({
        type: 'language_change',
        title: translate(next, 'language.label'),
        message: `${translate(next, 'language.saved')}: ${name}`,
        meta: { locale: next, source: 'language' },
      })
      .catch(() => {
        /* history write is best-effort */
      })
  }, [])

  useLayoutEffect(() => {
    const next = readInitial()
    localeRef.current = next.locale
    modeRef.current = next.mode
    setLocaleState(next.locale)
    setLocaleMode(next.mode)
    applyLocale(next.locale)
    writeLocaleCookie(next.locale, next.mode)
  }, [])

  useEffect(() => {
    const onChange = () => {
      if (modeRef.current !== 'device') return
      const next = matchDeviceLocale(deviceLanguages())
      if (localeRef.current === next) return
      localeRef.current = next
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
      writeLocaleCookie(next, 'device')
      applyLocale(next)
      setLocaleState(next)
    }
    window.addEventListener('languagechange', onChange)
    return () => window.removeEventListener('languagechange', onChange)
  }, [])

  const setLocale = useCallback(
    (next: Locale) => {
      if (modeRef.current === 'manual' && localeRef.current === next) return
      localeRef.current = next
      modeRef.current = 'manual'
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
      localStorage.setItem(LOCALE_MODE_KEY, 'manual')
      writeLocaleCookie(next, 'manual')
      applyLocale(next)
      setLocaleState(next)
      setLocaleMode('manual')
      announce(next)
    },
    [announce]
  )

  const useDeviceLocale = useCallback(() => {
    const next = matchDeviceLocale(deviceLanguages())
    const already = modeRef.current === 'device' && localeRef.current === next
    modeRef.current = 'device'
    localeRef.current = next
    localStorage.setItem(LOCALE_MODE_KEY, 'device')
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
    writeLocaleCookie(next, 'device')
    applyLocale(next)
    setLocaleState(next)
    setLocaleMode('device')
    if (!already) announce(next)
  }, [announce])

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => translate(locale, path, vars),
    [locale]
  )

  const value = useMemo(
    () => ({ locale, localeMode, setLocale, useDeviceLocale, t }),
    [locale, localeMode, setLocale, useDeviceLocale, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}
