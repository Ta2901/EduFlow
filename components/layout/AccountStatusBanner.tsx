'use client'

import { useI18n } from '@/components/i18n/LanguageProvider'
import { useAuthStore } from '@/lib/stores/authStore'

export default function AccountStatusBanner() {
  const { t } = useI18n()
  const user = useAuthStore((s) => s.currentUser)
  if (!user || user.accountStatus !== 'restricted') return null

  return (
    <div
      id="account-status-banner"
      className="border-b border-orange-200 bg-orange-50 px-4 py-3 text-center text-sm text-orange-900"
    >
      {t('account.restricted')}
      {user.statusNote ? ` ${t('account.note', { note: user.statusNote })}` : ''}
    </div>
  )
}
