'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/stores/authStore'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const currentUser = useAuthStore((s) => s.currentUser)
  const isReady = useAuthStore((s) => s.isReady)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await login(email, password)
    setIsLoading(false)

    if (!result.ok) {
      toast.error(result.error || 'Đăng nhập thất bại')
      return
    }

    const user = useAuthStore.getState().currentUser
    if (!user) return

    toast.success('Đăng nhập thành công!')
    router.push(`/${user.role}/dashboard`)
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Đã đăng xuất. Bạn có thể đăng nhập tài khoản khác.')
  }

  return (
    <>
      {isReady && currentUser && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            Bạn đang đăng nhập là <strong>{currentUser.fullName}</strong> (
            {currentUser.role === 'admin'
              ? 'Quản trị viên'
              : currentUser.role === 'teacher'
                ? 'Giáo viên'
                : 'Học sinh'}
            ).
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(`/${currentUser.role}/dashboard`)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
            >
              Vào hệ thống
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Đăng xuất để đổi tài khoản
            </button>
          </div>
        </div>
      )}

      <motion.form
        initial={false}
        className="space-y-6 bg-white p-8 rounded-xl shadow-lg"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email hoặc mã tài khoản
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Email hoặc mã tài khoản (vd: 100001)"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Nhập mật khẩu"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Đang đăng nhập...
            </div>
          ) : (
            'Đăng nhập'
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </motion.form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Tài khoản demo:</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <p>
            <strong>Admin:</strong> eduflow.admin / firstedu.eduflow
          </p>
          <p>
            <strong>Học sinh:</strong> student@eduflow.com hoặc 100002 / password123
          </p>
          <p>
            <strong>Giáo viên:</strong> teacher@eduflow.com hoặc 100001 / password123
          </p>
        </div>
      </div>
    </>
  )
}
