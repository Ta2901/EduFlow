'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import type { NotificationType } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

const TYPE_LABELS: Record<NotificationType, string> = {
  new_assignment: 'Bài tập mới',
  deadline_reminder: 'Hạn nộp',
  feedback: 'Điểm & nhận xét',
  submission_received: 'Bài đã nộp',
  online_class: 'Lớp học online',
  admin_reminder: 'Nhắc từ Admin',
  session_eval: 'Đánh giá buổi học',
  course_eval: 'Đánh giá khoá học',
}

interface NotificationBellProps {
  userId: string
  id?: string
}

export default function NotificationBell({
  userId,
  id = 'notification-bell',
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const notifications = useNotificationStore((s) => s.getForUser(userId))
  const unreadCount = useNotificationStore((s) => s.getUnreadCount(userId))
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const refresh = useNotificationStore((s) => s.refresh)

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div id={id} className="relative" ref={panelRef}>
      <button
        id={`${id}-toggle`}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            id={`${id}-badge`}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={`${id}-panel`}
          className="fixed right-3 top-14 z-[100] w-[min(calc(100vw-1.5rem),360px)] rounded-xl border bg-white shadow-lg sm:absolute sm:right-0 sm:top-auto sm:mt-2"
        >
          <div id={`${id}-panel-header`} className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                id={`${id}-mark-all-read`}
                type="button"
                onClick={() => markAllAsRead(userId)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          <ul id={`${id}-list`} className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li id={`${id}-empty`} className="px-4 py-8 text-center text-sm text-gray-500">
                Chưa có thông báo
              </li>
            ) : (
              notifications.slice(0, 30).map((n) => (
                <li key={n.id} id={`${id}-item-${n.id}`} className="border-b last:border-b-0">
                  {n.href ? (
                    <Link
                      id={`${id}-link-${n.id}`}
                      href={n.href}
                      onClick={() => {
                        markAsRead(n.id)
                        setOpen(false)
                      }}
                      className={`block px-4 py-3 hover:bg-gray-50 ${!n.read ? 'bg-primary-50/50' : ''}`}
                    >
                      <NotificationItem notification={n} />
                    </Link>
                  ) : (
                    <button
                      id={`${id}-btn-${n.id}`}
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${!n.read ? 'bg-primary-50/50' : ''}`}
                    >
                      <NotificationItem notification={n} />
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification: n,
}: {
  notification: {
    type: NotificationType
    title: string
    message: string
    read: boolean
    createdAt: string
  }
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-primary-600">{TYPE_LABELS[n.type]}</p>
        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
      </div>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{n.title}</p>
      <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
      <p className="mt-1 text-[10px] text-gray-400">{formatDateTime(n.createdAt)}</p>
    </>
  )
}
