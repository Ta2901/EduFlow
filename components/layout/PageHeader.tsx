'use client'

import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/components/i18n/LanguageProvider'
import NotificationBell from '@/components/notifications/NotificationBell'
import RoleUserBadge, { RoleUserBadgeCompact } from '@/components/layout/RoleUserBadge'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useAuthStore } from '@/lib/stores/authStore'
import { roleDashboardPath } from '@/lib/format'

interface PageHeaderProps {
  id?: string
  title: string
  subtitle?: string
  backHref: string
  action?: React.ReactNode
  userId?: string
}

export default function PageHeader({
  id = 'page-header',
  title,
  subtitle,
  backHref,
  action,
  userId,
}: PageHeaderProps) {
  const { t } = useI18n()
  const currentUser = useAuthStore((s) => s.currentUser)
  const roleShort =
    currentUser?.role === 'teacher' ? 'GV' : currentUser?.role === 'student' ? 'HS' : null
  const chatHref =
    currentUser && (currentUser.role === 'student' || currentUser.role === 'teacher')
      ? `${roleDashboardPath(currentUser.role)}?tab=chat`
      : null

  return (
    <header id={id} className="sticky top-0 z-20 border-b bg-white shadow-sm">
      <div id={`${id}-inner`} className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4 sm:py-4">
        <div id={`${id}-row`} className="flex items-center gap-2 sm:gap-3">
          <Link
            id={`${id}-back`}
            href={backHref}
            className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div id={`${id}-titles`} className="min-w-0 flex-1">
            <h1 id={`${id}-title`} className="truncate text-base font-semibold text-gray-900 sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p id={`${id}-subtitle`} className="truncate text-xs text-gray-500 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
          {userId && roleShort && currentUser && (
            <>
              <RoleUserBadgeCompact
                id={`${id}-badge-compact`}
                roleShort={roleShort}
                userName={currentUser.fullName}
              />
              <RoleUserBadge
                id={`${id}-badge`}
                roleShort={roleShort}
                userName={currentUser.fullName}
              />
            </>
          )}
          {userId && chatHref && (
            <Link
              id={`${id}-chat`}
              href={chatHref}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-primary-600"
              aria-label={t('nav.classChat')}
              title={t('nav.classChat')}
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          )}
          {userId && <NotificationBell userId={userId} id={`${id}-notifications`} />}
          {action && (
            <div id={`${id}-action-desktop`} className="hidden shrink-0 sm:block">
              {action}
            </div>
          )}
          <LanguageSwitcher id={`${id}-language`} />
          <ThemeToggle id={`${id}-theme`} />
        </div>
        {action && (
          <div
            id={`${id}-action-mobile`}
            className="mt-2 sm:hidden [&_a]:flex [&_a]:w-full [&_a]:justify-center [&_button]:w-full"
          >
            {action}
          </div>
        )}
      </div>
    </header>
  )
}
