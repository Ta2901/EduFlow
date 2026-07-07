'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'

export default function JoinClassPage() {
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.currentUser)!
  const joinClassByCode = useEduStore((s) => s.joinClassByCode)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.error('Vui lòng nhập mã lớp')
      return
    }

    setIsLoading(true)
    const result = await joinClassByCode(code, {
      id: currentUser.id,
      name: currentUser.fullName,
      email: currentUser.email,
    })
    setIsLoading(false)

    if (!result.ok) {
      toast.error(result.error || 'Không thể tham gia lớp')
      return
    }

    toast.success('Tham gia lớp thành công!')
    router.push(`/student/courses/${result.classId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader userId={currentUser.id} title="Tham gia lớp học" backHref="/student/dashboard" />

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg p-4 sm:p-6"
      >
        <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4">
            <Users className="h-8 w-8 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-800">
              Nhập <strong>mã lớp</strong> do giáo viên cung cấp (VD: <span className="font-mono">MATH10A</span>).
            </p>
          </div>

          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-medium text-gray-700">
              Mã lớp <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 font-mono text-lg tracking-widest focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="MATH10A"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push('/student/dashboard')}
              className="flex-1 rounded-lg border border-gray-300 py-3 text-center text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang tham gia...' : 'Tham gia lớp'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Demo: mã <span className="font-mono font-semibold">MATH10A</span> (sau khi GV đã tạo lớp)
        </p>
      </motion.form>
    </div>
  )
}
