import { prisma } from '../prisma'
import { assertCanWrite, requireAdmin } from './account'
import { createNotification } from './notifications'
import type { SessionPayload } from './session'

function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function assertTeacherOwnsClass(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, title: true, teacherId: true, termStart: true, termEnd: true, status: true },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp')
  if (session.role === 'admin') return classroom
  if (session.role !== 'teacher' || classroom.teacherId !== session.userId) {
    throw new Error('Không có quyền')
  }
  return classroom
}

async function assertClassMember(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: { select: { studentId: true } } },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp')
  if (session.role === 'admin') return classroom
  if (session.role === 'teacher' && classroom.teacherId === session.userId) return classroom
  const enrolled = classroom.enrollments.some((e) => e.studentId === session.userId)
  if (!enrolled) throw new Error('Bạn chưa tham gia lớp này')
  return classroom
}

function mapPlanItem(row: {
  id: string
  classId: string
  sessionIndex: number
  title: string
  description: string
  plannedDate: string | null
  status: string
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: row.id,
    classId: row.classId,
    sessionIndex: row.sessionIndex,
    title: row.title,
    description: row.description,
    plannedDate: row.plannedDate ?? undefined,
    status: row.status as 'planned' | 'done' | 'skipped',
    completedAt: row.completedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function summarizePlan(
  items: { status: string; plannedDate: string | null }[],
  today = todayYmd()
) {
  const total = items.length
  const done = items.filter((i) => i.status === 'done').length
  const skipped = items.filter((i) => i.status === 'skipped').length
  const overdue = items.filter(
    (i) => i.status === 'planned' && i.plannedDate && i.plannedDate < today
  ).length
  const dueSoon = items.filter(
    (i) => i.status === 'planned' && i.plannedDate && i.plannedDate >= today && i.plannedDate <= today
  ).length
  const expectedByToday = items.filter(
    (i) => i.plannedDate && i.plannedDate <= today && i.status !== 'skipped'
  ).length
  const doneOrSkippedByToday = items.filter(
    (i) =>
      i.plannedDate &&
      i.plannedDate <= today &&
      (i.status === 'done' || i.status === 'skipped')
  ).length
  const behind = overdue > 0 || (expectedByToday > 0 && doneOrSkippedByToday < expectedByToday)
  const progressRate = total === 0 ? 0 : Math.round(((done + skipped) / total) * 100)

  return {
    total,
    done,
    skipped,
    planned: items.filter((i) => i.status === 'planned').length,
    overdue,
    dueSoon,
    behind,
    progressRate,
  }
}

export async function getTeachingPlan(classId: string, session: SessionPayload) {
  await assertClassMember(classId, session)
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      title: true,
      teacherId: true,
      termStart: true,
      termEnd: true,
      teacher: { select: { id: true, fullName: true, email: true } },
    },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp')

  const items = await prisma.teachingPlanItem.findMany({
    where: { classId },
    orderBy: { sessionIndex: 'asc' },
  })

  return {
    class: {
      id: classroom.id,
      title: classroom.title,
      teacherId: classroom.teacherId,
      teacherName: classroom.teacher.fullName,
      termStart: classroom.termStart ?? undefined,
      termEnd: classroom.termEnd ?? undefined,
    },
    items: items.map(mapPlanItem),
    summary: summarizePlan(items),
  }
}

export async function updateClassTerm(
  classId: string,
  session: SessionPayload,
  input: { termStart?: string | null; termEnd?: string | null }
) {
  await assertCanWrite(session)
  await assertTeacherOwnsClass(classId, session)

  const row = await prisma.class.update({
    where: { id: classId },
    data: {
      termStart: input.termStart === undefined ? undefined : input.termStart || null,
      termEnd: input.termEnd === undefined ? undefined : input.termEnd || null,
    },
    select: { id: true, termStart: true, termEnd: true },
  })
  return {
    id: row.id,
    termStart: row.termStart ?? undefined,
    termEnd: row.termEnd ?? undefined,
  }
}

export async function upsertTeachingPlanItems(
  classId: string,
  session: SessionPayload,
  items: {
    sessionIndex: number
    title: string
    description?: string
    plannedDate?: string | null
  }[]
) {
  await assertCanWrite(session)
  await assertTeacherOwnsClass(classId, session)
  if (items.length === 0) throw new Error('Cần ít nhất một buổi học trong kế hoạch')

  const cleaned = items.map((item, idx) => ({
    sessionIndex: item.sessionIndex || idx + 1,
    title: item.title.trim(),
    description: (item.description ?? '').trim(),
    plannedDate: item.plannedDate?.trim() || null,
  }))
  if (cleaned.some((i) => !i.title)) throw new Error('Mỗi buổi cần có tiêu đề')

  await prisma.$transaction(async (tx) => {
    const existing = await tx.teachingPlanItem.findMany({ where: { classId } })
    const byIndex = new Map(existing.map((e) => [e.sessionIndex, e]))
    const keepIndexes = new Set(cleaned.map((i) => i.sessionIndex))

    await tx.teachingPlanItem.deleteMany({
      where: {
        classId,
        sessionIndex: { notIn: Array.from(keepIndexes) },
      },
    })

    for (const i of cleaned) {
      const prev = byIndex.get(i.sessionIndex)
      if (prev) {
        await tx.teachingPlanItem.update({
          where: { id: prev.id },
          data: {
            title: i.title,
            description: i.description,
            plannedDate: i.plannedDate,
          },
        })
      } else {
        await tx.teachingPlanItem.create({
          data: {
            classId,
            sessionIndex: i.sessionIndex,
            title: i.title,
            description: i.description,
            plannedDate: i.plannedDate,
            status: 'planned',
          },
        })
      }
    }
  })

  return getTeachingPlan(classId, session)
}

export async function updatePlanItemStatus(
  classId: string,
  itemId: string,
  session: SessionPayload,
  status: 'planned' | 'done' | 'skipped'
) {
  await assertCanWrite(session)
  await assertTeacherOwnsClass(classId, session)

  const existing = await prisma.teachingPlanItem.findFirst({
    where: { id: itemId, classId },
  })
  if (!existing) throw new Error('Không tìm thấy buổi trong kế hoạch')

  const row = await prisma.teachingPlanItem.update({
    where: { id: itemId },
    data: {
      status,
      completedAt: status === 'done' ? new Date() : null,
    },
  })
  return mapPlanItem(row)
}

export async function getAdminTeachingProgress(session: SessionPayload) {
  requireAdmin(session)

  const classes = await prisma.class.findMany({
    where: { status: { not: 'cancelled' } },
    select: {
      id: true,
      title: true,
      classCode: true,
      teacherId: true,
      termStart: true,
      termEnd: true,
      teacher: { select: { id: true, fullName: true, email: true } },
      teachingPlan: {
        select: { status: true, plannedDate: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const today = todayYmd()
  const rows = classes.map((c) => {
    const summary = summarizePlan(c.teachingPlan, today)
    return {
      classId: c.id,
      title: c.title,
      classCode: c.classCode,
      teacherId: c.teacherId,
      teacherName: c.teacher.fullName,
      teacherEmail: c.teacher.email,
      termStart: c.termStart ?? undefined,
      termEnd: c.termEnd ?? undefined,
      ...summary,
      hasPlan: c.teachingPlan.length > 0,
    }
  })

  const behind = rows.filter((r) => r.hasPlan && r.behind)
  const noPlan = rows.filter((r) => !r.hasPlan)

  return {
    summary: {
      classes: rows.length,
      withPlan: rows.filter((r) => r.hasPlan).length,
      behind: behind.length,
      noPlan: noPlan.length,
    },
    classes: rows.sort((a, b) => Number(b.behind) - Number(a.behind) || b.overdue - a.overdue),
  }
}

export async function remindTeacherAboutPlan(
  session: SessionPayload,
  input: { teacherId: string; classId: string; message?: string }
) {
  requireAdmin(session)
  await assertCanWrite(session)

  const classroom = await prisma.class.findFirst({
    where: { id: input.classId, teacherId: input.teacherId },
    select: {
      id: true,
      title: true,
      teacherId: true,
      teachingPlan: { select: { status: true, plannedDate: true } },
    },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp / giáo viên')

  const summary = summarizePlan(classroom.teachingPlan)
  const msg =
    input.message?.trim() ||
    (summary.overdue > 0
      ? `Lớp 「${classroom.title}」 đang chậm ${summary.overdue} buổi so với kế hoạch. Vui lòng cập nhật tiến độ giảng dạy.`
      : `Vui lòng kiểm tra và cập nhật kế hoạch giảng dạy lớp 「${classroom.title}」.`)

  const day = todayYmd()
  await createNotification({
    userId: input.teacherId,
    type: 'admin_reminder',
    title: 'Nhắc nhở tiến độ giảng dạy',
    message: msg,
    href: `/teacher/courses/${classroom.id}?tab=plan`,
    dedupeKey: `admin-plan-remind-${classroom.id}-${day}`,
  })

  return { ok: true as const, message: msg }
}
