export type UserRole = 'student' | 'teacher' | 'admin'

export type AccountStatus = 'pending' | 'active' | 'restricted' | 'suspended'

export interface User {
  id: string
  email: string
  password: string
  fullName: string
  role: UserRole
  accountStatus: AccountStatus
  statusNote?: string
  approvedAt?: string
  phone?: string
  school?: string
  memberCode?: string
}

export type SessionUser = Omit<User, 'password'> & {
  accountStatus: AccountStatus
  statusNote?: string
}

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

export interface ClassChatMember {
  id: string
  name: string
  memberCode?: string
  role: 'student' | 'teacher'
}

export interface ClassChatRoom {
  id: string
  classId: string
  name: string
  classTitle: string
  teacherId: string
  teacherName: string
  memberCount: number
  messageCount: number
  members: ClassChatMember[]
  createdAt: string
}

export interface ClassChatMessage {
  id: string
  chatId: string
  /** Sender User.id (student/teacher account id) */
  userId: string
  userName: string
  memberCode?: string
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

export type ClassStatus = 'draft' | 'published' | 'archived' | 'cancelled'

export interface ClassRoom {
  id: string
  title: string
  description: string
  classCode: string
  teacherId: string
  status: ClassStatus
  students: ClassStudent[]
  createdAt: string
}

export type ActivityLogType =
  | 'theme_change'
  | 'language_change'
  | 'password_change'
  | 'class_join'
  | 'class_create'
  | 'class_update'
  | 'class_publish'
  | 'class_archive'
  | 'class_cancel'
  | 'assignment_submit'
  | 'other'

export interface ActivityLogItem {
  id: string
  userId: string
  type: ActivityLogType
  title: string
  message: string
  href?: string
  meta?: Record<string, unknown>
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

export interface StudentClassProgress {
  student: {
    id: string
    fullName: string
    email: string
    memberCode?: string
    phone?: string
  }
  classroom: {
    id: string
    title: string
    classCode: string
  }
  joinedAt?: string
  summary: {
    totalTasks: number
    submitted: number
    notSubmitted: number
    late: number
    graded: number
    completionRate: number
    averageScore: number | null
    attendance: {
      present: number
      late: number
      absent: number
      total: number
      presentRate: number
    }
  }
  tasks: {
    task: Task
    submission: Submission | null
  }[]
  attendanceHistory: {
    id: string
    sessionDate: string
    status: AttendanceStatus
    period: number
    subject: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }[]
}

export type NotificationType =
  | 'new_assignment'
  | 'deadline_reminder'
  | 'feedback'
  | 'submission_received'
  | 'online_class'
  | 'admin_reminder'
  | 'session_eval'
  | 'course_eval'
  | 'practice_set'

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
