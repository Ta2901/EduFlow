'use client'

import { useI18n } from '@/components/i18n/LanguageProvider'
import { isLocale, LOCALE_OPTIONS } from '@/lib/i18n/catalog'

interface LanguageSwitcherProps {
  id?: string
  className?: string
  /** Light text for dark headers such as the admin bar. */
  tone?: 'default' | 'onDark'
}

export default function LanguageSwitcher({
  id = 'language-switcher',
  className = '',
  tone = 'default',
}: LanguageSwitcherProps) {
  const { locale, localeMode, setLocale, useDeviceLocale, t } = useI18n()
  const onDark = tone === 'onDark'
  const value = localeMode === 'device' ? 'device' : locale

  return (
    <label className={`inline-flex items-center ${className}`}>
      <span className="sr-only">{t('language.label')}</span>
      <select
        id={id}
        aria-label={t('language.label')}
        value={value}
        onChange={(event) => {
          const next = event.target.value
          if (next === 'device') useDeviceLocale()
          else if (isLocale(next)) setLocale(next)
        }}
        className={`max-w-[11rem] rounded-lg border px-2 py-1.5 text-xs font-semibold ${
          onDark
            ? 'border-slate-600 bg-slate-900 text-slate-100'
            : 'border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
        }`}
      >
        <option value="device">{t('language.device')}</option>
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.nativeName}
          </option>
        ))}
      </select>
    </label>
  )
}

export function VersionBadge({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <span
      className={`rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-700 ${className}`}
    >
      v{t('version')}
    </span>
  )
}
