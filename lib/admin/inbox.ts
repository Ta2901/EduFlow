import type { Locale } from '../i18n/catalog'
import { intlTag } from '../format'
import type { AccountStatus } from '../types'

export type AdminWarningReason = 'behind' | 'no_plan' | 'low_session_rating' | 'low_course_rating'

export interface AdminTeacherWarning {
  id: string
  classId: string
  classTitle: string
  teacherId: string
  teacherName: string
  teacherEmail: string
  reason: AdminWarningReason
  overdue: number
  progressRate: number
  rating?: number
  ratingCount?: number
  courseKind?: 'midterm' | 'final'
}

export interface AdminPendingAccount {
  id: string
  fullName: string
  email: string
  role: 'teacher' | 'student'
  memberCode?: string
  school?: string
  createdAt: string
}

export interface AdminClassReport {
  id: string
  period: 'week' | 'month'
  periodKey: string
  classId: string
  classTitle: string
  classCode: string
  teacherId: string
  teacherName: string
  studentCount: number
  tasks: number
  submitted: number
  late: number
  missing: number
  graded: number
  pendingGrade: number
  totalSubs: number
  attendancePresent: number
  attendanceLate: number
  attendanceAbsent: number
  attendanceTotal: number
  planDone: number
  planDue: number
}

export interface AdminPeriod {
  key: string
  start: string
  end: string
}

export interface AdminInbox {
  generatedAt: string
  week: AdminPeriod
  month: AdminPeriod
  warnings: AdminTeacherWarning[]
  pendingAccounts: AdminPendingAccount[]
  reports: AdminClassReport[]
}

export type AdminDrill =
  | { kind: 'accounts'; status?: AccountStatus; role?: 'teacher' | 'student'; highlightId?: string }
  | { kind: 'classes'; highlightId?: string }
  | { kind: 'warnings'; highlightId?: string }
  | { kind: 'reports'; period: 'week' | 'month'; highlightId?: string }

export type OverviewStatKey =
  | 'pending'
  | 'active'
  | 'restricted'
  | 'suspended'
  | 'teachers'
  | 'students'
  | 'classes'

export function drillForStat(key: OverviewStatKey): AdminDrill {
  if (key === 'classes') return { kind: 'classes' }
  if (key === 'teachers') return { kind: 'accounts', role: 'teacher' }
  if (key === 'students') return { kind: 'accounts', role: 'student' }
  return { kind: 'accounts', status: key }
}

export function sameAdminDrill(a: AdminDrill | null, b: AdminDrill | null) {
  if (!a || !b || a.kind !== b.kind) return false
  if (a.kind === 'accounts' && b.kind === 'accounts') {
    return a.status === b.status && a.role === b.role
  }
  if (a.kind === 'reports' && b.kind === 'reports') return a.period === b.period
  return true
}

export function formatPeriodDay(ymd: string, locale: Locale) {
  const [year, month, day] = ymd.split('-').map(Number)
  if (!year || !month || !day) return ymd
  return new Date(year, month - 1, day).toLocaleDateString(intlTag(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function attendanceRateLabel(report: Pick<AdminClassReport, 'attendancePresent' | 'attendanceLate' | 'attendanceTotal'>) {
  if (report.attendanceTotal === 0) return '—'
  const rate = Math.round(((report.attendancePresent + report.attendanceLate) / report.attendanceTotal) * 100)
  return `${rate}%`
}
