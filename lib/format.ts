import { localeOption, type Locale } from './i18n/catalog'
import type { UserRole } from './types'

export function intlTag(locale: Locale = 'vi'): string {
  return localeOption(locale).intl
}

export function formatDate(dateStr: string, locale: Locale = 'vi'): string {
  try {
    return new Date(dateStr).toLocaleDateString(intlTag(locale), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string, locale: Locale = 'vi'): string {
  try {
    return new Date(dateStr).toLocaleString(intlTag(locale), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  not_submitted: 'Chưa nộp',
  submitted: 'Đã nộp',
  late: 'Nộp muộn',
}

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật',
}

export function toSchoolDayOfWeek(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

export function todayDateInputValue(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Có mặt',
  late: 'Đi muộn',
  absent: 'Vắng',
}

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800 border-green-300',
  late: 'bg-amber-100 text-amber-800 border-amber-300',
  absent: 'bg-red-100 text-red-800 border-red-300',
}

export const SUBMISSION_STATUS_COLORS: Record<string, string> = {
  not_submitted: 'bg-gray-100 text-gray-800',
  submitted: 'bg-green-100 text-green-800',
  late: 'bg-orange-100 text-orange-800',
}

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Hoạt động',
  restricted: 'Hạn chế',
  suspended: 'Đình chỉ',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  admin: 'Quản trị viên',
}

export function roleDashboardPath(role: UserRole): string {
  return `/${role}/dashboard`
}
