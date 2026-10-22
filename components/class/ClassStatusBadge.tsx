'use client'

import { useI18n } from '@/components/i18n/LanguageProvider'
import type { ClassStatus } from '@/lib/types'

const STYLE: Record<ClassStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-violet-100 text-violet-800',
  cancelled: 'bg-amber-100 text-amber-800',
}

const LABEL: Record<ClassStatus, 'common.draft' | 'common.published' | 'common.archived' | 'common.cancelled'> = {
  draft: 'common.draft',
  published: 'common.published',
  archived: 'common.archived',
  cancelled: 'common.cancelled',
}

export default function ClassStatusBadge({
  status,
  className = '',
}: {
  status: ClassStatus
  className?: string
}) {
  const { t } = useI18n()
  if (status === 'published') return null
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[status]} ${className}`}
    >
      {t(LABEL[status])}
    </span>
  )
}
