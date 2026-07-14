'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { WEEKDAY_LABELS } from '@/lib/format'
import {
  findNextClassOccurrence,
  type NextClassOccurrence,
} from '@/lib/scheduleNext'
import { useScheduleOverviewStore } from '@/lib/stores/scheduleOverviewStore'
import type { ClassRoom } from '@/lib/types'

interface EnterClassButtonProps {
  classes: ClassRoom[]
  id?: string
}

export default function EnterClassButton({
  classes,
  id = 'student-enter-class',
}: EnterClassButtonProps) {
  const router = useRouter()
  const load = useScheduleOverviewStore((s) => s.load)
  const slots = useScheduleOverviewStore((s) => s.slots)
  const liveByClass = useScheduleOverviewStore((s) => s.liveByClass)
  const isLoading = useScheduleOverviewStore((s) => s.isLoading)
  const isLoaded = useScheduleOverviewStore((s) => s.isLoaded)

  const activeClasses = useMemo(
    () => classes.filter((c) => c.status !== 'cancelled'),
    [classes]
  )
  const classIds = useMemo(() => activeClasses.map((c) => c.id), [activeClasses])
  const classIdsKey = classIds.join(',')

  useEffect(() => {
    void load(classIds)
    const timer = setInterval(() => {
      void load(classIds, { force: true })
    }, 120_000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIdsKey, load])

  const next = useMemo(() => findNextClassOccurrence(slots), [slots])

  const href = next
    ? liveByClass[next.classId]
      ? `/online/${liveByClass[next.classId]}`
      : `/student/courses/${next.classId}`
    : null

  const label = nextLabel(next, Boolean(next && liveByClass[next.classId]))

  const handleClick = (e: React.MouseEvent) => {
    if (href) return
    e.preventDefault()
    if (activeClasses.length === 0) {
      toast.error('Bạn chưa tham gia lớp nào')
      return
    }
    if (!next) {
      toast.error('Chưa có tiết học sắp tới trên thời khóa biểu')
      router.push('/student/dashboard?tab=courses')
    }
  }

  const className =
    'inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto disabled:opacity-60'

  if ((isLoading || !isLoaded) && !next) {
    return (
      <button id={id} type="button" disabled className={className}>
        <Video className="mr-1.5 h-4 w-4" />
        Đang tìm lớp…
      </button>
    )
  }

  if (!href) {
    return (
      <button id={id} type="button" onClick={handleClick} className={className} title={label}>
        <Video className="mr-1.5 h-4 w-4" />
        <span className="hidden sm:inline">Vào lớp học</span>
        <span className="sm:hidden">Vào học</span>
      </button>
    )
  }

  return (
    <Link id={id} href={href} className={className} title={label} onClick={handleClick}>
      <Video className="mr-1.5 h-4 w-4" />
      <span className="hidden max-w-[220px] truncate sm:inline">
        {next?.isOngoing ? 'Vào lớp đang học' : 'Vào lớp học'}
      </span>
      <span className="sm:hidden">Vào học</span>
    </Link>
  )
}

function nextLabel(next: NextClassOccurrence | null, hasLive: boolean): string {
  if (!next) return 'Chưa có tiết sắp tới'
  const day = WEEKDAY_LABELS[next.dayOfWeek] || ''
  const room = next.room ? ` · ${next.room}` : ''
  const live = hasLive ? ' · Đang live' : ''
  if (next.isOngoing) {
    return `${next.subject} · đang diễn ra${room}${live}`
  }
  return `${next.subject} · ${day} ${next.startTime}${room}${live}`
}
