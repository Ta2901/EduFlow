'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'

export default function OnlineAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrate = useAuthStore((s) => s.hydrate)
  const currentUser = useAuthStore((s) => s.currentUser)
  const isReady = useAuthStore((s) => s.isReady)
  const refreshEdu = useEduStore((s) => s.refresh)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      await hydrate()
      const user = useAuthStore.getState().currentUser
      if (!user) {
        router.replace('/login')
        return
      }
      await refreshEdu()
      if (!cancelled) setReady(true)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [hydrate, refreshEdu, router])

  if (!isReady || !ready || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
      </div>
    )
  }

  return <>{children}</>
}
