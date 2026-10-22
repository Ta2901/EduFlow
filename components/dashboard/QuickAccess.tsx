'use client'

import Link from 'next/link'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { Hash, MessageCircle, CheckCircle, type LucideIcon } from 'lucide-react'

interface QuickAccessProps {
  onOpenChat?: () => void
  onOpenSubmissions?: () => void
}

export default function QuickAccess({ onOpenChat, onOpenSubmissions }: QuickAccessProps) {
  const { t } = useI18n()
  return (
    <div id="student-quick-access" className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-semibold text-gray-900">{t('student.quickTitle')}</h2>
      <p className="meta-secondary mt-1 text-sm text-gray-500">{t('student.quickHint')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <QuickLink
          id="student-quick-access-join"
          href="/student/join"
          icon={Hash}
          title={t('student.joinByCode')}
          description={t('student.joinByCodeDesc')}
        />
        <QuickButton
          id="student-quick-access-chat"
          icon={MessageCircle}
          title={t('nav.classChat')}
          description={t('student.chatDesc')}
          onClick={onOpenChat}
        />
        <QuickButton
          id="student-quick-access-submissions"
          icon={CheckCircle}
          title={t('nav.submissions')}
          description={t('student.submitDesc')}
          onClick={onOpenSubmissions}
        />
      </div>
    </div>
  )
}

function QuickLink({
  id,
  href,
  icon: Icon,
  title,
  description,
}: {
  id: string
  href: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link
      id={id}
      href={href}
      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:border-primary-200 hover:bg-primary-50/50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900">{title}</span>
        <span className="meta-secondary mt-0.5 block text-xs text-gray-500">{description}</span>
      </span>
    </Link>
  )
}

function QuickButton({
  id,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  id: string
  icon: LucideIcon
  title: string
  description: string
  onClick?: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900">{title}</span>
        <span className="meta-secondary mt-0.5 block text-xs text-gray-500">{description}</span>
      </span>
    </button>
  )
}
