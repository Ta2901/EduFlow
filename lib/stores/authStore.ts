import { create } from 'zustand'
import { api, ApiError } from '../api/client'
import type { SessionUser, UserRole } from '../types'
import { useEduStore } from './eduStore'
import { useNotificationStore } from './notificationStore'
import { useScheduleOverviewStore } from './scheduleOverviewStore'

interface RegisterInput {
  fullName: string
  email: string
  password: string
  role: 'student' | 'teacher'
  phone?: string
  recoveryEmail?: string
  school?: string
}

interface AuthState {
  currentUser: SessionUser | null
  isReady: boolean
  hydrate: () => Promise<void>
  register: (input: RegisterInput) => Promise<{
    ok: boolean
    pending?: boolean
    message?: string
    memberCode?: string
    error?: string
  }>
  login: (
    email: string,
    password: string,
    options?: { enableQuickLogin?: boolean }
  ) => Promise<{
    ok: boolean
    error?: string
    quickLogin?: { tokenId: string; token: string; expiresAt: string }
  }>
  quickLogin: (token: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isReady: false,

  hydrate: async () => {
    try {
      const { user } = await api.auth.me()
      set({ currentUser: user, isReady: true })
    } catch {
      set({ currentUser: null, isReady: true })
    }
  },

  register: async (input) => {
    try {
      const data = await api.auth.register(input)
      if (data.pending) {
        return {
          ok: true,
          pending: true,
          message: data.message,
          memberCode: data.memberCode,
        }
      }
      set({ currentUser: data.user })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : 'Đăng ký thất bại' }
    }
  },

  login: async (email, password, options) => {
    try {
      const data = await api.auth.login({
        email,
        password,
        enableQuickLogin: options?.enableQuickLogin,
      })
      set({ currentUser: data.user })
      return { ok: true, quickLogin: data.quickLogin }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : 'Đăng nhập thất bại' }
    }
  },

  quickLogin: async (token) => {
    try {
      const { user } = await api.auth.quickLogin({ token })
      set({ currentUser: user })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : 'Đăng nhập nhanh thất bại' }
    }
  },

  logout: async () => {
    try {
      await api.auth.logout()
    } finally {
      set({ currentUser: null })
      useEduStore.getState().reset()
      useNotificationStore.getState().reset()
      useScheduleOverviewStore.getState().reset()
    }
  },
}))
