'use client'

import { useAuthStore } from '@/lib/stores/authStore'
import { useDeadlineReminders } from '@/hooks/useDeadlineReminders'

export default function StudentNotificationBootstrap() {
  const currentUser = useAuthStore((s) => s.currentUser)
  if (!currentUser || currentUser.role !== 'student') return null

  useDeadlineReminders(currentUser.id, currentUser.email)
  return null
}
