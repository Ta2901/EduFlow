'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { CalendarClock, ClipboardList } from 'lucide-react'
import type { ClassRoom, Task } from '@/lib/types'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { formatDate } from '@/lib/format'
import { useScheduleOverviewStore } from '@/lib/stores/scheduleOverviewStore'

interface DashboardScheduleTableProps {
  classes: ClassRoom[]
  tasks: Task[]
  assignmentHref: (taskId: string) => string
  classHref: (classId: string) => string
  id?: string
}

export default function DashboardScheduleTable({
  classes,
  tasks,
  assignmentHref,
  classHref,
  id = 'dashboard-schedule',
}: DashboardScheduleTableProps) {
  const { t, locale } = useI18n()
  const load = useScheduleOverviewStore((s) => s.load)
  const slots = useScheduleOverviewStore((s) => s.slots)
  const loading = useScheduleOverviewStore((s) => s.isLoading && !s.isLoaded)

  const classIds = useMemo(
    () => classes.filter((c) => c.status !== 'cancelled').map((c) => c.id),
    [classes]
  )
  const classIdsKey = classIds.join(',')

  useEffect(() => {
    void load(classIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIdsKey, load])

  const periods = useMemo(() => {
    const set = new Set(slots.map((s) => s.period))
    if (set.size === 0) return [1, 2, 3, 4, 5]
    return Array.from(set).sort((a, b) => a - b)
  }, [slots])

  const days = [1, 2, 3, 4, 5, 6, 7]

  const cellMap = useMemo(() => {
    const map = new Map<string, typeof slots>()
    for (const s of slots) {
      const key = `${s.dayOfWeek}-${s.period}`
      const list = map.get(key) || []
      list.push(s)
      map.set(key, list)
    }
    return map
  }, [slots])

  const upcomingDeadlines = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return [...tasks]
      .map((t) => {
        const classroom = classes.find((c) => c.id === t.classId)
        const due = new Date(t.dueDate)
        due.setHours(0, 0, 0, 0)
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
          task: t,
          classTitle: classroom?.title ?? '—',
          daysLeft: diff,
        }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 12)
  }, [tasks, classes])

  return (
    <div id={id} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('schedule.title')}</h2>
        <p className="text-sm text-gray-500">{t('schedule.subtitle')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div id={`${id}-timetable`} className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <CalendarClock className="h-4 w-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-900">{t('schedule.timetable')}</h3>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-gray-500">{t('schedule.loading')}</p>
          ) : slots.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">{t('schedule.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="sticky left-0 z-10 border-b bg-gray-50 px-3 py-2 font-medium">{t('common.period')}</th>
                    {days.map((d) => (
                      <th key={d} className="border-b px-3 py-2 font-medium whitespace-nowrap">
                        {t(`weekday.${d}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period} className="align-top">
                      <td className="sticky left-0 z-10 border-b bg-white px-3 py-2 font-medium text-gray-700">
                        {t('common.periodN', { n: period })}
                      </td>
                      {days.map((day) => {
                        const cell = cellMap.get(`${day}-${period}`) || []
                        return (
                          <td key={`${day}-${period}`} className="border-b px-2 py-2 min-w-[120px]">
                            {cell.length === 0 ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="space-y-1.5">
                                {cell.map((s) => (
                                  <Link
                                    key={s.id}
                                    id={`${id}-slot-${s.id}`}
                                    href={classHref(s.classId)}
                                    className="block rounded-md border border-primary-100 bg-primary-50/70 px-2 py-1.5 hover:bg-primary-50"
                                  >
                                    <p className="font-medium text-primary-800">{s.subject}</p>
                                    <p className="text-[10px] text-gray-600 sm:text-xs">
                                      {s.startTime}–{s.endTime}
                                      {s.room ? ` · ${s.room}` : ''}
                                    </p>
                                    <p className="truncate text-[10px] text-gray-500">{s.classTitle}</p>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id={`${id}-deadlines`} className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ClipboardList className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-900">{t('schedule.deadlines')}</h3>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">{t('schedule.noDeadlines')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-600">
                    <th className="px-4 py-2 font-medium">{t('schedule.task')}</th>
                    <th className="px-4 py-2 font-medium">{t('schedule.classOrSubject')}</th>
                    <th className="px-4 py-2 font-medium">{t('schedule.due')}</th>
                    <th className="px-4 py-2 font-medium">{t('schedule.remaining')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {upcomingDeadlines.map(({ task, classTitle, daysLeft }) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <Link
                          id={`${id}-deadline-${task.id}`}
                          href={assignmentHref(task.id)}
                          className="font-medium text-gray-900 hover:text-primary-600"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{classTitle}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">
                        {formatDate(task.dueDate, locale)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            daysLeft < 0
                              ? 'bg-red-100 text-red-700'
                              : daysLeft <= 2
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {daysLeft < 0
                            ? t('common.overdue', { count: Math.abs(daysLeft) })
                            : daysLeft === 0
                              ? t('common.today')
                              : t('common.daysLeft', { count: daysLeft })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
