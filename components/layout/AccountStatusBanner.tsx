'use client'

import { useAuthStore } from '@/lib/stores/authStore'

export default function AccountStatusBanner() {
  const user = useAuthStore((s) => s.currentUser)
  if (!user || user.accountStatus !== 'restricted') return null

  return (
    <div className="border-b border-orange-200 bg-orange-50 px-4 py-3 text-center text-sm text-orange-900">
      Tài khoản của bạn đang bị <strong>hạn chế</strong>. Bạn chỉ có thể xem nội dung, không thể tạo hoặc
      chỉnh sửa dữ liệu.
      {user.statusNote ? ` Ghi chú: ${user.statusNote}` : ''}
    </div>
  )
}
