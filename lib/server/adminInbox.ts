import type {
  AdminClassReport,
  AdminInbox,
  AdminPendingAccount,
  AdminTeacherWarning,
} from '../admin/inbox'
import { prisma } from '../prisma'
import { requireAdmin } from './account'
import { getAdminEvalOverview } from './evaluations'
import type { SessionPayload } from './session'
import { getAdminTeachingProgress } from './teachingPlan'

const TZ = 'Asia/Ho_Chi_Minh'

function ymd(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function addDays(ymdStr: string, days: number) {
  const [year, month, day] = ymdStr.split('-').map(Number)
  const dt = new Date(Date.UTC(year, month - 1, day))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function weekRange(today: string) {
  const [year, month, day] = today.split('-').map(Number)
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const start = addDays(today, mondayOffset)
  return { key: start, start, end: addDays(start, 6) }
}

function monthRange(today: string) {
  const [year, month] = today.split('-').map(Number)
  const start = `${today.slice(0, 7)}-01`
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const end = `${today.slice(0, 7)}-${String(last).padStart(2, '0')}`
  return { key: today.slice(0, 7), start, end }
}

function inRange(value: string | null | undefined, start: string, end: string) {
  if (!value) return false
  const day = value.slice(0, 10)
  return day >= start && day <= end
}

function reportScore(report: AdminClassReport) {
  return report.missing * 2 + report.attendanceAbsent + Math.max(0, report.planDue - report.planDone)
}

export async function getAdminInbox(session: SessionPayload): Promise<AdminInbox> {
  requireAdmin(session)

  const today = ymd()
  const week = weekRange(today)
  const month = monthRange(today)

  const [pendingRows, progress, evals, classRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['teacher', 'student'] }, accountStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        memberCode: true,
        school: true,
        createdAt: true,
      },
    }),
    getAdminTeachingProgress(session),
    getAdminEvalOverview(session),
    prisma.class.findMany({
      where: { status: { not: 'cancelled' } },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        classCode: true,
        teacherId: true,
        teacher: { select: { fullName: true, email: true } },
        _count: { select: { enrollments: true } },
        tasks: {
          select: {
            dueDate: true,
            submissions: { select: { status: true, grade: true } },
          },
        },
        attendances: { select: { sessionDate: true, status: true } },
        teachingPlan: { select: { status: true, plannedDate: true } },
      },
    }),
  ])

  const classMeta = new Map(classRows.map((row) => [row.id, row]))

  const warnings: AdminTeacherWarning[] = []
  for (const row of progress.classes) {
    if (row.hasPlan && row.behind) {
      warnings.push({
        id: `w:behind:${row.classId}:${week.key}`,
        classId: row.classId,
        classTitle: row.title,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        teacherEmail: row.teacherEmail,
        reason: 'behind',
        overdue: row.overdue,
        progressRate: row.progressRate,
      })
    } else if (!row.hasPlan) {
      warnings.push({
        id: `w:no_plan:${row.classId}:${week.key}`,
        classId: row.classId,
        classTitle: row.title,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        teacherEmail: row.teacherEmail,
        reason: 'no_plan',
        overdue: 0,
        progressRate: 0,
      })
    }
  }

  for (const row of evals.sessionEvals) {
    if (row.count < 1 || row.average >= 3) continue
    const meta = classMeta.get(row.classId)
    if (!meta) continue
    warnings.push({
      id: `w:low_session:${row.classId}:${week.key}`,
      classId: row.classId,
      classTitle: meta.title,
      teacherId: meta.teacherId,
      teacherName: meta.teacher.fullName,
      teacherEmail: meta.teacher.email,
      reason: 'low_session_rating',
      overdue: 0,
      progressRate: 0,
      rating: row.average,
      ratingCount: row.count,
    })
  }

  for (const row of evals.courseEvals) {
    if (row.responseCount < 1 || row.averageTeachingQuality <= 0 || row.averageTeachingQuality >= 3) continue
    const meta = classMeta.get(row.classId)
    if (!meta) continue
    warnings.push({
      id: `w:low_course:${row.id}:${week.key}`,
      classId: row.classId,
      classTitle: meta.title,
      teacherId: meta.teacherId,
      teacherName: meta.teacher.fullName,
      teacherEmail: meta.teacher.email,
      reason: 'low_course_rating',
      overdue: 0,
      progressRate: 0,
      rating: row.averageTeachingQuality,
      ratingCount: row.responseCount,
      courseKind: row.kind,
    })
  }

  const reasonRank: Record<AdminTeacherWarning['reason'], number> = {
    behind: 0,
    low_session_rating: 1,
    low_course_rating: 2,
    no_plan: 3,
  }
  warnings.sort(
    (a, b) => reasonRank[a.reason] - reasonRank[b.reason] || a.teacherName.localeCompare(b.teacherName)
  )

  const pendingAccounts: AdminPendingAccount[] = pendingRows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role === 'teacher' ? 'teacher' : 'student',
    memberCode: row.memberCode ?? undefined,
    school: row.school ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }))

  const buildReport = (
    row: (typeof classRows)[number],
    period: 'week' | 'month',
    range: { key: string; start: string; end: string }
  ): AdminClassReport => {
    const tasks = row.tasks.filter((task) => inRange(task.dueDate, range.start, range.end))
    let submitted = 0
    let late = 0
    let missing = 0
    let graded = 0
    let pendingGrade = 0
    for (const task of tasks) {
      for (const sub of task.submissions) {
        if (sub.grade != null) graded += 1
        if (sub.status === 'late') {
          late += 1
          if (sub.grade == null) pendingGrade += 1
        } else if (sub.status === 'submitted') {
          submitted += 1
          if (sub.grade == null) pendingGrade += 1
        } else {
          missing += 1
        }
      }
    }

    let attendancePresent = 0
    let attendanceLate = 0
    let attendanceAbsent = 0
    for (const record of row.attendances) {
      if (!inRange(record.sessionDate, range.start, range.end)) continue
      if (record.status === 'present') attendancePresent += 1
      else if (record.status === 'late') attendanceLate += 1
      else if (record.status === 'absent') attendanceAbsent += 1
    }

    let planDone = 0
    let planDue = 0
    for (const item of row.teachingPlan) {
      if (!inRange(item.plannedDate, range.start, range.end) || item.status === 'skipped') continue
      planDue += 1
      if (item.status === 'done') planDone += 1
    }

    return {
      id: `r:${period}:${row.id}:${range.key}`,
      period,
      periodKey: range.key,
      classId: row.id,
      classTitle: row.title,
      classCode: row.classCode,
      teacherId: row.teacherId,
      teacherName: row.teacher.fullName,
      studentCount: row._count.enrollments,
      tasks: tasks.length,
      submitted,
      late,
      missing,
      graded,
      pendingGrade,
      totalSubs: submitted + late + missing,
      attendancePresent,
      attendanceLate,
      attendanceAbsent,
      attendanceTotal: attendancePresent + attendanceLate + attendanceAbsent,
      planDone,
      planDue,
    }
  }

  const byAttention = (a: AdminClassReport, b: AdminClassReport) =>
    reportScore(b) - reportScore(a) || a.classTitle.localeCompare(b.classTitle)

  const reports = [
    ...classRows.map((row) => buildReport(row, 'week', week)).sort(byAttention),
    ...classRows.map((row) => buildReport(row, 'month', month)).sort(byAttention),
  ]

  return {
    generatedAt: new Date().toISOString(),
    week,
    month,
    warnings,
    pendingAccounts,
    reports,
  }
}
