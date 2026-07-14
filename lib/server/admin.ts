import { prisma } from '../prisma'
import { generateUniqueClassCode } from '../utils/generateClassCode'
import { generateTempPassword } from '../utils/generateTempPassword'
import { logActivity } from './activityLog'
import { ensureClassChat } from './classChat'
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

  await ensureClassChat(row.id, row.title)

  await logActivity({
    userId: session.userId,
    type: 'class_create',
    title: 'Tạo lớp học (admin)',
    message: `Đã tạo lớp "${row.title}" cho GV ${teacher.fullName}`,
    meta: { classId: row.id, teacherId: teacher.id, classCode: row.classCode },
  })
  await logActivity({
    userId: teacher.id,
    type: 'class_create',
    title: 'Tạo lớp học',
    message: `Admin đã tạo lớp "${row.title}" (mã ${row.classCode}) cho bạn`,
    href: `/teacher/courses/${row.id}`,
    meta: { classId: row.id, classCode: row.classCode },
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

  await ensureClassChat(classroom.id, classroom.title)

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

export type AdminWorkListItem = {
  id: string
  kind: 'student_submission' | 'teacher_grading' | 'teacher_summary' | 'student_summary' | 'class_summary'
  title: string
  subtitle: string
  meta?: string
  statusKey?: string
  statusLabel?: string
  teacherId?: string
  studentId?: string
  classId?: string
}

export async function getAdminWorkStats(session: SessionPayload) {
  requireAdmin(session)

  const [classes, tasks, submissions] = await Promise.all([
    prisma.class.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        teacherId: true,
        teacher: { select: { id: true, fullName: true, email: true } },
        enrollments: {
          select: {
            studentId: true,
            student: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.findMany({
      select: { id: true, title: true, classId: true, teacherId: true, dueDate: true },
    }),
    prisma.submission.findMany({
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, title: true, classId: true, teacherId: true } },
      },
    }),
  ])

  const activeClasses = classes.filter((c) => c.status !== 'cancelled')
  const classById = new Map(activeClasses.map((c) => [c.id, c]))
  const taskById = new Map(tasks.map((t) => [t.id, t]))

  const studentSummary = {
    not_submitted: 0,
    submitted: 0,
    late: 0,
    graded: 0,
    total: submissions.length,
  }

  const studentItems: AdminWorkListItem[] = []
  for (const sub of submissions) {
    const classroom = classById.get(sub.task.classId)
    if (!classroom) continue
    const statusKey =
      sub.grade != null ? 'graded' : (sub.status as 'not_submitted' | 'submitted' | 'late')
    if (statusKey === 'graded') studentSummary.graded += 1
    else if (statusKey === 'not_submitted') studentSummary.not_submitted += 1
    else if (statusKey === 'late') studentSummary.late += 1
    else studentSummary.submitted += 1
    const statusLabel =
      statusKey === 'graded'
        ? 'Đã chấm'
        : statusKey === 'not_submitted'
          ? 'Chưa nộp'
          : statusKey === 'late'
            ? 'Nộp muộn'
            : 'Đã nộp'

    studentItems.push({
      id: sub.id,
      kind: 'student_submission',
      title: `${sub.student.fullName} · ${sub.task.title}`,
      subtitle: `${classroom.title} · ${sub.student.email}`,
      meta:
        sub.grade != null
          ? `Điểm ${sub.grade}/${sub.maxGrade ?? 10}`
          : sub.submittedAt
            ? `Nộp: ${sub.submittedAt.toISOString()}`
            : undefined,
      statusKey,
      statusLabel,
      studentId: sub.studentId,
      classId: classroom.id,
      teacherId: classroom.teacherId,
    })
  }

  const teacherSummary = {
    pending_grade: 0,
    graded: 0,
    total_actionable: 0,
  }
  const teacherGradingItems: AdminWorkListItem[] = []

  for (const sub of submissions) {
    if (sub.status === 'not_submitted') continue
    const classroom = classById.get(sub.task.classId)
    if (!classroom) continue
    const isGraded = sub.grade != null
    if (isGraded) teacherSummary.graded += 1
    else teacherSummary.pending_grade += 1
    teacherSummary.total_actionable += 1

    teacherGradingItems.push({
      id: `grade-${sub.id}`,
      kind: 'teacher_grading',
      title: `${classroom.teacher.fullName} · ${sub.task.title}`,
      subtitle: `HS: ${sub.student.fullName} · ${classroom.title}`,
      meta: isGraded
        ? `Đã chấm ${sub.grade}/${sub.maxGrade ?? 10}`
        : 'Chờ chấm điểm',
      statusKey: isGraded ? 'graded' : 'pending_grade',
      statusLabel: isGraded ? 'Đã chấm' : 'Chờ chấm',
      teacherId: classroom.teacherId,
      studentId: sub.studentId,
      classId: classroom.id,
    })
  }

  const teachersMap = new Map<
    string,
    {
      teacherId: string
      fullName: string
      email: string
      classIds: Set<string>
      taskIds: Set<string>
      pendingGrade: number
      graded: number
    }
  >()

  for (const c of activeClasses) {
    const row =
      teachersMap.get(c.teacherId) ||
      {
        teacherId: c.teacherId,
        fullName: c.teacher.fullName,
        email: c.teacher.email,
        classIds: new Set<string>(),
        taskIds: new Set<string>(),
        pendingGrade: 0,
        graded: 0,
      }
    row.classIds.add(c.id)
    teachersMap.set(c.teacherId, row)
  }
  for (const t of tasks) {
    if (!classById.has(t.classId)) continue
    const row = teachersMap.get(t.teacherId)
    if (row) row.taskIds.add(t.id)
  }
  for (const sub of submissions) {
    if (sub.status === 'not_submitted') continue
    if (!classById.has(sub.task.classId)) continue
    const row = teachersMap.get(sub.task.teacherId)
    if (!row) continue
    if (sub.grade != null) row.graded += 1
    else row.pendingGrade += 1
  }

  const teachersOverview = Array.from(teachersMap.values()).map((t) => {
    const total = t.pendingGrade + t.graded
    return {
      teacherId: t.teacherId,
      fullName: t.fullName,
      email: t.email,
      classes: t.classIds.size,
      tasks: t.taskIds.size,
      pendingGrade: t.pendingGrade,
      graded: t.graded,
      gradeRate: total === 0 ? 0 : Math.round((t.graded / total) * 100),
    }
  })

  const studentsMap = new Map<
    string,
    {
      studentId: string
      fullName: string
      email: string
      classIds: Set<string>
      notSubmitted: number
      submitted: number
      late: number
      graded: number
      total: number
    }
  >()

  for (const c of activeClasses) {
    for (const e of c.enrollments) {
      const row =
        studentsMap.get(e.studentId) ||
        {
          studentId: e.studentId,
          fullName: e.student.fullName,
          email: e.student.email,
          classIds: new Set<string>(),
          notSubmitted: 0,
          submitted: 0,
          late: 0,
          graded: 0,
          total: 0,
        }
      row.classIds.add(c.id)
      studentsMap.set(e.studentId, row)
    }
  }
  for (const sub of submissions) {
    if (!classById.has(sub.task.classId)) continue
    const row = studentsMap.get(sub.studentId)
    if (!row) continue
    row.total += 1
    if (sub.grade != null) row.graded += 1
    else if (sub.status === 'not_submitted') row.notSubmitted += 1
    else if (sub.status === 'late') row.late += 1
    else if (sub.status === 'submitted') row.submitted += 1
  }

  const studentsOverview = Array.from(studentsMap.values()).map((s) => ({
    studentId: s.studentId,
    fullName: s.fullName,
    email: s.email,
    classes: s.classIds.size,
    total: s.total,
    notSubmitted: s.notSubmitted,
    submitted: s.submitted,
    late: s.late,
    graded: s.graded,
    completionRate:
      s.total === 0 ? 0 : Math.round(((s.total - s.notSubmitted) / s.total) * 100),
  }))

  const byClass = activeClasses.map((c) => {
    const classTasks = tasks.filter((t) => t.classId === c.id)
    const classSubs = submissions.filter((s) => s.task.classId === c.id)
    const submitted = classSubs.filter((s) => s.status !== 'not_submitted').length
    const graded = classSubs.filter((s) => s.grade != null).length
    return {
      classId: c.id,
      title: c.title,
      teacherName: c.teacher.fullName,
      students: c.enrollments.length,
      tasks: classTasks.length,
      submitRate:
        classSubs.length === 0 ? 0 : Math.round((submitted / classSubs.length) * 100),
      gradeRate:
        classSubs.length === 0 ? 0 : Math.round((graded / classSubs.length) * 100),
      submitted,
      pending: classSubs.filter((s) => s.status === 'not_submitted').length,
      graded,
      totalSubs: classSubs.length,
    }
  })

  void taskById

  return {
    student: {
      summary: studentSummary,
      items: studentItems,
    },
    teacher: {
      summary: teacherSummary,
      items: teacherGradingItems,
    },
    teachersOverview,
    studentsOverview,
    byClass,
  }
}
