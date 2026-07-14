'use client'

import { useEffect, useRef } from 'react'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate } from '@/lib/format'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function useDeadlineReminders(userId: string, studentEmail: string) {
  const classes = useEduStore((s) => s.classes)
  const tasks = useEduStore((s) => s.tasks)
  const submissions = useEduStore((s) => s.submissions)
  const isLoaded = useEduStore((s) => s.isLoaded)
  const ranKey = useRef('')

  useEffect(() => {
    if (!isLoaded) return

    const email = studentEmail.toLowerCase()
    const enrolledClassIds = new Set(
      classes
        .filter(
          (c) =>
            c.students.length === 0 ||
            c.students.some((s) => s.id === userId || s.email.toLowerCase() === email)
        )
        .map((c) => c.id)
    )

    const now = Date.now()
    const payload: {
      type: string
      title: string
      message: string
      href: string
      dedupeKey: string
    }[] = []

    for (const task of tasks) {
      if (!enrolledClassIds.has(task.classId)) continue
      const sub = submissions.find((s) => s.taskId === task.id && s.studentId === userId)
      if (!sub || sub.status !== 'not_submitted') continue

      const dueEnd = new Date(task.dueDate)
      dueEnd.setHours(23, 59, 59, 999)
      const msUntilDue = dueEnd.getTime() - now
      const isOverdue = msUntilDue < 0
      const dueWithinTwoDays = msUntilDue >= 0 && msUntilDue <= 2 * MS_PER_DAY
      if (!isOverdue && !dueWithinTwoDays) continue

      payload.push({
        type: 'deadline_reminder',
        title: isOverdue ? 'Quá hạn nộp bài' : 'Nhắc hạn nộp bài',
        message: `Bài 「${task.title}」 ${isOverdue ? 'đã quá hạn' : 'sắp đến hạn'} (${formatDate(task.dueDate)})`,
        href: `/student/assignments/${task.id}`,
        dedupeKey: `deadline-${task.id}-${userId}`,
      })
    }

    const key = payload.map((p) => p.dedupeKey).sort().join('|')
    if (!payload.length || key === ranKey.current) return
    ranKey.current = key

    // Fire in parallel without blocking UI; server dedupes by key
    void Promise.all(
      payload.map((body) =>
        fetch('/api/notifications', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).catch(() => null)
      )
    )
  }, [userId, studentEmail, classes, tasks, submissions, isLoaded])
}
