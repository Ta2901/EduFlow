'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrate = useAuthStore((s) => s.hydrate)
  const currentUser = useAuthStore((s) => s.currentUser)
  const isReady = useAuthStore((s) => s.isReady)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      await hydrate()
      const user = useAuthStore.getState().currentUser
      if (!user || user.role !== 'admin') {
        router.replace('/login')
        return
      }
      if (!cancelled) setReady(true)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [hydrate, router])

  if (!isReady || !ready || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
      </div>
    )
  }

  return <>{children}</>
}
