import type { ClassStatus } from './types'

export function normalizeClassStatus(status?: string | null): ClassStatus {
  if (status === 'draft' || status === 'published' || status === 'archived' || status === 'cancelled') {
    return status
  }
  return 'published'
}

export function studentCanSelfJoin(status?: string | null) {
  return normalizeClassStatus(status) === 'published'
}

export function joinBlockedReason(status?: string | null): string | null {
  const s = normalizeClassStatus(status)
  if (s === 'draft') return 'Lớp này còn ở chế độ nháp, chưa phát hành. Học sinh chưa thể tham gia.'
  if (s === 'archived') return 'Lớp đã lưu trữ, không thể tham gia mới.'
  if (s === 'cancelled') return 'Lớp học này đã bị huỷ, không thể tham gia.'
  return null
}

export function classWritesBlocked(status?: string | null): string | null {
  if (normalizeClassStatus(status) === 'cancelled') {
    return 'Lớp đã bị huỷ, không thể chỉnh sửa.'
  }
  return null
}
