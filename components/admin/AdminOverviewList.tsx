'use client'

import { useEffect } from 'react'
import { Bell, KeyRound, X } from 'lucide-react'
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
import type { AdminClassRow } from '@/lib/api/client'
import type { AccountStatus } from '@/lib/types'
import { formatDate } from '@/lib/format'

const STATUS_COLORS: Record<AccountStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  restricted: 'bg-orange-100 text-orange-800 border-orange-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
}

export interface AdminAccountRow {
  id: string
  memberCode?: string
  email: string
  fullName: string
  role: string
  accountStatus: AccountStatus
  school?: string
  createdAt: string
}

interface AdminOverviewListProps {
  id?: string
  drill: AdminDrill
  inbox: AdminInbox | null
  users: AdminAccountRow[]
  classes: AdminClassRow[]
  loading?: boolean
  remindingId?: string | null
  onClose: () => void
  onUpdateStatus: (userId: string, action: 'approve' | 'setStatus', status?: AccountStatus) => void
  onResetPassword: (user: { id: string; fullName: string; email: string }) => void
  onOpenClass: (classId: string) => void
  onRemind: (warning: AdminTeacherWarning) => void
}

function reasonLabel(reason: AdminTeacherWarning['reason'], t: (path: string) => string) {
  if (reason === 'behind') return t('admin.inboxReasonBehind')
  if (reason === 'no_plan') return t('admin.inboxReasonNoPlan')
  if (reason === 'low_session_rating') return t('admin.inboxReasonLowSession')
  return t('admin.inboxReasonLowCourse')
}

export default function AdminOverviewList({
  id = 'admin-dashboard-drilldown',
  drill,
  inbox,
  users,
  classes,
  loading = false,
  remindingId,
  onClose,
  onUpdateStatus,
  onResetPassword,
  onOpenClass,
  onRemind,
}: AdminOverviewListProps) {
  const { t, locale } = useI18n()

  useEffect(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [id, drill])

  const title =
    drill.kind === 'warnings'
      ? t('admin.inboxWarnings')
      : drill.kind === 'classes'
        ? t('admin.classes')
        : drill.kind === 'reports'
          ? drill.period === 'week'
            ? t('admin.inboxWeekly')
            : t('admin.inboxMonthly')
          : drill.role === 'teacher'
            ? t('admin.teachers')
            : drill.role === 'student'
              ? t('admin.students')
              : drill.status
                ? t(`admin.${drill.status}`)
                : t('nav.accounts')

  const reports =
    drill.kind === 'reports' ? (inbox?.reports.filter((report) => report.period === drill.period) ?? []) : []
  const warnings = drill.kind === 'warnings' ? (inbox?.warnings ?? []) : []
  const count =
    drill.kind === 'accounts' ? users.length : drill.kind === 'classes' ? classes.length : drill.kind === 'warnings' ? warnings.length : reports.length

  const period =
    drill.kind === 'reports' && inbox
      ? drill.period === 'week'
        ? t('admin.inboxWeekRange', {
            start: formatPeriodDay(inbox.week.start, locale),
            end: formatPeriodDay(inbox.week.end, locale),
          })
        : t('admin.inboxMonthRange', {
            start: formatPeriodDay(inbox.month.start, locale),
            end: formatPeriodDay(inbox.month.end, locale),
          })
      : null

  const highlight = (rowId: string) =>
    drill.highlightId === rowId ? 'bg-amber-50' : ''

  return (
    <section id={id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">
            {period ? `${period} · ` : ''}
            {loading
              ? t('common.loading')
              : `${t('admin.inboxFilterHint')} · ${t('admin.inboxCount', { count })}`}
          </p>
        </div>
        <button
          id={`${id}-close`}
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t('admin.inboxClose')}
        </button>
      </div>

      {loading ? (
        <p className="p-8 text-center text-sm text-slate-500">{t('common.loading')}</p>
      ) : drill.kind === 'accounts' ? (
        <AccountTable
          id={id}
          users={users}
          highlight={highlight}
          onUpdateStatus={onUpdateStatus}
          onResetPassword={onResetPassword}
        />
      ) : drill.kind === 'classes' ? (
        <ClassTable id={id} classes={classes} highlight={highlight} onOpenClass={onOpenClass} />
      ) : drill.kind === 'warnings' ? (
        <WarningList
          id={id}
          warnings={warnings}
          highlight={highlight}
          remindingId={remindingId}
          onRemind={onRemind}
          reasonLabel={(reason) => reasonLabel(reason, t)}
        />
      ) : (
        <ReportList id={id} reports={reports} highlight={highlight} onOpenClass={onOpenClass} />
      )}
    </section>
  )
}

