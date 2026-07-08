'use client'

import { useState } from 'react'
import { Copy, KeyRound, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'
import { generateTempPassword } from '@/lib/utils/generateTempPassword'

interface ResetPasswordModalProps {
  user: { id: string; fullName: string; email: string }
  onClose: () => void
}

export default function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resultPassword, setResultPassword] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    const temp = generateTempPassword(10)
    setNewPassword(temp)
    setConfirmPassword(temp)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    try {
      const { temporaryPassword } = await api.admin.updateUser(user.id, {
        action: 'resetPassword',
        newPassword,
      })
      setResultPassword(temporaryPassword ?? newPassword)
      toast.success('Đã reset mật khẩu')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Reset thất bại')
    } finally {
      setLoading(false)
    }
  }

  const copyPassword = async () => {
    if (!resultPassword) return
    await navigator.clipboard.writeText(resultPassword)
    toast.success('Đã sao chép mật khẩu')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <KeyRound className="h-5 w-5 text-sky-600" />
              Reset mật khẩu
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {user.fullName} — {user.email}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {resultPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">Mật khẩu mới (gửi cho người dùng):</p>
              <p className="mt-2 font-mono text-lg font-bold tracking-wide text-green-900">{resultPassword}</p>
            </div>
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex w-full items-center justify-center rounded-lg border py-2 text-sm font-medium"
            >
              <Copy className="mr-1.5 h-4 w-4" />
              Sao chép mật khẩu
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm text-white"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full rounded-lg border border-dashed border-sky-300 bg-sky-50 py-2 text-sm text-sky-800"
            >
              Tạo mật khẩu tạm tự động
            </button>
            <input
              type="text"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border py-2.5 text-sm"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Reset mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
