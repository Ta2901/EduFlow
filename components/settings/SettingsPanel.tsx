'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  History,
  KeyRound,
  Languages,
  Moon,
  Palette,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import { useI18n } from '@/components/i18n/LanguageProvider'
import {
  deviceLanguages,
  LOCALE_OPTIONS,
  localeOption,
  matchDeviceLocale,
  type Locale,
  type LocaleMode,
} from '@/lib/i18n/catalog'
import { useTheme, type ThemeMode } from '@/components/theme/ThemeProvider'
import { api } from '@/lib/api/client'
import type { ActivityLogItem, ActivityLogType } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

type SettingsView = 'list' | 'language' | 'theme' | 'password' | 'history'

const ACTIVITY_TYPES = new Set<ActivityLogType>([
  'theme_change',
  'language_change',
  'password_change',
  'class_join',
  'class_create',
  'class_update',
  'class_cancel',
  'assignment_submit',
  'other',
])

function activityTypeLabel(type: string, t: (path: string) => string) {
  return ACTIVITY_TYPES.has(type as ActivityLogType)
    ? t(`status.activity.${type}`)
    : t('status.activity.fallback')
}

interface SettingsPanelProps {
  showPassword?: boolean
  id?: string
}

export default function SettingsPanel({ showPassword = true, id = 'settings' }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()
  const { locale, localeMode, setLocale, useDeviceLocale, t } = useI18n()
  const [view, setView] = useState<SettingsView>('list')
  const [items, setItems] = useState<ActivityLogItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const data = await api.activity.list()
      setItems(data.items)
    } catch {
      setItems([])
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'history') void loadHistory()
  }, [view, loadHistory])

  const applyTheme = (next: ThemeMode) => {
    if (next === theme) return
    setTheme(next)
    toast.success(next === 'dark' ? t('theme.switchedDark') : t('theme.switchedLight'))
    void api.activity
      .log({
        type: 'theme_change',
        title: t('theme.activityTitle'),
        message: next === 'dark' ? t('theme.activityDark') : t('theme.activityLight'),
        meta: { theme: next, source: 'settings' },
      })
      .catch(() => {
        /* history write is best-effort */
      })
  }

  const menuItems: {
    id: SettingsView
    icon: LucideIcon
    title: string
    description: string
    value?: string
  }[] = [
    {
      id: 'language',
      icon: Languages,
      title: t('language.label'),
      description: t('language.description'),
      value: localeMode === 'device' ? t('language.device') : localeOption(locale).nativeName,
    },
    {
      id: 'theme',
      icon: Palette,
      title: t('theme.title'),
      description: t('theme.description'),
      value: theme === 'dark' ? t('theme.dark') : t('theme.light'),
    },
    ...(showPassword
      ? [
          {
            id: 'password' as const,
            icon: KeyRound,
            title: t('settings.password'),
            description: t('settings.passwordDesc'),
          },
        ]
      : []),
    {
      id: 'history',
      icon: History,
      title: t('settings.history'),
      description: t('settings.historyDesc'),
    },
  ]

  if (view !== 'list') {
    const titles: Record<Exclude<SettingsView, 'list'>, string> = {
      language: t('language.label'),
      theme: t('theme.title'),
      password: t('settings.password'),
      history: t('settings.history'),
    }

    return (
      <div id={id} className="mx-auto max-w-3xl space-y-4">
        <button
          id={`${id}-back`}
          type="button"
          onClick={() => setView('list')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.backToSettings')}
        </button>

        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">{titles[view]}</h2>
        </div>

        {view === 'language' && (
          <LanguageList
            id={`${id}-language`}
            locale={locale}
            localeMode={localeMode}
            onPick={setLocale}
            onDevice={useDeviceLocale}
            t={t}
          />
        )}

        {view === 'theme' && (
          <section id={`${id}-theme`} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm text-gray-500">{t('theme.hint')}</p>
            <div className="flex flex-wrap gap-3">
              <ThemeChoice
                id={`${id}-theme-light`}
                active={theme === 'light'}
                icon={Sun}
                label={t('theme.light')}
                onClick={() => void applyTheme('light')}
              />
              <ThemeChoice
                id={`${id}-theme-dark`}
                active={theme === 'dark'}
                icon={Moon}
                label={t('theme.dark')}
                onClick={() => void applyTheme('dark')}
              />
            </div>
          </section>
        )}

        {view === 'password' && <ChangePasswordForm hideHeader idPrefix={`${id}-password`} />}

        {view === 'history' && (
          <section id={`${id}-history`} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {t('settings.historyHint')}
              </p>
              <button
                id={`${id}-history-refresh`}
                type="button"
                onClick={() => void loadHistory()}
                className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {t('common.refresh')}
              </button>
            </div>

            {loadingHistory ? (
              <p className="text-sm text-gray-400">{t('settings.loadingHistory')}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400">{t('settings.emptyHistory')}</p>
            ) : (
              <ul id={`${id}-history-list`} className="divide-y">
                {items.map((item) => (
                  <li key={item.id} id={`${id}-history-item-${item.id}`} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="mt-0.5 text-sm text-gray-600">{item.message}</p>
                        {item.href ? (
                          <Link
                            id={`${id}-history-item-${item.id}-link`}
                            href={item.href}
                            className="mt-1 inline-block text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            {t('common.viewDetails')}
                          </Link>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {activityTypeLabel(item.type, t)}
                        </span>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(item.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    )
  }

  return (
    <div id={id} className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.title')}</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">{t('settings.intro')}</p>
      </div>

      <ul id={`${id}-menu`} className="overflow-hidden rounded-xl border bg-white shadow-sm divide-y">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              id={`${id}-menu-${item.id}`}
              type="button"
              onClick={() => setView(item.id)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900">{item.title}</span>
                <span className="mt-0.5 block text-sm text-gray-500">{item.description}</span>
              </span>
              {item.value ? (
                <span className="shrink-0 text-xs font-medium text-gray-500">{item.value}</span>
              ) : null}
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LanguageList({
  id,
  locale,
  localeMode,
  onPick,
  onDevice,
  t,
}: {
  id: string
  locale: Locale
  localeMode: LocaleMode
  onPick: (locale: Locale) => void
  onDevice: () => void
  t: (path: string, vars?: Record<string, string | number>) => string
}) {
  const deviceName = localeOption(matchDeviceLocale(deviceLanguages())).nativeName
  return (
    <section id={id} className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="mb-4 text-sm text-gray-500">{t('language.hint')}</p>
      <div className="space-y-2">
        <button
          id={`${id}-device`}
          type="button"
          aria-pressed={localeMode === 'device'}
          onClick={onDevice}
          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm ${
            localeMode === 'device'
              ? 'border-primary-500 bg-primary-50 text-primary-800'
              : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span className="font-medium">{t('language.device')}</span>
          <span className="text-xs text-gray-500">{t('language.following', { name: deviceName })}</span>
        </button>
        {LOCALE_OPTIONS.map((option) => {
          const active = localeMode === 'manual' && locale === option.id
          return (
            <button
              key={option.id}
              id={`${id}-${option.id}`}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(option.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm ${
                active
                  ? 'border-primary-500 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{option.nativeName}</span>
              <span className="text-xs text-gray-500">{t(`languageNames.${option.id}`)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ThemeChoice({
  id,
  active,
  icon: Icon,
  label,
  onClick,
}: {
  id: string
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
