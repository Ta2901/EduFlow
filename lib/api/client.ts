import type {
  AppNotification,
  AttendanceRecord,
  AttendanceStatus,
  ClassRoom,
  OnlineSession,
  ScheduleSlot,
  SessionMessage,
  SessionRecording,
  SessionUser,
  Submission,
  Task,
  UserRole,
} from '../types'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.error || 'Yêu cầu thất bại', res.status)
  }
  return data as T
}

export const api = {
  auth: {
    me: () => request<{ user: SessionUser | null }>('/api/auth/me'),
    register: (body: {
      fullName: string
      email: string
      password: string
      role: UserRole
      phone?: string
      school?: string
    }) => request<{ user: SessionUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{ user: SessionUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  },

  edu: {
    context: () =>
      request<{ classes: ClassRoom[]; tasks: Task[]; submissions: Submission[] }>('/api/edu/context'),
    createClass: (body: { title: string; description: string }) =>
      request<{ classroom: ClassRoom }>('/api/classes', { method: 'POST', body: JSON.stringify(body) }),
    joinClass: (code: string) =>
      request<{ classId: string; classroom: ClassRoom }>('/api/classes/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    createTask: (classId: string, form: FormData) =>
      request<{ task: Task }>(`/api/classes/${classId}/tasks`, { method: 'POST', body: form }),
    submitWork: (taskId: string, form: FormData) =>
      request<{ submission: Submission }>(`/api/tasks/${taskId}/submit`, { method: 'POST', body: form }),
    gradeSubmission: (submissionId: string, body: { grade: number; maxGrade: number; feedback: string }) =>
      request<{ submission: Submission }>(`/api/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    listSchedule: (classId: string) =>
      request<{ slots: ScheduleSlot[] }>(`/api/classes/${classId}/schedule`),
    createScheduleSlot: (
      classId: string,
      body: {
        dayOfWeek: number
        period: number
        subject: string
        startTime: string
        endTime: string
        room?: string
      }
    ) =>
      request<{ slot: ScheduleSlot }>(`/api/classes/${classId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    deleteScheduleSlot: (classId: string, slotId: string) =>
      request<{ ok: boolean }>(`/api/classes/${classId}/schedule?slotId=${encodeURIComponent(slotId)}`, {
        method: 'DELETE',
      }),
    getAttendance: (classId: string, slotId: string, date: string) =>
      request<{ records: AttendanceRecord[] }>(
        `/api/classes/${classId}/attendance?slotId=${encodeURIComponent(slotId)}&date=${encodeURIComponent(date)}`
      ),
    saveAttendance: (
      classId: string,
      body: {
        scheduleSlotId: string
        sessionDate: string
        records: { studentId: string; status: AttendanceStatus }[]
      }
    ) =>
      request<{ records: AttendanceRecord[] }>(`/api/classes/${classId}/attendance`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    getAttendanceHistory: (classId: string) =>
      request<{
        history: {
          id: string
          sessionDate: string
          status: AttendanceStatus
          period: number
          subject: string
          dayOfWeek: number
          startTime: string
          endTime: string
        }[]
      }>(`/api/classes/${classId}/attendance?studentHistory=1`),
    listOnlineSessions: (classId: string) =>
      request<{
        sessions: OnlineSession[]
        recordings: (SessionRecording & { sessionTitle: string })[]
      }>(`/api/classes/${classId}/sessions`),
    createOnlineSession: (
      classId: string,
      body: { title: string; scheduleSlotId?: string }
    ) =>
      request<{ session: OnlineSession }>(`/api/classes/${classId}/sessions`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateOnlineSession: (classId: string, sessionId: string, action: 'start' | 'end') =>
      request<{ session: OnlineSession }>(`/api/classes/${classId}/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),
    getOnlineSession: (sessionId: string) =>
      request<{ session: OnlineSession }>(`/api/online/${sessionId}`),
    listSessionMessages: (classId: string, sessionId: string) =>
      request<{ messages: SessionMessage[] }>(
        `/api/classes/${classId}/sessions/${sessionId}/messages`
      ),
    postSessionMessage: (classId: string, sessionId: string, body: { content: string; userName: string }) =>
      request<{ message: SessionMessage }>(`/api/classes/${classId}/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    uploadSessionRecording: (classId: string, sessionId: string, form: FormData) =>
      request<{ recording: SessionRecording }>(
        `/api/classes/${classId}/sessions/${sessionId}/recordings`,
        { method: 'POST', body: form }
      ),
  },

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ id: string; name: string; size: number; type: string; url: string }>(
      '/api/upload',
      { method: 'POST', body: form }
    )
  },

  notifications: {
    list: () => request<{ notifications: AppNotification[] }>('/api/notifications'),
    markRead: (id: string) =>
      request<{ ok: boolean }>('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
    markAllRead: () =>
      request<{ ok: boolean }>('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      }),
  },
}

export { ApiError }
