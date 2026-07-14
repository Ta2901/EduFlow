'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { api, ApiError } from '@/lib/api/client'

type Step = 'request' | 'verify'
type Channel = 'email' | 'phone'

export default function ForgotPasswordPage() {
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
        toast('Nếu thông tin khớp, hãy kiểm tra hộp thư / tin nhắn. Bạn có thể thử lại sau vài phút.', {
          icon: 'ℹ️',
        })
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không gửi được mã OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestId) {
      toast.error('Vui lòng yêu cầu mã OTP trước')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
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
      toast.error(err instanceof ApiError ? err.message : 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="auth-forgot" className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-8 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle id="auth-forgot-theme-toggle" />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link id="auth-forgot-logo" href="/" className="inline-flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-primary-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">EduFlow</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-600">
            Xác thực bằng email khôi phục (Gmail, iCloud, …) hoặc số điện thoại đã đăng ký
          </p>
        </div>

        <div id="auth-forgot-panel" className="rounded-xl border bg-white p-6 shadow-lg sm:p-8">
          {step === 'request' ? (
            <form id="auth-forgot-request-form" onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email đăng nhập hoặc mã tài khoản
                </label>
                <input
                  id="auth-forgot-login-id"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="vd: student@eduflow.com hoặc 100002"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Phương thức xác thực</p>
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
                    Số điện thoại
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {channel === 'email'
                    ? 'Email khôi phục (Gmail, iCloud, Outlook, …)'
                    : 'Số điện thoại đã đăng ký'}
                </label>
                <input
                  id="auth-forgot-contact"
                  required
                  type={channel === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={
                    channel === 'email' ? 'you@gmail.com hoặc you@icloud.com' : '0901234567'
                  }
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {channel === 'email'
                    ? 'Phải trùng email đăng nhập hoặc email khôi phục đã lưu trên tài khoản.'
                    : 'Phải trùng số điện thoại đã lưu khi đăng ký / cập nhật hồ sơ.'}
                </p>
              </div>

              <button
                id="auth-forgot-send-otp"
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? 'Đang gửi…' : 'Gửi mã OTP'}
              </button>
            </form>
          ) : (
            <form id="auth-forgot-reset-form" onSubmit={handleReset} className="space-y-5">
              <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                Mã OTP đã gửi tới <strong>{maskedTarget || 'thông tin khôi phục'}</strong> (hiệu lực 10
                phút).
              </div>

              {devOtp && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <strong>Dev OTP:</strong> <span className="font-mono text-base tracking-widest">{devOtp}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Mã OTP (6 số)</label>
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
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
                    placeholder="Ít nhất 6 ký tự"
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
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
                {loading ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}
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
                Gửi lại mã / đổi phương thức
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600">
          Nhớ mật khẩu?{' '}
          <Link id="auth-forgot-login-link" href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
