'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'
import { removeQuickAccount } from '@/lib/quickLoginStorage'
import { useAuthStore } from '@/lib/stores/authStore'

interface ChangePasswordFormProps {
  onSuccess?: () => void
  /** Hide outer title when embedded in Settings detail view */
  hideHeader?: boolean
  idPrefix?: string
}

export default function ChangePasswordForm({
  onSuccess,
  hideHeader = false,
  idPrefix = 'change-password',
}: ChangePasswordFormProps = {}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const pid = idPrefix
  const userId = useAuthStore((s) => s.currentUser?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    try {
      await api.auth.changePassword({ currentPassword, newPassword })
      if (userId) removeQuickAccount(userId)
      toast.success('Đã đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id={pid} className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm">
      {!hideHeader && (
        <div className="mb-5 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h2>
        </div>
      )}
      <form id={`${pid}-form`} onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="text-gray-700">Mật khẩu hiện tại</span>
          <div className="relative mt-1">
            <input
              id={`${pid}-current`}
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 pr-10"
            />
            <button
              id={`${pid}-toggle-current`}
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-2 top-2.5 text-gray-400"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Mật khẩu mới</span>
          <div className="relative mt-1">
            <input
              id={`${pid}-new`}
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 pr-10"
            />
            <button
              id={`${pid}-toggle-new`}
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2 top-2.5 text-gray-400"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Xác nhận mật khẩu mới</span>
          <input
            id={`${pid}-confirm`}
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <button
          id={`${pid}-submit`}
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
        </button>
      </form>
    </div>
  )
}
