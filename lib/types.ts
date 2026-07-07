export type UserRole = 'student' | 'teacher'

export interface User {
  id: string
  email: string
  password: string
  fullName: string
  role: UserRole
  phone?: string
  school?: string
}

export type SessionUser = Omit<User, 'password'>

export interface ClassStudent {
  id: string
  name: string
  email: string
}

export type AttendanceStatus = 'present' | 'late' | 'absent'

export interface ScheduleSlot {
  id: string
  classId: string
  dayOfWeek: number
  period: number
  subject: string
  startTime: string
  endTime: string
  room: string
}

export interface AttendanceRecord {
  id: string
  classId: string
  scheduleSlotId: string
  studentId: string
  sessionDate: string
  status: AttendanceStatus
}

export type OnlineSessionStatus = 'scheduled' | 'live' | 'ended'

export interface OnlineSession {
  id: string
  classId: string
  scheduleSlotId?: string
  title: string
  roomCode: string
  status: OnlineSessionStatus
  teacherId: string
  startedAt?: string
  endedAt?: string
  createdAt: string
}

export interface SessionMessage {
  id: string
  sessionId: string
  userId: string
  userName: string
  role: UserRole
  content: string
  createdAt: string
}

export interface SessionRecording {
  id: string
  sessionId: string
  title: string
  fileUrl: string
  fileSize: number
  duration?: number
  uploadedBy: string
  createdAt: string
}

export interface ClassRoom {
  id: string
  title: string
  description: string
  classCode: string
  teacherId: string
  students: ClassStudent[]
  createdAt: string
}

export interface TaskAttachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

export interface Task {
  id: string
  classId: string
  title: string
  description: string
  dueDate: string
  attachments: TaskAttachment[]
  teacherId: string
  createdAt: string
}

export type SubmissionStatus = 'not_submitted' | 'submitted' | 'late'

export interface SubmissionFile {
  id: string
  name: string
  size: number
  url?: string
}

export interface Submission {
  id: string
  taskId: string
  studentId: string
  studentName: string
  studentEmail: string
  status: SubmissionStatus
  submittedAt?: string
  content?: string
  submittedFiles?: SubmissionFile[]
  grade?: number
  maxGrade?: number
  feedback?: string
  gradedAt?: string
}

export type NotificationType =
  | 'new_assignment'
  | 'deadline_reminder'
  | 'feedback'
  | 'submission_received'
  | 'online_class'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  href?: string
  read: boolean
  createdAt: string
  dedupeKey?: string
}
