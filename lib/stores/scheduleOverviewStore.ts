import { create } from 'zustand'
import { api } from '../api/client'
import type { ScheduleSlot } from '../types'

type SlotRow = ScheduleSlot & { classTitle: string }

interface ScheduleOverviewState {
  slots: SlotRow[]
  liveByClass: Record<string, string>
  classIdsKey: string
  isLoaded: boolean
  isLoading: boolean
  load: (classIds: string[], opts?: { force?: boolean }) => Promise<void>
}

export const useScheduleOverviewStore = create<ScheduleOverviewState>((set, get) => ({
  slots: [],
  liveByClass: {},
  classIdsKey: '',
  isLoaded: false,
  isLoading: false,

  load: async (classIds, opts) => {
    const key = [...classIds].sort().join(',')
    const state = get()
    if (state.isLoading && state.classIdsKey === key && !opts?.force) return
    if (state.isLoaded && state.classIdsKey === key && !opts?.force) return

    if (classIds.length === 0) {
      set({ slots: [], liveByClass: {}, classIdsKey: '', isLoaded: true, isLoading: false })
      return
    }

    set({ isLoading: true, classIdsKey: key })
    try {
      const data = await api.edu.scheduleOverview()
      const titleById = Object.fromEntries(data.classes.map((c) => [c.id, c.title]))
      const liveByClass: Record<string, string> = {}
      for (const s of data.liveSessions) {
        liveByClass[s.classId] = s.id
      }
      set({
        slots: data.slots.map((s) => ({
          ...s,
          classTitle: titleById[s.classId] || s.subject,
        })),
        liveByClass,
        classIdsKey: key,
        isLoaded: true,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false, isLoaded: true })
    }
  },
}))
