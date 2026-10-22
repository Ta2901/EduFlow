'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, CalendarRange, CheckCheck, UserCheck } from 'lucide-react'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText } from '@/components/i18n/useContentText'
import {
  attendanceRateLabel,
  formatPeriodDay,
  type AdminClassReport,
  type AdminDrill,
  type AdminInbox,
  type AdminTeacherWarning,
} from '@/lib/admin/inbox'

const STORAGE_KEY = 'eduflow-admin-inbox-seen'

interface Notice {
  id: string
  section: 'warnings' | 'pending' | 'week' | 'month'
  message: string
  drill: AdminDrill
  alert: boolean
}

function reportNeedsAttention(report: AdminClassReport) {
  return report.missing > 0 || report.attendanceAbsent > 0 || report.planDue > report.planDone
}

interface AdminNotificationBellProps {
  id?: string
  inbox: AdminInbox | null
  onOpen: (drill: AdminDrill) => void
  onRefresh: () => void
}

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeSeen(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-500)))
}

function warningMessage(
  warning: AdminTeacherWarning,
  t: (path: string, vars?: Record<string, string | number>) => string,
  text: (value: string) => string
) {
  const classTitle = text(warning.classTitle)
  if (warning.reason === 'behind') {
    return t('admin.inboxBehind', {
      teacher: warning.teacherName,
      classTitle,
      rate: warning.progressRate,
      overdue: warning.overdue,
    })
  }
  if (warning.reason === 'no_plan') {
    return t('admin.inboxNoPlan', { teacher: warning.teacherName, classTitle })
  }
  if (warning.reason === 'low_session_rating') {
    return t('admin.inboxLowSession', {
      teacher: warning.teacherName,
      classTitle,
      rating: warning.rating ?? 0,
    })
  }
  return t('admin.inboxLowCourse', {
    teacher: warning.teacherName,
    classTitle,
    rating: warning.rating ?? 0,
    kind: warning.courseKind === 'final' ? t('charts.finalTerm') : t('charts.midterm'),
  })
}

