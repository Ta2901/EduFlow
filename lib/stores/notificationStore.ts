import { create } from 'zustand'
import { api } from '../api/client'
import type { AppNotification } from '../types'

interface NotificationState {
  notifications: AppNotification[]
  isLoaded: boolean
  refresh: () => Promise<void>
  getForUser: (userId: string) => AppNotification[]
  getUnreadCount: (userId: string) => number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoaded: false,

  refresh: async () => {
    const { notifications } = await api.notifications.list()
    set({ notifications, isLoaded: true })
  },

  getForUser: (userId) =>
    get()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getUnreadCount: (userId) =>
    get().notifications.filter((n) => n.userId === userId && !n.read).length,

  markAsRead: async (id) => {
    await api.notifications.markRead(id)
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllAsRead: async (userId) => {
    await api.notifications.markAllRead()
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    }))
  },
}))
