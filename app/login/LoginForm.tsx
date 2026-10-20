'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, Trash2, User, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api/client'
import {
  listSavedQuickAccounts,
  removeQuickAccount,
  saveQuickAccount,
  type SavedQuickAccount,
} from '@/lib/quickLoginStorage'
import { useAuthStore } from '@/lib/stores/authStore'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { roleDashboardPath } from '@/lib/format'
import type { UserRole } from '@/lib/types'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [enableQuickLogin, setEnableQuickLogin] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState<SavedQuickAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [quickLoadingId, setQuickLoadingId] = useState<string | null>(null)
  const { t } = useI18n()
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const quickLogin = useAuthStore((s) => s.quickLogin)
  const currentUser = useAuthStore((s) => s.currentUser)
  const isReady = useAuthStore((s) => s.isReady)

  useEffect(() => {
    setSavedAccounts(listSavedQuickAccounts())
  }, [])

  useEffect(() => {
    if (!isReady || !currentUser) return
    router.replace(roleDashboardPath(currentUser.role))
  }, [isReady, currentUser, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await login(email, password, { enableQuickLogin })
    setIsLoading(false)

    if (!result.ok) {
      toast.error(result.error || t('auth.loginFailed'))
      return
    }

    const user = useAuthStore.getState().currentUser
    if (!user) {
      toast.error(t('auth.loginFailed'))
      return
    }

    if (enableQuickLogin && result.quickLogin) {
      saveQuickAccount({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        memberCode: user.memberCode,
        loginId: email.trim(),
        tokenId: result.quickLogin.tokenId,
        token: result.quickLogin.token,
        savedAt: new Date().toISOString(),
      })
      setSavedAccounts(listSavedQuickAccounts())
      toast.success(t('auth.loginOkQuick'))
    } else if (enableQuickLogin) {
      toast.success(t('auth.loginOkQuickFail'))
    } else {
      toast.success(t('auth.loginOk'))
    }

    router.replace(roleDashboardPath(user.role))
  }

  const handleQuickLogin = async (account: SavedQuickAccount) => {
    setQuickLoadingId(account.userId)
    const result = await quickLogin(account.token)
    setQuickLoadingId(null)

    if (!result.ok) {
      toast.error(result.error || t('auth.quickFailed'))
      // Token expired/revoked — remove stale account
      removeQuickAccount(account.userId)
      setSavedAccounts(listSavedQuickAccounts())
      setEmail(account.loginId || account.email)
      return
    }

    const user = useAuthStore.getState().currentUser
    if (!user) {
      toast.error(t('auth.quickFailed'))
      return
    }

    toast.success(t('common.helloName', { name: user.fullName }))
    router.replace(roleDashboardPath(user.role))
  }

  const handleRemoveAccount = async (account: SavedQuickAccount) => {
    removeQuickAccount(account.userId)
    setSavedAccounts(listSavedQuickAccounts())
    void api.auth.revokeQuickLogin({ tokenId: account.tokenId, token: account.token }).catch(() => null)
    toast.success(t('auth.removedQuick'))
  }

  if (!isReady || currentUser) {
    return (
      <div id="auth-login-loading" className="flex items-center justify-center rounded-xl bg-white p-12 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
          <p className="text-sm text-gray-500">
            {currentUser ? t('auth.entering') : t('auth.checkingSession')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {savedAccounts.length > 0 && (
        <div
          id="auth-login-quick"
          className="mb-4 space-y-3 rounded-xl border border-primary-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-900">{t('auth.quickTitle')}</h3>
          </div>
          <p className="text-xs text-gray-500">{t('auth.quickHint')}</p>
          <ul id="auth-login-quick-list" className="space-y-2">
            {savedAccounts.map((account) => (
              <li
                key={account.userId}
                id={`auth-login-quick-item-${account.userId}`}
                className="flex items-center gap-2 rounded-lg border p-2.5"
              >
                <button
                  id={`auth-login-quick-btn-${account.userId}`}
                  type="button"
                  disabled={quickLoadingId === account.userId}
                  onClick={() => void handleQuickLogin(account)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-90 disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                    <User className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {account.fullName}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {t(`role.${account.role as UserRole}`) || account.role} · {account.loginId || account.email}
                    </span>
                  </span>
                  {quickLoadingId === account.userId ? (
                    <span className="ml-auto h-4 w-4 shrink-0 animate-spin rounded-full border-b-2 border-primary-600" />
                  ) : (
                    <span className="ml-auto shrink-0 text-xs font-medium text-primary-600">{t('auth.enter')}</span>
                  )}
                </button>
                <button
                  id={`auth-login-quick-remove-${account.userId}`}
                  type="button"
                  onClick={() => void handleRemoveAccount(account)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title={t('auth.removeQuick')}
                  aria-label={t('auth.removeQuickAria')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <motion.form
        id="auth-login-form"
        initial={false}
        className="space-y-6 rounded-xl bg-white p-8 shadow-lg"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="auth-login-email" className="mb-2 block text-sm font-medium text-gray-700">
            {t('auth.emailOrCode')}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="auth-login-email"
              name="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('auth.emailOrCodePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="auth-login-password" className="mb-2 block text-sm font-medium text-gray-700">
            {t('auth.password')}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="auth-login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('auth.passwordPlaceholder')}
            />
            <button
              id="auth-login-toggle-password"
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
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

        <label
          id="auth-login-quick-consent"
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
        >
          <input
            id="auth-login-enable-quick"
            type="checkbox"
            checked={enableQuickLogin}
            onChange={(e) => setEnableQuickLogin(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="min-w-0 text-sm text-gray-700">
            <span className="font-medium text-gray-900">{t('auth.quickConsent')}</span>
            <span className="mt-0.5 block text-xs text-gray-500">{t('auth.quickConsentHint')}</span>
          </span>
        </label>

        <div className="flex items-center justify-end text-sm">
          <Link
            id="auth-login-forgot"
            href="/forgot-password"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {t('auth.forgot')}
          </Link>
        </div>

        <button
          id="auth-login-submit"
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-lg border border-transparent bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              {t('auth.signingIn')}
            </div>
          ) : (
            t('common.login')
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {t('auth.noAccount')}{' '}
            <Link
              id="auth-login-register-link"
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth.registerNow')}
            </Link>
          </p>
        </div>
      </motion.form>

      <div id="auth-login-demo" className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-blue-800">{t('auth.demoTitle')}</h3>
        <div className="space-y-1 text-xs text-blue-700">
          <p>
            <strong>{t('role.adminShort')}:</strong> eduflow.admin / firstedu.eduflow
          </p>
          <p>
            <strong>{t('auth.demoStudent')}</strong> student@eduflow.com / 100002 / password123
          </p>
          <p>
            <strong>{t('auth.demoTeacher')}</strong> teacher@eduflow.com / 100001 / password123
          </p>
        </div>
      </div>
    </>
  )
}