export default function AdminNotificationBell({
  id = 'admin-notification-bell',
  inbox,
  onOpen,
  onRefresh,
}: AdminNotificationBellProps) {
  const { t, locale } = useI18n()
  const text = useContentText()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<string[] | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSeen(readSeen())
  }, [])

  useEffect(() => {
    if (open) onRefresh()
  }, [open, onRefresh])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const notices = useMemo<Notice[]>(() => {
    if (!inbox) return []
    const items: Notice[] = []
    for (const warning of inbox.warnings) {
      items.push({
        id: warning.id,
        section: 'warnings',
        message: warningMessage(warning, t, text),
        drill: { kind: 'warnings', highlightId: warning.id },
        alert: true,
      })
    }
    for (const account of inbox.pendingAccounts) {
      items.push({
        id: `p:${account.id}`,
        section: 'pending',
        message: t('admin.inboxPendingLine', {
          name: account.fullName,
          role: t(account.role === 'teacher' ? 'role.teacher' : 'role.student'),
        }),
        drill: { kind: 'accounts', status: 'pending', highlightId: account.id },
        alert: true,
      })
    }
    for (const report of inbox.reports) {
      items.push({
        id: report.id,
        section: report.period === 'week' ? 'week' : 'month',
        message: t('admin.inboxReportLine', {
          classTitle: text(report.classTitle),
          submitted: report.submitted + report.late,
          total: report.totalSubs,
          rate: attendanceRateLabel(report),
        }),
        drill: { kind: 'reports', period: report.period, highlightId: report.id },
        alert: reportNeedsAttention(report),
      })
    }
    return items
  }, [inbox, t, text])

  const seenSet = useMemo(() => new Set(seen ?? []), [seen])
  const unreadCount =
    seen == null ? 0 : notices.filter((item) => item.alert && !seenSet.has(item.id)).length

  const remember = (ids: string[]) => {
    const currentIds = new Set(notices.map((item) => item.id))
    const next = Array.from(new Set([...(seen ?? []), ...ids])).filter((item) => currentIds.has(item))
    setSeen(next)
    writeSeen(next)
  }

  const openNotice = (notice: Notice) => {
    remember([notice.id])
    onOpen(notice.drill)
    setOpen(false)
  }

  const openSection = (section: Notice['section'], drill: AdminDrill) => {
    remember(notices.filter((item) => item.section === section).map((item) => item.id))
    onOpen(drill)
    setOpen(false)
  }

  const markAll = () => remember(notices.map((item) => item.id))

  const sections: {
    id: Notice['section']
    label: string
    range?: string
    drill: AdminDrill
    icon: typeof Bell
  }[] = [
    { id: 'warnings', label: t('admin.inboxWarnings'), drill: { kind: 'warnings' }, icon: AlertTriangle },
    { id: 'pending', label: t('admin.inboxPending'), drill: { kind: 'accounts', status: 'pending' }, icon: UserCheck },
    {
      id: 'week',
      label: t('admin.inboxWeekly'),
      range: inbox
        ? t('admin.inboxWeekRange', {
            start: formatPeriodDay(inbox.week.start, locale),
            end: formatPeriodDay(inbox.week.end, locale),
          })
        : undefined,
      drill: { kind: 'reports', period: 'week' },
      icon: CalendarRange,
    },
    {
      id: 'month',
      label: t('admin.inboxMonthly'),
      range: inbox
        ? t('admin.inboxMonthRange', {
            start: formatPeriodDay(inbox.month.start, locale),
            end: formatPeriodDay(inbox.month.end, locale),
          })
        : undefined,
      drill: { kind: 'reports', period: 'month' },
      icon: CalendarRange,
    },
  ]

  return (
    <div id={id} className="relative" ref={panelRef}>
      <button
        id={`${id}-toggle`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-2 text-slate-200 hover:bg-slate-800 hover:text-white"
        aria-label={t('admin.inboxTitle')}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            id={`${id}-badge`}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={`${id}-panel`}
          className="fixed right-3 top-16 z-[100] w-[min(calc(100vw-1.5rem),380px)] rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg sm:absolute sm:right-0 sm:top-auto sm:mt-2"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">{t('admin.inboxTitle')}</h3>
            {unreadCount > 0 && (
              <button
                id={`${id}-mark-all-read`}
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-sky-700 hover:text-sky-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t('admin.inboxMarkRead')}
              </button>
            )}
          </div>
          <div id={`${id}-list`} className="max-h-[28rem] overflow-y-auto">
            {notices.length === 0 ? (
              <p id={`${id}-empty`} className="px-4 py-8 text-center text-sm text-slate-500">
                {t('admin.inboxEmpty')}
              </p>
            ) : (
              sections.map((section) => {
                const items = notices.filter((item) => item.section === section.id)
                if (items.length === 0) return null
                const Icon = section.icon
                return (
                  <section key={section.id} id={`${id}-section-${section.id}`} className="border-b last:border-b-0">
                    <div className="flex items-center justify-between gap-2 bg-slate-50 px-4 py-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {section.label}
                          <span className="font-normal text-slate-400">({items.length})</span>
                        </p>
                        {section.range && <p className="truncate text-[11px] text-slate-400">{section.range}</p>}
                      </div>
                      <button
                        id={`${id}-view-${section.id}`}
                        type="button"
                        onClick={() => openSection(section.id, section.drill)}
                        className="shrink-0 text-xs font-medium text-sky-700 hover:text-sky-800"
                      >
                        {t('admin.inboxViewAll', { count: items.length })}
                      </button>
                    </div>
                    <ul>
                      {items.slice(0, 4).map((item) => {
                        const unread = item.alert && !seenSet.has(item.id)
                        return (
                          <li key={item.id}>
                            <button
                              id={`${id}-item-${item.id}`}
                              type="button"
                              onClick={() => openNotice(item)}
                              className={`block w-full px-4 py-2.5 text-left hover:bg-slate-50 ${
                                unread ? 'bg-amber-50/80' : ''
                              }`}
                            >
                              <span className="flex items-start gap-2">
                                {unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
                                <span className="text-xs leading-5 text-slate-700">{item.message}</span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
