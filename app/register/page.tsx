'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, BookOpen, User, Lock, Mail, Phone, School } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LanguageSwitcher, { VersionBadge } from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/components/i18n/LanguageProvider'
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
  const { t } = useI18n()
  const router = useRouter()
  const register = useAuthStore((s) => s.register)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordMismatch'))
      return
    }

    if (formData.password.length < 6) {
      toast.error(t('auth.passwordMin'))
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
      toast.error(result.error || t('auth.registerFailed'))
      return
    }

    if (result.pending) {
      if (result.memberCode) {
        setRegisteredCode(result.memberCode)
        toast.success(t('auth.registerOk'))
        return
      }
      toast.success(result.message || t('auth.registerPending'))
      router.push('/login')
      return
    }

    toast.success(t('auth.registerOk'))
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
        <div className="flex items-center gap-2">
          <LanguageSwitcher id="auth-register-language" />
          <ThemeToggle id="auth-register-theme-toggle" />
        </div>
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
              <VersionBadge className="ml-2" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{t('auth.registerTitle')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('auth.registerSubtitle')}</p>
        </motion.div>

        {registeredCode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            id="auth-register-success" className="rounded-xl border border-green-200 bg-green-50 p-6 text-center shadow-lg"
          >
            <h3 className="text-lg font-semibold text-green-900">{t('auth.accountCreated')}</h3>
            <p className="mt-2 text-sm text-green-800">{t('auth.yourCode')}</p>
            <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-green-900">{registeredCode}</p>
            <p className="mt-3 text-sm text-green-700">
              {t('auth.loginAfterApproval')}
            </p>
            <button
              id="auth-register-goto-login"
              type="button"
              onClick={() => router.push('/login')}
              className="mt-5 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              {t('auth.goLogin')}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.youAre')}</label>
            <select
              id="auth-register-role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="student">{t('role.student')}</option>
              <option value="teacher">{t('role.teacher')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="auth-register-full-name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.fullName')}
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
                placeholder={t('auth.fullNamePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
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
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.phone')}
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
                placeholder={t('auth.phonePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-recovery-email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.recoveryEmail')}
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
                placeholder={t('auth.recoveryPlaceholder')}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('auth.recoveryOptional')}</p>
          </div>

          <div>
            <label htmlFor="auth-register-school" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.school')}
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
                placeholder={t('auth.schoolPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-register-password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.password')}
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
                placeholder={t('auth.passwordPlaceholder')}
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
              {t('auth.confirmPassword')}
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
                placeholder={t('auth.confirmPlaceholder')}
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
              {t('auth.agreeTerms')}{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                {t('auth.terms')}
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
                {t('auth.creating')}
              </div>
            ) : (
              t('auth.createAccount')
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('auth.hasAccount')}{' '}
              <Link id="auth-register-login-link" href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                {t('auth.loginNow')}
              </Link>
            </p>
          </div>
        </motion.form>
        )}
      </div>
    </div>
  )
}
