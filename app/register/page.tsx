'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, BookOpen, User, Lock, Mail, Phone, School } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useAuthStore } from '@/lib/stores/authStore'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    recoveryEmail: '',
    password: '',
    confirmPassword: '',
    role: 'teacher' as 'student' | 'teacher',
    school: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registeredCode, setRegisteredCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const register = useAuthStore((s) => s.register)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setIsLoading(true)
    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
      recoveryEmail: formData.recoveryEmail,
      school: formData.school,
    })
    setIsLoading(false)

    if (!result.ok) {
      toast.error(result.error || 'Đăng ký thất bại')
      return
    }

    if (result.pending) {
      if (result.memberCode) {
        setRegisteredCode(result.memberCode)
        toast.success('Đăng ký thành công!')
        return
      }
      toast.success(result.message || 'Đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt.')
      router.push('/login')
      return
    }

    toast.success('Đăng ký thành công!')
    router.push(formData.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div id="auth-register" className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-8 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle id="auth-register-theme-toggle" />
      </div>
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link id="auth-register-logo" href="/" className="flex justify-center">
            <div className="flex items-center">
              <BookOpen className="h-12 w-12 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">EduFlow</span>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Tạo tài khoản mới</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sau khi đăng ký, hệ thống tự cấp mã tài khoản số để đăng nhập
          </p>
        </motion.div>

        {registeredCode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            id="auth-register-success" className="rounded-xl border border-green-200 bg-green-50 p-6 text-center shadow-lg"
          >
            <h3 className="text-lg font-semibold text-green-900">Tài khoản đã được tạo</h3>
            <p className="mt-2 text-sm text-green-800">
              Mã tài khoản của bạn (dùng để đăng nhập):
            </p>
            <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-green-900">{registeredCode}</p>
            <p className="mt-3 text-sm text-green-700">
              Bạn có thể đăng nhập bằng <strong>mã tài khoản</strong> hoặc <strong>email</strong> sau khi quản trị viên phê duyệt.
            </p>
            <button
              id="auth-register-goto-login"
              type="button"
              onClick={() => router.push('/login')}
              className="mt-5 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Đến trang đăng nhập
            </button>
          </motion.div>
        ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          id="auth-register-form"
          className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bạn là</label>
            <select
              id="auth-register-role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
            </select>
          </div>

          <div>
            <label htmlFor="auth-register-full-name" className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="auth-register-full-name"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập họ và tên"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="auth-register-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập email của bạn"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-phone" className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="auth-register-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập số điện thoại (khôi phục mật khẩu)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-recovery-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email khôi phục (Gmail / iCloud / …)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="auth-register-recovery-email"
                name="recoveryEmail"
                type="email"
                value={formData.recoveryEmail}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@gmail.com hoặc you@icloud.com"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Tuỳ chọn — dùng khi quên mật khẩu</p>
          </div>

          <div>
            <label htmlFor="auth-register-school" className="block text-sm font-medium text-gray-700 mb-2">
              Trường học
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <School className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="auth-register-school"
                name="school"
                type="text"
                value={formData.school}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập tên trường học"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="auth-register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập mật khẩu"
              />
              <button
                id="auth-register-toggle-password"
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

          <div>
            <label htmlFor="auth-register-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="auth-register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                id="auth-register-toggle-confirm"
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="auth-register-terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="auth-register-terms" className="ml-2 block text-sm text-gray-700">
              Tôi đồng ý với{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Điều khoản sử dụng
              </a>
            </label>
          </div>

          <button
            id="auth-register-submit"
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang tạo tài khoản...
              </div>
            ) : (
              'Tạo tài khoản'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link id="auth-register-login-link" href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </motion.form>
        )}
      </div>
    </div>
  )
}
