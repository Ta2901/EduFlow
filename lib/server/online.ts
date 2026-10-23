import { classWritesBlocked } from '../classStatus'
import { normalizeMeetingUrl } from '../meetingUrl'
import { notifySessionEvalOpen } from './evaluations'
import { prisma } from '../prisma'
import { generateUniqueClassCode } from '../utils/generateClassCode'
import type { OnlineSessionStatus, SessionMessage, SessionRecording, UserRole } from '../types'
import type { SessionPayload } from './session'
import { notifyStudentsOnlineSession } from './notifications'

export interface OnlineSessionDto {
  id: string
  classId: string
  scheduleSlotId?: string
  title: string
  roomCode: string
  meetingUrl?: string
  status: OnlineSessionStatus
  teacherId: string
  scheduledAt?: string
  startedAt?: string
  endedAt?: string
  createdAt: string
}

function mapSession(row: {
  id: string
  classId: string
  scheduleSlotId: string | null
  title: string
  roomCode: string
  meetingUrl: string | null
  status: string
  teacherId: string
  scheduledAt: Date | null
  startedAt: Date | null
  endedAt: Date | null
  createdAt: Date
}): OnlineSessionDto {
  return {
    id: row.id,
    classId: row.classId,
    scheduleSlotId: row.scheduleSlotId ?? undefined,
    title: row.title,
    roomCode: row.roomCode,
    meetingUrl: row.meetingUrl ?? undefined,
    status: row.status as OnlineSessionStatus,
    teacherId: row.teacherId,
    scheduledAt: row.scheduledAt?.toISOString(),
    startedAt: row.startedAt?.toISOString(),
    endedAt: row.endedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

function parseScheduledAt(raw?: string | null): Date | null {
  if (raw == null || !String(raw).trim()) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) throw new Error('Ngày giờ bắt đầu tiết học không hợp lệ')
  return d
}

function mapMessage(row: {
  id: string
  sessionId: string
  userId: string
  userName: string
  role: string
  content: string
  createdAt: Date
}): SessionMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    userName: row.userName,
    role: row.role as UserRole,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }
}

function mapRecording(row: {
  id: string
  sessionId: string
  title: string
  fileUrl: string
  fileSize: number
  duration: number | null
  uploadedBy: string
  createdAt: Date
}): SessionRecording {
  return {
    id: row.id,
    sessionId: row.sessionId,
    title: row.title,
    fileUrl: row.fileUrl,
    fileSize: row.fileSize,
    duration: row.duration ?? undefined,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
  }
}

async function assertClassMember(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: { select: { studentId: true } } },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')

  const isTeacher = session.role === 'teacher' && classroom.teacherId === session.userId
  const isStudent = classroom.enrollments.some((e) => e.studentId === session.userId)
  if (!isTeacher && !isStudent) throw new Error('Bạn chưa tham gia lớp này')

  return { classroom, isTeacher }
}

async function assertSessionAccess(sessionId: string, userSession: SessionPayload) {
  const online = await prisma.onlineSession.findUnique({
    where: { id: sessionId },
    include: {
      class: { include: { enrollments: { select: { studentId: true } } } },
    },
  })
  if (!online) throw new Error('Không tìm thấy buổi học online')

  const isTeacher = userSession.role === 'teacher' && online.teacherId === userSession.userId
  const isStudent = online.class.enrollments.some((e) => e.studentId === userSession.userId)
  if (!isTeacher && !isStudent) throw new Error('Không có quyền truy cập buổi học')

  return { online, isTeacher }
}

async function assertSessionInClass(
  sessionId: string,
  classId: string,
  userSession: SessionPayload
) {
  const result = await assertSessionAccess(sessionId, userSession)
  if (result.online.classId !== classId) {
    throw new Error('Buổi học không thuộc lớp này')
  }
  return result
}

export async function listOnlineSessions(classId: string, session: SessionPayload) {
  await assertClassMember(classId, session)
  const rows = await prisma.onlineSession.findMany({
    where: { classId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapSession)
}

export async function createOnlineSession(
  classId: string,
  teacherId: string,
  input: { title: string; scheduleSlotId?: string; meetingUrl?: string; scheduledAt?: string }
) {
  const classroom = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: { enrollments: true },
  })
  if (!classroom) throw new Error('Không có quyền')
  const writeBlocked = classWritesBlocked(classroom.status)
  if (writeBlocked) throw new Error(writeBlocked)

  if (!input.title.trim()) throw new Error('Vui lòng nhập tên buổi học')
  const meetingUrl = normalizeMeetingUrl(input.meetingUrl ?? '')
  const scheduledAt = parseScheduledAt(input.scheduledAt)

  if (input.scheduleSlotId) {
    const slot = await prisma.scheduleSlot.findFirst({
      where: { id: input.scheduleSlotId, classId },
    })
    if (!slot) throw new Error('Không tìm thấy tiết học')
  }

  const existingCodes = (await prisma.onlineSession.findMany({ select: { roomCode: true } })).map(
    (s) => s.roomCode
  )

  const row = await prisma.onlineSession.create({
    data: {
      classId,
      scheduleSlotId: input.scheduleSlotId || null,
      title: input.title.trim(),
      roomCode: generateUniqueClassCode(existingCodes),
      meetingUrl,
      scheduledAt,
      teacherId,
      status: 'scheduled',
    },
  })

  return mapSession(row)
}

