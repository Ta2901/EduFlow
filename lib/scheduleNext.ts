import type { ScheduleSlot } from '@/lib/types'
import { toSchoolDayOfWeek } from '@/lib/format'

export type ScheduleSlotWithClass = ScheduleSlot & {
  classTitle?: string
}

export type NextClassOccurrence = {
  classId: string
  classTitle: string
  subject: string
  startTime: string
  endTime: string
  dayOfWeek: number
  room: string
  /** When this period starts (local) */
  startsAt: Date
  /** When this period ends (local) */
  endsAt: Date
  isOngoing: boolean
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (!Number.isFinite(h)) return 0
  return h * 60 + (Number.isFinite(m) ? m : 0)
}

function atLocalDate(base: Date, dayOffset: number, time: string): Date {
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  const mins = parseTimeToMinutes(time)
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  return d
}

/** Days until target weekday (1=Mon … 7=Sun), 0 if today. */
function daysUntilWeekday(fromDow: number, targetDow: number): number {
  return (targetDow - fromDow + 7) % 7
}

/**
 * Pick the next / current class period from weekly timetable slots.
 * Prefers an ongoing period today; otherwise the soonest future start.
 */
export function findNextClassOccurrence(
  slots: ScheduleSlotWithClass[],
  now = new Date()
): NextClassOccurrence | null {
  if (slots.length === 0) return null

  const todayDow = toSchoolDayOfWeek(now)
  const candidates: NextClassOccurrence[] = []

  for (const slot of slots) {
    const offset = daysUntilWeekday(todayDow, slot.dayOfWeek)
    let startsAt = atLocalDate(now, offset, slot.startTime)
    let endsAt = atLocalDate(now, offset, slot.endTime)

    // Same weekday but period already finished → next week
    if (offset === 0 && endsAt.getTime() <= now.getTime()) {
      startsAt = atLocalDate(now, 7, slot.startTime)
      endsAt = atLocalDate(now, 7, slot.endTime)
    }

    const isOngoing =
      offset === 0 &&
      startsAt.getTime() <= now.getTime() &&
      endsAt.getTime() > now.getTime()

    candidates.push({
      classId: slot.classId,
      classTitle: slot.classTitle || slot.subject,
      subject: slot.subject,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayOfWeek: slot.dayOfWeek,
      room: slot.room || '',
      startsAt,
      endsAt,
      isOngoing,
    })
  }

  candidates.sort((a, b) => {
    if (a.isOngoing !== b.isOngoing) return a.isOngoing ? -1 : 1
    return a.startsAt.getTime() - b.startsAt.getTime()
  })

  return candidates[0] ?? null
}
