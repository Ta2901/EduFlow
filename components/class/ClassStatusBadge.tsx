import type { ClassStatus } from '@/lib/types'

const STYLE: Record<ClassStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-violet-100 text-violet-800',
  cancelled: 'bg-amber-100 text-amber-800',
}

const LABEL: Record<ClassStatus, string> = {
  draft: 'Nháp',
  published: 'Đã phát hành',
  archived: 'Đã lưu trữ',
  cancelled: 'Đã huỷ',
}

export default function ClassStatusBadge({
  status,
  className = '',
}: {
  status: ClassStatus
  className?: string
}) {
  if (status === 'published') return null
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[status]} ${className}`}
    >
      {LABEL[status]}
    </span>
  )
}
