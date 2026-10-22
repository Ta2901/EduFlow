'use client'

import { useI18n } from '@/components/i18n/LanguageProvider'
import { isLocale, LOCALE_OPTIONS, localeOption } from '@/lib/i18n/catalog'

interface LanguageSwitcherProps {
  id?: string
  className?: string
  /** Light text for dark headers such as the admin bar. */
  tone?: 'default' | 'onDark'
  /** Narrow headers keep a short control; the full name stays in the tooltip. */
  compact?: boolean
}

export default function LanguageSwitcher({
  id = 'language-switcher',
  className = '',
  tone = 'default',
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, localeMode, setLocale, useDeviceLocale, t } = useI18n()
  const onDark = tone === 'onDark'
  const value = localeMode === 'device' ? 'device' : locale
  const currentLabel = localeMode === 'device' ? t('language.device') : localeOption(locale).nativeName

  return (
    <label className={`inline-flex min-w-0 items-center ${className}`}>
      <span className="sr-only">{t('language.label')}</span>
      <select
        id={id}
        aria-label={t('language.label')}
        title={currentLabel}
        value={value}
        onChange={(event) => {
          const next = event.target.value
          if (next === 'device') useDeviceLocale()
          else if (isLocale(next)) setLocale(next)
        }}
        className={`truncate rounded-lg border px-2 py-1.5 text-xs font-semibold ${
          compact ? 'max-w-[7.5rem] sm:max-w-[15rem]' : 'max-w-[min(18rem,calc(100vw-5.5rem))]'
        } ${
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
