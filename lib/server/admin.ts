import { prisma } from '../prisma'
import { generateUniqueClassCode } from '../utils/generateClassCode'
import { generateTempPassword } from '../utils/generateTempPassword'
import { hashPassword } from './password'
import type { AccountStatus, UserRole } from '../types'
import { requireAdmin } from './account'
import type { SessionPayload } from './session'

function mapUser(row: {
  id: string
  memberCode: string | null
  email: string
  fullName: string
  role: string
  accountStatus: string
  statusNote: string
  approvedAt: Date | null
  phone: string | null
  school: string | null
  createdAt: Date
}) {
  return {
    id: row.id,
    memberCode: row.memberCode ?? undefined,
    email: row.email,
    fullName: row.fullName,
    role: row.role as UserRole,
    accountStatus: row.accountStatus as AccountStatus,
    statusNote: row.statusNote || undefined,
    approvedAt: row.approvedAt?.toISOString(),
    phone: row.phone ?? undefined,
    school: row.school ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }
}

const classInclude = {
  teacher: { select: { id: true, fullName: true, email: true } },
  enrollments: {
    include: {
      student: { select: { id: true, fullName: true, email: true, accountStatus: true } },
    },
  },
} as const

export async function getAdminOverview(session: SessionPayload) {
  requireAdmin(session)

  const [pending, active, restricted, suspended, teachers, students, classes] =
    await Promise.all([
      prisma.user.count({ where: { role: { in: ['teacher', 'student'] }, accountStatus: 'pending' } }),
      prisma.user.count({ where: { role: { in: ['teacher', 'student'] }, accountStatus: 'active' } }),
      prisma.user.count({ where: { role: { in: ['teacher', 'student'] }, accountStatus: 'restricted' } }),
      prisma.user.count({ where: { role: { in: ['teacher', 'student'] }, accountStatus: 'suspended' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.class.count(),
    ])

  return { pending, active, restricted, suspended, teachers, students, classes }
}

export async function listAdminUsers(
  session: SessionPayload,
  filters: { role?: string; status?: string; q?: string }
) {
  requireAdmin(session)

  const where: {
    role?: string | { in: string[] }
    accountStatus?: string
    OR?: { fullName?: { contains: string }; email?: { contains: string }; memberCode?: { contains: string } }[]
  } = {
    role: { in: ['teacher', 'student'] },
  }

  if (filters.role === 'teacher' || filters.role === 'student') {
    where.role = filters.role
  }
  if (filters.status) {
    where.accountStatus = filters.status
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim()
    where.OR = [
      { fullName: { contains: q } },
      { email: { contains: q } },
      { memberCode: { contains: q } },
    ]
  }

  const rows = await prisma.user.findMany({
    where,
    orderBy: [{ accountStatus: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  })

  return rows.map(mapUser)
}

export async function updateAdminUser(
  session: SessionPayload,
  userId: string,
  input: { action: string; status?: AccountStatus; statusNote?: string; newPassword?: string }
) {
  requireAdmin(session)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role === 'admin') {
    throw new Error('Không tìm thấy tài khoản')
  }

  if (input.action === 'resetPassword') {
    const plain =
      input.newPassword?.trim() || generateTempPassword()
    if (plain.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự')
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(plain) },
    })
    return { user: mapUser(updated), temporaryPassword: plain }
  }

  if (input.action === 'approve') {
    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'active',
        approvedAt: new Date(),
        statusNote: input.statusNote?.trim() || '',
      },
    })
    return mapUser(row)
  }

  if (input.action === 'setStatus') {
    const status = input.status
    if (!status || !['active', 'restricted', 'suspended', 'pending'].includes(status)) {
      throw new Error('Trạng thái không hợp lệ')
    }
    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: status,
        statusNote: input.statusNote?.trim() || '',
        approvedAt: status === 'active' ? new Date() : user.approvedAt,
      },
    })
    return mapUser(row)
  }

  throw new Error('Hành động không hợp lệ')
}

export async function listAdminClasses(session: SessionPayload) {
  requireAdmin(session)
  const rows = await prisma.class.findMany({
    include: classInclude,
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    classCode: c.classCode,
    teacherId: c.teacherId,
    teacherName: c.teacher.fullName,
    teacherEmail: c.teacher.email,
    studentCount: c.enrollments.length,
    createdAt: c.createdAt.toISOString(),
    students: c.enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.fullName,
      email: e.student.email,
      accountStatus: e.student.accountStatus as AccountStatus,
    })),
  }))
}

export async function createAdminClass(
  session: SessionPayload,
  input: { title: string; description: string; teacherId: string }
) {
  requireAdmin(session)

  const teacher = await prisma.user.findFirst({
    where: { id: input.teacherId, role: 'teacher', accountStatus: 'active' },
  })
  if (!teacher) throw new Error('Giáo viên không hợp lệ hoặc chưa được kích hoạt')

  const existingCodes = (await prisma.class.findMany({ select: { classCode: true } })).map(
    (c) => c.classCode
  )

  const row = await prisma.class.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      classCode: generateUniqueClassCode(existingCodes),
      teacherId: input.teacherId,
    },
    include: classInclude,
  })

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    classCode: row.classCode,
    teacherId: row.teacherId,
    teacherName: row.teacher.fullName,
    studentCount: 0,
    createdAt: row.createdAt.toISOString(),
    students: [],
  }
}

export async function updateAdminClassRoster(
  session: SessionPayload,
  classId: string,
  studentIds: string[]
) {
  requireAdmin(session)

  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { tasks: true },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')

  const uniqueIds = Array.from(new Set(studentIds))
  const students = await prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
      role: 'student',
      accountStatus: { in: ['active', 'restricted'] },
    },
  })
  if (students.length !== uniqueIds.length) {
    throw new Error('Một số học sinh không hợp lệ')
  }

  const current = await prisma.classEnrollment.findMany({ where: { classId } })
  const currentIds = new Set(current.map((e) => e.studentId))
  const targetIds = new Set(uniqueIds)

  const toRemove = current.filter((e) => !targetIds.has(e.studentId))
  const toAdd = uniqueIds.filter((id) => !currentIds.has(id))

  for (const e of toRemove) {
    await prisma.classEnrollment.delete({ where: { id: e.id } })
  }

  for (const studentId of toAdd) {
    await prisma.classEnrollment.create({ data: { classId, studentId } })
    for (const task of classroom.tasks) {
      await prisma.submission.upsert({
        where: { taskId_studentId: { taskId: task.id, studentId } },
        create: { taskId: task.id, studentId, status: 'not_submitted' },
        update: {},
      })
    }
  }

  const updated = await prisma.class.findUniqueOrThrow({
    where: { id: classId },
    include: classInclude,
  })

  return {
    id: updated.id,
    title: updated.title,
    classCode: updated.classCode,
    students: updated.enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.fullName,
      email: e.student.email,
      accountStatus: e.student.accountStatus as AccountStatus,
    })),
  }
}

export async function listActiveTeachers(session: SessionPayload) {
  requireAdmin(session)
  const rows = await prisma.user.findMany({
    where: { role: 'teacher', accountStatus: 'active' },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, email: true },
  })
  return rows
}

export async function listEligibleStudents(session: SessionPayload) {
  requireAdmin(session)
  const rows = await prisma.user.findMany({
    where: { role: 'student', accountStatus: { in: ['active', 'restricted'] } },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, email: true, memberCode: true, accountStatus: true },
  })
  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    memberCode: r.memberCode ?? undefined,
    accountStatus: r.accountStatus as AccountStatus,
  }))
}
