import type {
  AccountStatus,
  AppNotification,
  AttendanceRecord,
  ActivityLogItem,
  ActivityLogType,
  AttendanceStatus,
  ClassChatMessage,
  ClassChatRoom,
  ClassRoom,
  OnlineSession,
  ScheduleSlot,
  SessionMessage,
  SessionRecording,
  SessionUser,
  Submission,
  StudentClassProgress,
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
      role: 'student' | 'teacher'
      phone?: string
      recoveryEmail?: string
      school?: string
    }) =>
      request<{ pending?: boolean; message?: string; memberCode?: string; user: SessionUser }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    login: (body: { email: string; password: string; enableQuickLogin?: boolean }) =>
      request<{
        user: SessionUser
        quickLogin?: { tokenId: string; token: string; expiresAt: string }
      }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    quickLogin: (body: { token: string }) =>
      request<{ user: SessionUser }>('/api/auth/quick-login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    revokeQuickLogin: (body: { tokenId?: string; token?: string }) =>
      request<{ ok: boolean }>('/api/auth/quick-login/revoke', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ ok: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    forgotPasswordRequest: (body: {
      loginId: string
      channel: 'email' | 'phone'
      contact: string
    }) =>
      request<{
        ok: boolean
        message: string
        requestId: string | null
        maskedTarget: string | null
        devOtp?: string
      }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    forgotPasswordReset: (body: { requestId: string; code: string; newPassword: string }) =>
      request<{ ok: boolean; message: string }>('/api/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  activity: {
    list: (limit = 100) =>
      request<{ items: ActivityLogItem[] }>(`/api/activity?limit=${limit}`),
    log: (body: {
      type: ActivityLogType
      title: string
      message: string
      href?: string
      meta?: Record<string, unknown>
    }) =>
      request<{ item: ActivityLogItem | null }>('/api/activity', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  edu: {
    context: () =>
      request<{ classes: ClassRoom[]; tasks: Task[]; submissions: Submission[] }>('/api/edu/context'),
    createClass: (body: { title: string; description: string }) =>
      request<{ classroom: ClassRoom }>('/api/classes', { method: 'POST', body: JSON.stringify(body) }),
    updateClass: (classId: string, body: { title: string; description: string }) =>
      request<{ classroom: ClassRoom }>(`/api/classes/${classId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    cancelClass: (classId: string) =>
      request<{ classroom: ClassRoom; message: string }>(`/api/classes/${classId}`, {
        method: 'DELETE',
      }),
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
    scheduleOverview: () =>
      request<{
        slots: ScheduleSlot[]
        liveSessions: { id: string; classId: string }[]
        classes: { id: string; title: string }[]
      }>('/api/schedule/overview'),
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
    listClassChats: () => request<{ chats: ClassChatRoom[] }>('/api/chats'),
    getClassChat: (classId: string) =>
      request<{ chat: ClassChatRoom; messages: ClassChatMessage[] }>(`/api/classes/${classId}/chat`),
    postClassChatMessage: (classId: string, body: { content: string }) =>
      request<{ message: ClassChatMessage }>(`/api/classes/${classId}/chat`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    uploadSessionRecording: (classId: string, sessionId: string, form: FormData) =>
      request<{ recording: SessionRecording }>(
        `/api/classes/${classId}/sessions/${sessionId}/recordings`,
        { method: 'POST', body: form }
      ),
    getStudentProgress: (classId: string, studentId: string) =>
      request<{ progress: StudentClassProgress }>(
        `/api/classes/${classId}/students/${studentId}/progress`
      ),
    getTeachingPlan: (classId: string) =>
      request<{
        plan: {
          class: {
            id: string
            title: string
            teacherId: string
            teacherName: string
            termStart?: string
            termEnd?: string
          }
          items: {
            id: string
            classId: string
            sessionIndex: number
            title: string
            description: string
            plannedDate?: string
            status: 'planned' | 'done' | 'skipped'
            completedAt?: string
          }[]
          summary: {
            total: number
            done: number
            skipped: number
            planned: number
            overdue: number
            dueSoon: number
            behind: boolean
            progressRate: number
          }
        }
      }>(`/api/classes/${classId}/teaching-plan`),
    saveTeachingPlan: (
      classId: string,
      items: {
        sessionIndex: number
        title: string
        description?: string
        plannedDate?: string | null
      }[]
    ) =>
      request<{ plan: unknown }>(`/api/classes/${classId}/teaching-plan`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }),
    updateClassTerm: (classId: string, body: { termStart?: string | null; termEnd?: string | null }) =>
      request<{ term: { id: string; termStart?: string; termEnd?: string } }>(
        `/api/classes/${classId}/teaching-plan`,
        { method: 'PUT', body: JSON.stringify(body) }
      ),
    updatePlanItemStatus: (
      classId: string,
      body: { itemId: string; status: 'planned' | 'done' | 'skipped' }
    ) =>
      request<{ item: unknown }>(`/api/classes/${classId}/teaching-plan`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    listPendingSessionEvals: (classId: string) =>
      request<{
        pending: {
          sessionKey: string
          onlineSessionId: string
          title: string
          endedAt?: string
        }[]
      }>(`/api/classes/${classId}/session-eval`),
    getSessionEvalSummary: (classId: string) =>
      request<{
        summary: {
          average: number
          count: number
          items: {
            id: string
            sessionKey: string
            sessionTitle: string
            studentName: string
            rating: number
            comment: string
            createdAt: string
          }[]
        }
      }>(`/api/classes/${classId}/session-eval?view=summary`),
    submitSessionEval: (
      classId: string,
      body: {
        sessionKey: string
        onlineSessionId?: string
        rating: number
        comment?: string
      }
    ) =>
      request<{ eval: unknown }>(`/api/classes/${classId}/session-eval`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listCourseEvals: (classId: string) =>
      request<{
        enrollments: number
        evaluations: {
          id: string
          kind: 'midterm' | 'final'
          status: 'draft' | 'open' | 'closed'
          openAt?: string
          closeAt?: string
          responseCount: number
          averageTeachingQuality?: number
          submitted: boolean
          myResponse?: {
            teachingQuality: number
            contentClarity: number
            pacing: number
            comment: string
            createdAt: string
          }
        }[]
      }>(`/api/classes/${classId}/course-eval`),
    setCourseEvalStatus: (
      classId: string,
      body: { kind: 'midterm' | 'final'; status: 'draft' | 'open' | 'closed' }
    ) =>
      request<{ evaluation: unknown }>(`/api/classes/${classId}/course-eval`, {
        method: 'POST',
        body: JSON.stringify({ action: 'setStatus', ...body }),
      }),
    submitCourseEval: (
      classId: string,
      body: {
        evaluationId: string
        teachingQuality: number
        contentClarity: number
        pacing: number
        comment?: string
      }
    ) =>
      request<{ response: unknown }>(`/api/classes/${classId}/course-eval`, {
        method: 'POST',
        body: JSON.stringify({ action: 'respond', ...body }),
      }),
    listPracticeSets: (classId: string) =>
      request<{
        sets: {
          id: string
          classId: string
          title: string
          description: string
          source: string
          pomodoroMinutes: number
          questionCount: number
          attemptCount: number
          myAttempts?: number
          lastScore?: number
          lastTotal?: number
          dueCount?: number
          newCount?: number
          masteredCount?: number
        }[]
      }>(`/api/classes/${classId}/practice`),
    createPracticeSet: (
      classId: string,
      body: {
        title: string
        description?: string
        source?: string
        pomodoroMinutes?: number
        questions?: { prompt: string; explanation?: string; options: { text: string; isCorrect: boolean }[] }[]
      }
    ) => request<{ set: unknown }>(`/api/classes/${classId}/practice`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    getPracticeSet: (setId: string) =>
      request<{
        set: {
          id: string
          classId: string
          title: string
          description: string
          source: string
          pomodoroMinutes: number
          questions: {
            id: string
            prompt: string
            explanation?: string
            options: { id: string; text: string; isCorrect?: boolean }[]
          }[]
        }
      }>(`/api/practice/${setId}`),
    updatePracticeSet: (setId: string, body: unknown) =>
      request<{ set: unknown }>(`/api/practice/${setId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    deletePracticeSet: (setId: string) =>
      request<{ ok: boolean }>(`/api/practice/${setId}`, { method: 'DELETE' }),
    importPracticeFile: (setId: string, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<{ set: unknown }>(`/api/practice/${setId}`, { method: 'POST', body: form })
    },
    generatePractice: (setId: string, body: { topic: string; count?: number }) =>
      request<{ set: unknown }>(`/api/practice/${setId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'generate', ...body }),
      }),
    startPractice: (setId: string) =>
      request<{
        attempt: {
          id: string
          setId: string
          status: string
          total: number
          pomodoroMinutes: number
          startedAt: string
          title: string
          score?: number
          questions: {
            id: string
            prompt: string
            explanation?: string
            selectedOptionId?: string
            isCorrect?: boolean
            rating?: string
            options: { id: string; text: string; isCorrect?: boolean }[]
          }[]
        }
      }>(`/api/practice/${setId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'start' }),
      }),
    savePracticeAnswers: (
      setId: string,
      attemptId: string,
      answers: { questionId: string; optionId: string | null }[]
    ) =>
      request<{
        ok: boolean
        revealed?: {
          questionId: string
          isCorrect: boolean
          explanation?: string
          correctOptionId?: string
        }[]
      }>(`/api/practice/${setId}/attempts/${attemptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'save', answers }),
      }),
    ratePractice: (
      setId: string,
      attemptId: string,
      body: { questionId: string; optionId?: string | null; timeSpentMs?: number }
    ) =>
      request<{
        rating: string
        ratingLabel: string
        reason: string
        box: number
        nextLabel: string
        nextReviewAt: string
        isCorrect: boolean
        sessionComplete: boolean
        attempt: unknown
      }>(`/api/practice/${setId}/attempts/${attemptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'evaluate', ...body }),
      }),
    submitPractice: (
      setId: string,
      attemptId: string,
      body: { answers?: { questionId: string; optionId: string | null }[]; expired?: boolean }
    ) =>
      request<{ attempt: unknown }>(`/api/practice/${setId}/attempts/${attemptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'submit', ...body }),
      }),
    getPracticeStats: (setId: string) =>
      request<{
        stats: {
          title: string
          questionCount: number
          attemptCount: number
          averageScore: number
          boxes?: { 1: number; 2: number; 3: number; 4: number; 5: number }
          dueNow?: number
          students: {
            studentId: string
            fullName: string
            email: string
            attempts: number
            best: number
            last: number
            total: number
          }[]
          questions: {
            id: string
            prompt: string
            timesAnswered: number
            correct: number
            accuracy: number
          }[]
          recent: {
            id: string
            studentName: string
            score: number
            total: number
            durationSec: number
            status: string
            startedAt: string
          }[]
        }
      }>(`/api/practice/${setId}?view=stats`),
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

  admin: {
    overview: () =>
      request<{
        overview: {
          pending: number
          active: number
          restricted: number
          suspended: number
          teachers: number
          students: number
          classes: number
        }
      }>('/api/admin/overview'),
    workStats: () =>
      request<{
        stats: {
          student: {
            summary: {
              not_submitted: number
              submitted: number
              late: number
              graded: number
              total: number
            }
            items: {
              id: string
              kind: string
              title: string
              subtitle: string
              meta?: string
              statusKey?: string
              statusLabel?: string
              teacherId?: string
              studentId?: string
              classId?: string
            }[]
          }
          teacher: {
            summary: {
              pending_grade: number
              graded: number
              total_actionable: number
            }
            items: {
              id: string
              kind: string
              title: string
              subtitle: string
              meta?: string
              statusKey?: string
              statusLabel?: string
              teacherId?: string
              studentId?: string
              classId?: string
            }[]
          }
          teachersOverview: {
            teacherId: string
            fullName: string
            email: string
            classes: number
            tasks: number
            pendingGrade: number
            graded: number
            gradeRate: number
          }[]
          studentsOverview: {
            studentId: string
            fullName: string
            email: string
            classes: number
            total: number
            notSubmitted: number
            submitted: number
            late: number
            graded: number
            completionRate: number
          }[]
          byClass: {
            classId: string
            title: string
            teacherName: string
            students: number
            tasks: number
            submitRate: number
            gradeRate: number
            submitted: number
            pending: number
            graded: number
            totalSubs: number
          }[]
        }
      }>('/api/admin/work-stats'),
    listUsers: (params?: { role?: string; status?: string; q?: string }) => {
      const sp = new URLSearchParams()
      if (params?.role) sp.set('role', params.role)
      if (params?.status) sp.set('status', params.status)
      if (params?.q) sp.set('q', params.q)
      const qs = sp.toString()
      return request<{
        users: {
          id: string
          memberCode?: string
          email: string
          fullName: string
          role: UserRole
          accountStatus: AccountStatus
          statusNote?: string
          school?: string
          createdAt: string
        }[]
      }>(`/api/admin/users${qs ? `?${qs}` : ''}`)
    },
    updateUser: (
      userId: string,
      body: {
        action: 'approve' | 'setStatus' | 'resetPassword'
        status?: AccountStatus
        statusNote?: string
        newPassword?: string
      }
    ) =>
      request<{ user: unknown; temporaryPassword?: string }>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    importStudents: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<{
        created: { studentCode: string; fullName: string; email: string }[]
        skipped: { studentCode: string; reason: string }[]
        parseErrors: { line: number; message: string }[]
      }>('/api/admin/users/import', { method: 'POST', body: form })
    },
    listClasses: () =>
      request<{
        classes: AdminClassRow[]
      }>('/api/admin/classes'),
    listTeachers: () =>
      request<{ teachers: { id: string; fullName: string; email: string }[] }>(
        '/api/admin/classes?meta=teachers'
      ),
    listStudents: () =>
      request<{
        students: { id: string; fullName: string; email: string; accountStatus: AccountStatus }[]
      }>('/api/admin/classes?meta=students'),
    createClass: (body: { title: string; description: string; teacherId: string }) =>
      request<{ classroom: unknown }>('/api/admin/classes', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateClassRoster: (classId: string, studentIds: string[]) =>
      request<{ roster: unknown }>(`/api/admin/classes/${classId}/roster`, {
        method: 'PUT',
        body: JSON.stringify({ studentIds }),
      }),
    teachingProgress: () =>
      request<{
        progress: {
          summary: {
            classes: number
            withPlan: number
            behind: number
            noPlan: number
          }
          classes: {
            classId: string
            title: string
            classCode: string
            teacherId: string
            teacherName: string
            teacherEmail: string
            termStart?: string
            termEnd?: string
            total: number
            done: number
            skipped: number
            planned: number
            overdue: number
            behind: boolean
            progressRate: number
            hasPlan: boolean
          }[]
        }
      }>('/api/admin/teaching-progress'),
    remindTeacher: (body: { teacherId: string; classId: string; message?: string }) =>
      request<{ ok: boolean; message: string }>('/api/admin/teaching-progress', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    evalOverview: () =>
      request<{
        overview: {
          sessionEvals: {
            classId: string
            title: string
            teacherName: string
            average: number
            count: number
          }[]
          courseEvals: {
            id: string
            classId: string
            title: string
            teacherName: string
            kind: 'midterm' | 'final'
            status: string
            responseCount: number
            enrollmentCount: number
            averageTeachingQuality: number
          }[]
        }
      }>('/api/admin/eval-overview'),
  },
}

export interface AdminClassRow {
  id: string
  title: string
  description: string
  classCode: string
  teacherId: string
  teacherName: string
  teacherEmail: string
  studentCount: number
  createdAt: string
  students: { id: string; name: string; email: string; accountStatus: AccountStatus }[]
}

export { ApiError }
