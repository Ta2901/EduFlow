'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  History,
  KeyRound,
  Moon,
  Palette,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import { useTheme, type ThemeMode } from '@/components/theme/ThemeProvider'
import { api } from '@/lib/api/client'
import type { ActivityLogItem, ActivityLogType } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

type SettingsView = 'list' | 'theme' | 'password' | 'history'

const TYPE_LABELS: Record<ActivityLogType, string> = {
  theme_change: 'Giao diện',
  password_change: 'Mật khẩu',
  class_join: 'Tham gia lớp',
  class_create: 'Tạo lớp',
  class_update: 'Thay đổi lớp',
  class_cancel: 'Huỷ lớp',
  assignment_submit: 'Nộp bài',
  other: 'Khác',
}

function typeLabel(type: string) {
  return TYPE_LABELS[type as ActivityLogType] || 'Hoạt động'
}

interface SettingsPanelProps {
  showPassword?: boolean
  id?: string
}

export default function SettingsPanel({ showPassword = true, id = 'settings' }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()
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
    toast.success(next === 'dark' ? 'Đã bật chế độ tối' : 'Đã bật chế độ sáng')
    void api.activity
      .log({
        type: 'theme_change',
        title: 'Đổi chế độ giao diện',
        message:
          next === 'dark'
            ? 'Đã chuyển sang chế độ tối'
            : 'Đã chuyển sang chế độ sáng',
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
      id: 'theme',
      icon: Palette,
      title: 'Chế độ giao diện',
      description: 'Chọn chế độ sáng hoặc tối',
      value: theme === 'dark' ? 'Tối' : 'Sáng',
    },
    ...(showPassword
      ? [
          {
            id: 'password' as const,
            icon: KeyRound,
            title: 'Đổi mật khẩu',
            description: 'Cập nhật mật khẩu đăng nhập',
          },
        ]
      : []),
    {
      id: 'history',
      icon: History,
      title: 'Lịch sử hoạt động',
      description: 'Xem lại thay đổi cài đặt và thao tác đã làm',
    },
  ]

  if (view !== 'list') {
    const titles: Record<Exclude<SettingsView, 'list'>, string> = {
      theme: 'Chế độ giao diện',
      password: 'Đổi mật khẩu',
      history: 'Lịch sử hoạt động',
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
          Quay lại danh sách cài đặt
        </button>

        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">{titles[view]}</h2>
        </div>

        {view === 'theme' && (
          <section id={`${id}-theme`} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm text-gray-500">
              Chọn chế độ hiển thị. Thay đổi sẽ được lưu vào lịch sử hoạt động.
            </p>
            <div className="flex flex-wrap gap-3">
              <ThemeChoice
                id={`${id}-theme-light`}
                active={theme === 'light'}
                icon={Sun}
                label="Sáng"
                onClick={() => void applyTheme('light')}
              />
              <ThemeChoice
                id={`${id}-theme-dark`}
                active={theme === 'dark'}
                icon={Moon}
                label="Tối"
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
                Đổi giao diện, mật khẩu, tham gia/tạo/sửa/huỷ lớp, nộp bài tập.
              </p>
              <button
                id={`${id}-history-refresh`}
                type="button"
                onClick={() => void loadHistory()}
                className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Làm mới
              </button>
            </div>

            {loadingHistory ? (
              <p className="text-sm text-gray-400">Đang tải lịch sử...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có hoạt động nào được ghi lại.</p>
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
                            Xem chi tiết
                          </Link>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {typeLabel(item.type)}
                        </span>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(item.createdAt)}
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
          <h2 className="text-lg font-semibold text-gray-900">Cài đặt</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Chọn một mục bên dưới để thay đổi hoặc xem lại.
        </p>
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
