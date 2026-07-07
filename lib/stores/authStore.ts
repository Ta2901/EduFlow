import { create } from 'zustand'
import { api, ApiError } from '../api/client'
import type { SessionUser, UserRole } from '../types'

interface RegisterInput {
  fullName: string
  email: string
  password: string
  role: UserRole
  phone?: string
  school?: string
}

interface AuthState {
  currentUser: SessionUser | null
  isReady: boolean
  hydrate: () => Promise<void>
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
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
      const { user } = await api.auth.register(input)
      set({ currentUser: user })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : 'Đăng ký thất bại' }
    }
  },

  login: async (email, password) => {
    try {
      const { user } = await api.auth.login({ email, password })
      set({ currentUser: user })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : 'Đăng nhập thất bại' }
    }
  },

  logout: async () => {
    try {
      await api.auth.logout()
    } finally {
      set({ currentUser: null })
    }
  },
}))