export async function updateOnlineSessionDetails(
  sessionId: string,
  classId: string,
  teacherId: string,
  input: { title?: string; meetingUrl?: string; scheduledAt?: string | null }
) {
  const classroom = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    select: { status: true },
  })
  if (!classroom) throw new Error('Không có quyền')
  const writeBlocked = classWritesBlocked(classroom.status)
  if (writeBlocked) throw new Error(writeBlocked)

  const online = await prisma.onlineSession.findFirst({
    where: { id: sessionId, classId, teacherId },
  })
  if (!online) throw new Error('Không tìm thấy buổi học')

  const data: { title?: string; meetingUrl?: string | null; scheduledAt?: Date | null } = {}
  if (input.title !== undefined) {
    const title = input.title.trim()
    if (!title) throw new Error('Vui lòng nhập tên buổi học')
    data.title = title
  }
  if (input.meetingUrl !== undefined) {
    data.meetingUrl = normalizeMeetingUrl(input.meetingUrl ?? '')
  }
  if (input.scheduledAt !== undefined) {
    data.scheduledAt = parseScheduledAt(input.scheduledAt)
  }

  const row = await prisma.onlineSession.update({
    where: { id: sessionId },
    data,
  })
  return mapSession(row)
}

export async function startOnlineSession(sessionId: string, classId: string, teacherId: string) {
  const online = await prisma.onlineSession.findFirst({
    where: { id: sessionId, classId, teacherId },
    include: { class: { include: { enrollments: true } } },
  })
  if (!online) throw new Error('Không có quyền')
  if (online.status === 'ended') throw new Error('Buổi học đã kết thúc')

  const row = await prisma.onlineSession.update({
    where: { id: sessionId },
    data: { status: 'live', startedAt: online.startedAt ?? new Date() },
  })

  const studentIds = online.class.enrollments.map((e) => e.studentId)
  if (studentIds.length > 0) {
    await notifyStudentsOnlineSession(
      studentIds,
      online.title,
      online.class.title,
      online.classId,
      sessionId
    )
  }

  return mapSession(row)
}

export async function endOnlineSession(sessionId: string, classId: string, teacherId: string) {
  const online = await prisma.onlineSession.findFirst({
    where: { id: sessionId, classId, teacherId },
  })
  if (!online) throw new Error('Không có quyền')

  const row = await prisma.onlineSession.update({
    where: { id: sessionId },
    data: { status: 'ended', endedAt: new Date() },
  })

  void notifySessionEvalOpen(sessionId).catch(() => {})

  return mapSession(row)
}

export async function getOnlineSession(sessionId: string, userSession: SessionPayload) {
  const { online } = await assertSessionAccess(sessionId, userSession)
  return mapSession(online)
}

export async function listSessionMessages(
  classId: string,
  sessionId: string,
  userSession: SessionPayload
) {
  await assertSessionInClass(sessionId, classId, userSession)
  const rows = await prisma.sessionMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })
  return rows.map(mapMessage)
}

export async function postSessionMessage(
  classId: string,
  sessionId: string,
  userSession: SessionPayload,
  userName: string,
  content: string
) {
  const { online } = await assertSessionInClass(sessionId, classId, userSession)
  if (online.status === 'ended') throw new Error('Buổi học đã kết thúc')
  if (!content.trim()) throw new Error('Nội dung trống')

  const row = await prisma.sessionMessage.create({
    data: {
      sessionId,
      userId: userSession.userId,
      userName,
      role: userSession.role,
      content: content.trim(),
    },
  })
  return mapMessage(row)
}

export async function listSessionRecordings(
  classId: string,
  sessionId: string,
  userSession: SessionPayload
) {
  await assertSessionInClass(sessionId, classId, userSession)
  const rows = await prisma.sessionRecording.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapRecording)
}

export async function saveSessionRecording(
  classId: string,
  sessionId: string,
  teacherId: string,
  input: { title: string; fileUrl: string; fileSize: number; duration?: number }
) {
  const online = await prisma.onlineSession.findFirst({
    where: { id: sessionId, classId, teacherId },
  })
  if (!online) throw new Error('Không có quyền')

  const row = await prisma.sessionRecording.create({
    data: {
      sessionId,
      title: input.title.trim() || 'Bản ghi bài giảng',
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      duration: input.duration ?? null,
      uploadedBy: teacherId,
    },
  })
  return mapRecording(row)
}

export async function listClassRecordings(classId: string, session: SessionPayload) {
  await assertClassMember(classId, session)
  const rows = await prisma.sessionRecording.findMany({
    where: { session: { classId } },
    orderBy: { createdAt: 'desc' },
    include: { session: { select: { title: true } } },
  })
  return rows.map((r) => ({
    ...mapRecording(r),
    sessionTitle: r.session.title,
  }))
}
