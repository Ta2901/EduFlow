'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import LanguageSwitcher, { VersionBadge } from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/components/i18n/LanguageProvider'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { api, ApiError } from '@/lib/api/client'

type Step = 'request' | 'verify'
type Channel = 'email' | 'phone'

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<Step>('request')
  const [channel, setChannel] = useState<Channel>('email')
  const [loginId, setLoginId] = useState('')
  const [contact, setContact] = useState('')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [maskedTarget, setMaskedTarget] = useState('')
  const [devOtp, setDevOtp] = useState<string | undefined>()
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api.auth.forgotPasswordRequest({
        loginId,
        channel,
        contact,
      })
      toast.success(data.message)
      if (data.requestId) {
        setRequestId(data.requestId)
        setMaskedTarget(data.maskedTarget || '')
        setDevOtp(data.devOtp)
        setStep('verify')
      } else {
        // Still show verify-looking message but without requestId — keep user on request
        // with soft success (anti-enumeration). If no match, inform gently.
        toast(t('auth.softMatch'), {
          icon: 'ℹ️',
        })
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('auth.otpFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestId) {
      toast.error(t('auth.otpRequired'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      const data = await api.auth.forgotPasswordReset({
        requestId,
        code,
        newPassword,
      })
      toast.success(data.message)
      router.push('/login')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('auth.resetFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="auth-forgot" className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-8 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <div className="flex items-center gap-2">
          <LanguageSwitcher id="auth-forgot-language" />
          <ThemeToggle id="auth-forgot-theme-toggle" />
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link id="auth-forgot-logo" href="/" className="inline-flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-primary-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">EduFlow</span>
            <VersionBadge className="ml-2" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('auth.forgotTitle')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('auth.forgotSubtitle')}</p>
        </div>

        <div id="auth-forgot-panel" className="rounded-xl border bg-white p-6 shadow-lg sm:p-8">
          {step === 'request' ? (
            <form id="auth-forgot-request-form" onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('auth.loginId')}
                </label>
                <input
                  id="auth-forgot-login-id"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('auth.loginIdPlaceholder')}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">{t('auth.channel')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="auth-forgot-channel-email"
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                      channel === 'email'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                  <button
                    id="auth-forgot-channel-phone"
                    type="button"
                    onClick={() => setChannel('phone')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                      channel === 'phone'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    {t('auth.phoneChannel')}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {channel === 'email' ? t('auth.recoveryContactEmail') : t('auth.registeredPhone')}
                </label>
                <input
                  id="auth-forgot-contact"
                  required
                  type={channel === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={
                    channel === 'email' ? t('auth.recoveryPlaceholder') : '0901234567'
                  }
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {channel === 'email' ? t('auth.emailMustMatch') : t('auth.phoneMustMatch')}
                </p>
              </div>

              <button
                id="auth-forgot-send-otp"
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? t('auth.sending') : t('auth.sendOtp')}
              </button>
            </form>
          ) : (
            <form id="auth-forgot-reset-form" onSubmit={handleReset} className="space-y-5">
              <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                {t('auth.otpSent', { target: maskedTarget || t('auth.recoveryTarget') })}
              </div>

              {devOtp && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <strong>Dev OTP:</strong> <span className="font-mono text-base tracking-widest">{devOtp}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('auth.otpLabel')}</label>
                <input
                  id="auth-forgot-otp"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('auth.newPassword')}</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="auth-forgot-new-password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={t('auth.newPasswordHint')}
                  />
                  <button
                    id="auth-forgot-toggle-password"
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('auth.confirmPassword')}</label>
                <input
                  id="auth-forgot-confirm-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                id="auth-forgot-submit"
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? t('auth.updating') : t('auth.resetPassword')}
              </button>

              <button
                id="auth-forgot-back"
                type="button"
                onClick={() => {
                  setStep('request')
                  setCode('')
                  setDevOtp(undefined)
                  setRequestId(null)
                }}
                className="w-full text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                {t('auth.resend')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600">
          {t('auth.rememberPassword')}{' '}
          <Link id="auth-forgot-login-link" href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            {t('common.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
