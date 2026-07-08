'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import AccountStatusBanner from '@/components/layout/AccountStatusBanner'

export default function TeacherAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrate = useAuthStore((s) => s.hydrate)
  const currentUser = useAuthStore((s) => s.currentUser)
  const isReady = useAuthStore((s) => s.isReady)
  const refreshEdu = useEduStore((s) => s.refresh)
  const refreshNotifications = useNotificationStore((s) => s.refresh)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      await hydrate()
      const user = useAuthStore.getState().currentUser
      if (!user || user.role !== 'teacher') {
        router.replace('/login')
        return
      }
      await Promise.all([refreshEdu(), refreshNotifications()])
      if (!cancelled) setReady(true)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [hydrate, refreshEdu, refreshNotifications, router])

  if (!isReady || !ready || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <>
      <AccountStatusBanner />
      {children}
    </>
  )
}
