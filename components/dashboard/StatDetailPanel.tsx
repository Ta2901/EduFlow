'use client'

import { X } from 'lucide-react'
import { useI18n } from '@/components/i18n/LanguageProvider'

interface StatDetailPanelProps {
  title: string
  count: number
  onClose: () => void
  children: React.ReactNode
  emptyMessage?: string
  id?: string
}

export default function StatDetailPanel({
  title,
  count,
  onClose,
  children,
  emptyMessage,
  id = 'stat-detail',
}: StatDetailPanelProps) {
  const { t } = useI18n()
  return (
    <div id={id} className="rounded-xl border border-primary-200 bg-white shadow-sm ring-1 ring-primary-100">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{t('common.itemCount', { count })}</p>
        </div>
        <button
          id={`${id}-close`}
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label={t('common.closeList')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[min(60vh,420px)] overflow-y-auto p-4 sm:p-5">
        {count === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">{emptyMessage ?? t('common.noData')}</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