function AccountTable({
  id,
  users,
  highlight,
  onUpdateStatus,
  onResetPassword,
}: {
  id: string
  users: AdminAccountRow[]
  highlight: (rowId: string) => string
  onUpdateStatus: AdminOverviewListProps['onUpdateStatus']
  onResetPassword: AdminOverviewListProps['onResetPassword']
}) {
  const { t, locale } = useI18n()
  if (users.length === 0) return <Empty />
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">{t('common.user')}</th>
            <th className="px-4 py-3">{t('admin.memberCode')}</th>
            <th className="px-4 py-3">{t('common.role')}</th>
            <th className="px-4 py-3">{t('common.status')}</th>
            <th className="px-4 py-3">{t('admin.inboxSchool')}</th>
            <th className="px-4 py-3">{t('admin.inboxCreated')}</th>
            <th className="px-4 py-3">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} id={`${id}-row-${user.id}`} className={highlight(user.id)}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{user.memberCode || '—'}</td>
              <td className="px-4 py-3">{user.role === 'teacher' ? t('role.teacher') : t('role.student')}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[user.accountStatus]}`}>
                  {t(`status.account.${user.accountStatus}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{user.school || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt, locale)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {user.accountStatus === 'pending' && (
                    <button
                      id={`${id}-approve-${user.id}`}
                      type="button"
                      onClick={() => onUpdateStatus(user.id, 'approve')}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                    >
                      {t('admin.approve')}
                    </button>
                  )}
                  {user.accountStatus !== 'active' && user.accountStatus !== 'pending' && (
                    <button
                      id={`${id}-activate-${user.id}`}
                      type="button"
                      onClick={() => onUpdateStatus(user.id, 'setStatus', 'active')}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      {t('admin.activate')}
                    </button>
                  )}
                  {user.accountStatus !== 'restricted' && (
                    <button
                      id={`${id}-restrict-${user.id}`}
                      type="button"
                      onClick={() => onUpdateStatus(user.id, 'setStatus', 'restricted')}
                      className="rounded border border-orange-300 bg-orange-50 px-2 py-1 text-xs text-orange-800"
                    >
                      {t('admin.restrict')}
                    </button>
                  )}
                  {user.accountStatus !== 'suspended' && (
                    <button
                      id={`${id}-suspend-${user.id}`}
                      type="button"
                      onClick={() => onUpdateStatus(user.id, 'setStatus', 'suspended')}
                      className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-800"
                    >
                      {t('admin.suspend')}
                    </button>
                  )}
                  <button
                    id={`${id}-reset-${user.id}`}
                    type="button"
                    onClick={() => onResetPassword({ id: user.id, fullName: user.fullName, email: user.email })}
                    className="inline-flex items-center rounded border border-sky-300 bg-sky-50 px-2 py-1 text-xs text-sky-800"
                  >
                    <KeyRound className="mr-1 h-3 w-3" />
                    {t('admin.resetPassword')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ClassTable({
  id,
  classes,
  highlight,
  onOpenClass,
}: {
  id: string
  classes: AdminClassRow[]
  highlight: (rowId: string) => string
  onOpenClass: (classId: string) => void
}) {
  const { t, locale } = useI18n()
  const text = useContentText()
  if (classes.length === 0) return <Empty />
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">{t('admin.className')}</th>
            <th className="px-4 py-3">{t('role.teacher')}</th>
            <th className="px-4 py-3">{t('admin.students')}</th>
            <th className="px-4 py-3">{t('admin.inboxClassCode')}</th>
            <th className="px-4 py-3">{t('admin.inboxCreated')}</th>
            <th className="px-4 py-3">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {classes.map((classroom) => (
            <tr key={classroom.id} id={`${id}-row-${classroom.id}`} className={highlight(classroom.id)}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{text(classroom.title)}</p>
                {classroom.description && <p className="text-xs text-slate-500">{text(classroom.description)}</p>}
              </td>
              <td className="px-4 py-3 text-slate-700">
                <p>{classroom.teacherName}</p>
                <p className="text-xs text-slate-500">{classroom.teacherEmail}</p>
              </td>
              <td className="px-4 py-3">{classroom.studentCount}</td>
              <td className="px-4 py-3 font-mono text-xs">{classroom.classCode}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(classroom.createdAt, locale)}</td>
              <td className="px-4 py-3">
                <button
                  id={`${id}-open-class-${classroom.id}`}
                  type="button"
                  onClick={() => onOpenClass(classroom.id)}
                  className="rounded border px-2 py-1 text-xs"
                >
                  {t('admin.inboxOpenClass')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WarningList({
  id,
  warnings,
  highlight,
  remindingId,
  onRemind,
  reasonLabel,
}: {
  id: string
  warnings: AdminTeacherWarning[]
  highlight: (rowId: string) => string
  remindingId?: string | null
  onRemind: (warning: AdminTeacherWarning) => void
  reasonLabel: (reason: AdminTeacherWarning['reason']) => string
}) {
  const { t } = useI18n()
  const text = useContentText()
  if (warnings.length === 0) return <Empty />
  return (
    <ul className="divide-y">
      {warnings.map((warning) => (
        <li
          key={warning.id}
          id={`${id}-row-${warning.id}`}
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${highlight(warning.id)}`}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {warning.teacherName}
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {reasonLabel(warning.reason)}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {text(warning.classTitle)} · {warning.teacherEmail}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {warning.reason === 'behind'
                ? t('admin.inboxBehind', {
                    teacher: warning.teacherName,
                    classTitle: text(warning.classTitle),
                    rate: warning.progressRate,
                    overdue: warning.overdue,
                  })
                : warning.reason === 'no_plan'
                  ? t('admin.inboxNoPlan', { teacher: warning.teacherName, classTitle: text(warning.classTitle) })
                  : warning.reason === 'low_session_rating'
                    ? t('admin.inboxLowSession', {
                        teacher: warning.teacherName,
                        classTitle: text(warning.classTitle),
                        rating: warning.rating ?? 0,
                      })
                    : t('admin.inboxLowCourse', {
                        teacher: warning.teacherName,
                        classTitle: text(warning.classTitle),
                        rating: warning.rating ?? 0,
                        kind: warning.courseKind === 'final' ? t('charts.finalTerm') : t('charts.midterm'),
                      })}
            </p>
          </div>
          <button
            id={`${id}-remind-${warning.id}`}
            type="button"
            disabled={remindingId === warning.id}
            onClick={() => onRemind(warning)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            <Bell className="h-3.5 w-3.5" />
            {t('admin.inboxRemind')}
          </button>
        </li>
      ))}
    </ul>
  )
}

function ReportList({
  id,
  reports,
  highlight,
  onOpenClass,
}: {
  id: string
  reports: AdminClassReport[]
  highlight: (rowId: string) => string
  onOpenClass: (classId: string) => void
}) {
  const { t } = useI18n()
  const text = useContentText()
  if (reports.length === 0) return <Empty />
  return (
    <ul className="divide-y">
      {reports.map((report) => (
        <li key={report.id} id={`${id}-row-${report.id}`} className={`px-4 py-3 ${highlight(report.id)}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{text(report.classTitle)}</p>
              <p className="text-xs text-slate-500">
                {t('role.teacher')}: {report.teacherName} · {t('admin.inboxClassCode')} {report.classCode} ·{' '}
                {t('admin.students')} {report.studentCount}
              </p>
            </div>
            <button
              id={`${id}-open-report-${report.classId}-${report.period}`}
              type="button"
              onClick={() => onOpenClass(report.classId)}
              className="rounded border px-2 py-1 text-xs"
            >
              {t('admin.inboxOpenClass')}
            </button>
          </div>
          <dl className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-400">{t('admin.inboxTasks')}</dt>
              <dd className="font-medium text-slate-800">{report.tasks}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t('admin.inboxSubmitted')}</dt>
              <dd className="font-medium text-slate-800">
                {report.submitted + report.late}/{report.totalSubs}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">{t('admin.inboxLate')}</dt>
              <dd className="font-medium text-slate-800">{report.late}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t('admin.inboxMissing')}</dt>
              <dd className="font-medium text-slate-800">{report.missing}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t('admin.inboxGraded')}</dt>
              <dd className="font-medium text-slate-800">{report.graded}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t('admin.inboxAttendance')}</dt>
              <dd className="font-medium text-slate-800">
                {attendanceRateLabel(report)} · {t('admin.inboxPresent')} {report.attendancePresent} ·{' '}
                {t('admin.inboxAttendLate')} {report.attendanceLate} · {t('admin.inboxAbsent')} {report.attendanceAbsent}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">{t('admin.inboxPlanLabel')}</dt>
              <dd className="font-medium text-slate-800">
                {t('admin.inboxPlan', { done: report.planDone, due: report.planDue })}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

function Empty() {
  const { t } = useI18n()
  return <p className="p-8 text-center text-sm text-slate-500">{t('admin.inboxNoRows')}</p>
}
