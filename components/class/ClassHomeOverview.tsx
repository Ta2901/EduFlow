'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, CalendarClock, FileText, Paperclip } from 'lucide-react'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText, useLocalizedNotice } from '@/components/i18n/useContentText'
import { api } from '@/lib/api/client'
import { formatDate, formatDateTime, toSchoolDayOfWeek } from '@/lib/format'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import type { ScheduleSlot, Task } from '@/lib/types'

interface ClassHomeOverviewProps {
  classId: string
  tasks: Task[]
  userId: string
  assignmentHref: (taskId: string) => string
  id?: string
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export default function ClassHomeOverview({
  classId,
  tasks,
  userId,
  assignmentHref,
  id = 'class-home',
}: ClassHomeOverviewProps) {
  const { t, locale } = useI18n()
  const text = useContentText()
  const localizeNotice = useLocalizedNotice()
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const refreshNotifications = useNotificationStore((s) => s.refresh)
  const notifications = useNotificationStore((s) => s.getForUser(userId))
  const markAsRead = useNotificationStore((s) => s.markAsRead)

  useEffect(() => {
    void refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    let cancelled = false
    setScheduleLoading(true)
    api.edu
      .listSchedule(classId)
      .then(({ slots: data }) => {
        if (!cancelled) setSlots(data)
      })
      .catch(() => {
        if (!cancelled) setSlots([])
      })
      .finally(() => {
        if (!cancelled) setScheduleLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [classId])

  const taskIds = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks])

  const notices = useMemo(() => {
    return notifications
      .filter((notice) => {
        const href = notice.href ?? ''
        if (href.includes(`/courses/${classId}`)) return true
        return Array.from(taskIds).some((taskId) => href.includes(`/assignments/${taskId}`))
      })
      .slice(0, 4)
  }, [notifications, classId, taskIds])

  const upcomingSlots = useMemo(() => {
    const today = toSchoolDayOfWeek(new Date())
    return [...slots]
      .sort((a, b) => {
        const dayA = (a.dayOfWeek - today + 7) % 7
        const dayB = (b.dayOfWeek - today + 7) % 7
        if (dayA !== dayB) return dayA - dayB
        return a.period - b.period
      })
      .slice(0, 4)
  }, [slots])

  const deadlines = useMemo(() => {
    const today = startOfToday()
    return [...tasks]
      .filter((task) => new Date(task.dueDate).getTime() >= today.getTime())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  }, [tasks])

  const materials = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .flatMap((task) =>
        task.attachments.map((file) => ({
          id: file.id,
          name: file.name,
          url: file.url,
          taskId: task.id,
          taskTitle: task.title,
          createdAt: task.createdAt,
        }))
      )
      .slice(0, 5)
  }, [tasks])

  return (
    <div id={id} className="grid gap-4 lg:grid-cols-2">
      <section id={`${id}-notices`} className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Bell className="h-4 w-4 text-primary-600" />
          <h2 className="text-sm font-semibold text-gray-900">{t('schedule.latestNotices')}</h2>
        </div>
        {notices.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">{t('nav.noNotifications')}</p>
        ) : (
          <ul className="compact-list divide-y">
            {notices.map((notice) => {
              const shown = localizeNotice(notice)
              const body = (
                <>
                  <p className={`break-words text-sm ${notice.read ? 'text-gray-800' : 'font-medium text-gray-900'}`}>
                    {shown.title}
                  </p>
                  <p className="meta-secondary mt-1 line-clamp-2 text-xs text-gray-500">{shown.message}</p>
                  <p className="meta-secondary mt-1 text-[11px] text-gray-400">{formatDateTime(notice.createdAt, locale)}</p>
                </>
              )
              return (
                <li key={notice.id}>
                  {notice.href ? (
                    <Link
                      id={`${id}-notice-${notice.id}`}
                      href={notice.href}
                      onClick={() => void markAsRead(notice.id)}
                      className={`block px-4 py-3 hover:bg-gray-50 ${notice.read ? '' : 'bg-primary-50/40'}`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="px-4 py-3">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section id={`${id}-schedule`} className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <CalendarClock className="h-4 w-4 text-primary-600" />
          <h2 className="text-sm font-semibold text-gray-900">{t('schedule.timetable')}</h2>
        </div>
        {scheduleLoading ? (
          <p className="p-5 text-sm text-gray-500">{t('schedule.loading')}</p>
        ) : upcomingSlots.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">{t('student.noUpcomingShort')}</p>
        ) : (
          <ul className="compact-list divide-y">
            {upcomingSlots.map((slot) => (
              <li key={slot.id} id={`${id}-slot-${slot.id}`} className="px-4 py-3">
                <p className="break-words text-sm font-medium text-gray-900">
                  {t(`weekday.${slot.dayOfWeek}`)} · {t('common.periodN', { n: slot.period })} · {text(slot.subject)}
                </p>
                <p className="meta-secondary mt-1 text-xs text-gray-500">
                  {slot.startTime}–{slot.endTime}
                  {slot.room ? ` · ${slot.room}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id={`${id}-deadlines`} className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <FileText className="h-4 w-4 text-primary-600" />
          <h2 className="text-sm font-semibold text-gray-900">{t('schedule.deadlines')}</h2>
        </div>
        {deadlines.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">{t('schedule.noDeadlines')}</p>
        ) : (
          <ul className="compact-list divide-y">
            {deadlines.map((task) => {
              const due = new Date(task.dueDate)
              due.setHours(0, 0, 0, 0)
              const daysLeft = Math.round((due.getTime() - startOfToday().getTime()) / 86400000)
              const when =
                daysLeft === 0
                  ? t('common.today')
                  : daysLeft > 0
                    ? t('common.daysLeft', { count: daysLeft })
                    : t('common.overdue', { count: Math.abs(daysLeft) })
              return (
                <li key={task.id}>
                  <Link
                    id={`${id}-deadline-${task.id}`}
                    href={assignmentHref(task.id)}
                    className="block px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-medium text-gray-900">{text(task.title)}</p>
                      <span className="shrink-0 text-xs text-gray-500">{when}</span>
                    </div>
                    <p className="meta-secondary mt-1 text-xs text-gray-500">
                      {t('common.due')}: {formatDate(task.dueDate, locale)}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section id={`${id}-materials`} className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Paperclip className="h-4 w-4 text-primary-600" />
          <h2 className="text-sm font-semibold text-gray-900">{t('schedule.newMaterials')}</h2>
        </div>
        {materials.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">{t('schedule.noMaterials')}</p>
        ) : (
          <ul className="compact-list divide-y">
            {materials.map((file) => (
              <li key={file.id} id={`${id}-material-${file.id}`} className="px-4 py-3">
                {file.url ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-700 hover:underline"
                  >
                    {file.name}
                  </a>
                ) : (
                  <Link href={assignmentHref(file.taskId)} className="text-sm font-medium text-primary-700 hover:underline">
                    {file.name}
                  </Link>
                )}
                <p className="meta-secondary mt-1 text-xs text-gray-500">
                  {text(file.taskTitle)} · {formatDate(file.createdAt, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
