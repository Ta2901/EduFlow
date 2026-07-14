import { prisma } from '../prisma'
import type { AttendanceStatus, ScheduleSlot } from '../types'
import type { SessionPayload } from './session'

function mapSlot(row: {
  id: string
  classId: string
  dayOfWeek: number
  period: number
  subject: string
  startTime: string
  endTime: string
  room: string
}): ScheduleSlot {
  return {
    id: row.id,
    classId: row.classId,
    dayOfWeek: row.dayOfWeek,
    period: row.period,
    subject: row.subject,
    startTime: row.startTime,
    endTime: row.endTime,
    room: row.room,
  }
}

async function assertClassAccess(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: { select: { studentId: true } } },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')

  if (session.role === 'teacher') {
    if (classroom.teacherId !== session.userId) throw new Error('Không có quyền')
    return { classroom, isTeacher: true as const }
  }

  const enrolled = classroom.enrollments.some((e) => e.studentId === session.userId)
  if (!enrolled) throw new Error('Bạn chưa tham gia lớp này')
  return { classroom, isTeacher: false as const }
}

export async function listScheduleSlots(classId: string, session: SessionPayload) {
  await assertClassAccess(classId, session)
  const rows = await prisma.scheduleSlot.findMany({
    where: { classId },
    orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
  })
  return rows.map(mapSlot)
}

/** One round-trip for dashboard: all slots + live online sessions for accessible classes. */
export async function listScheduleOverview(session: SessionPayload) {
  let classes: { id: string; title: string }[] = []

  if (session.role === 'teacher') {
    classes = await prisma.class.findMany({
      where: { teacherId: session.userId, status: { not: 'cancelled' } },
      select: { id: true, title: true },
    })
  } else if (session.role === 'student') {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: session.userId, class: { status: { not: 'cancelled' } } },
      select: { class: { select: { id: true, title: true } } },
    })
    classes = enrollments.map((e) => e.class)
  }

  const classIds = classes.map((c) => c.id)
  if (classIds.length === 0) {
    return { slots: [] as ReturnType<typeof mapSlot>[], liveSessions: [] as { id: string; classId: string }[], classes }
  }

  const [rows, live] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { classId: { in: classIds } },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    }),
    prisma.onlineSession.findMany({
      where: { classId: { in: classIds }, status: 'live' },
      select: { id: true, classId: true },
    }),
  ])

  return {
    slots: rows.map(mapSlot),
    liveSessions: live,
    classes,
  }
}

export async function createScheduleSlot(
  classId: string,
  teacherId: string,
  input: {
    dayOfWeek: number
    period: number
    subject: string
    startTime: string
    endTime: string
    room?: string
  }
) {
  const classroom = await prisma.class.findFirst({
    where: { id: classId, teacherId },
  })
  if (!classroom) throw new Error('Không có quyền')

  if (input.dayOfWeek < 1 || input.dayOfWeek > 7) {
    throw new Error('Thứ trong tuần không hợp lệ')
  }
  if (input.period < 1 || input.period > 12) {
    throw new Error('Tiết học phải từ 1 đến 12')
  }
  if (!input.subject.trim()) throw new Error('Vui lòng nhập môn học')

  try {
    const row = await prisma.scheduleSlot.create({
      data: {
        classId,
        dayOfWeek: input.dayOfWeek,
        period: input.period,
        subject: input.subject.trim(),
        startTime: input.startTime.trim(),
        endTime: input.endTime.trim(),
        room: (input.room ?? '').trim(),
      },
    })
    return mapSlot(row)
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === 'P2002') {
      throw new Error('Tiết học này đã tồn tại trong thời khóa biểu (cùng thứ và tiết)')
    }
    throw e
  }
}

export async function deleteScheduleSlot(classId: string, teacherId: string, slotId: string) {
  const slot = await prisma.scheduleSlot.findFirst({
    where: { id: slotId, classId, class: { teacherId } },
  })
  if (!slot) throw new Error('Không tìm thấy tiết học')
  await prisma.scheduleSlot.delete({ where: { id: slotId } })
}

export async function getAttendanceForSession(
  classId: string,
  session: SessionPayload,
  scheduleSlotId: string,
  sessionDate: string
) {
  await assertClassAccess(classId, session)

  const slot = await prisma.scheduleSlot.findFirst({
    where: { id: scheduleSlotId, classId },
  })
  if (!slot) throw new Error('Không tìm thấy tiết học')

  const rows = await prisma.attendanceRecord.findMany({
    where: { scheduleSlotId, sessionDate },
  })

  return rows.map((r) => ({
    id: r.id,
    classId: r.classId,
    scheduleSlotId: r.scheduleSlotId,
    studentId: r.studentId,
    sessionDate: r.sessionDate,
    status: r.status as AttendanceStatus,
  }))
}

export async function saveAttendanceForSession(
  classId: string,
  teacherId: string,
  input: {
    scheduleSlotId: string
    sessionDate: string
    records: { studentId: string; status: AttendanceStatus }[]
  }
) {
  const slot = await prisma.scheduleSlot.findFirst({
    where: { id: input.scheduleSlotId, classId, class: { teacherId } },
    include: { class: { include: { enrollments: true } } },
  })
  if (!slot) throw new Error('Không có quyền')

  const enrolledIds = new Set(slot.class.enrollments.map((e) => e.studentId))
  const validStatuses: AttendanceStatus[] = ['present', 'late', 'absent']

  for (const rec of input.records) {
    if (!enrolledIds.has(rec.studentId)) continue
    if (!validStatuses.includes(rec.status)) continue

    await prisma.attendanceRecord.upsert({
      where: {
        scheduleSlotId_sessionDate_studentId: {
          scheduleSlotId: input.scheduleSlotId,
          sessionDate: input.sessionDate,
          studentId: rec.studentId,
        },
      },
      create: {
        classId,
        scheduleSlotId: input.scheduleSlotId,
        studentId: rec.studentId,
        sessionDate: input.sessionDate,
        status: rec.status,
      },
      update: { status: rec.status },
    })
  }

  return getAttendanceForSession(classId, { userId: teacherId, role: 'teacher', email: '' }, input.scheduleSlotId, input.sessionDate)
}

export async function getStudentAttendanceHistory(
  classId: string,
  studentId: string,
  session: SessionPayload
) {
  await assertClassAccess(classId, session)
  if (session.role === 'student' && session.userId !== studentId) {
    throw new Error('Không có quyền')
  }

  const rows = await prisma.attendanceRecord.findMany({
    where: { classId, studentId },
    orderBy: [{ sessionDate: 'desc' }, { updatedAt: 'desc' }],
    include: { scheduleSlot: true },
  })

  return rows.map((r) => ({
    id: r.id,
    sessionDate: r.sessionDate,
    status: r.status as AttendanceStatus,
    period: r.scheduleSlot.period,
    subject: r.scheduleSlot.subject,
    dayOfWeek: r.scheduleSlot.dayOfWeek,
    startTime: r.scheduleSlot.startTime,
    endTime: r.scheduleSlot.endTime,
  }))
}
