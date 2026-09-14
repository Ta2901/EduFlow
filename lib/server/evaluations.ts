import { prisma } from '../prisma'
import { assertCanWrite, requireAdmin } from './account'
import { createNotification } from './notifications'
import type { SessionPayload } from './session'

async function assertEnrolledStudent(classId: string, session: SessionPayload) {
  if (session.role !== 'student') throw new Error('Chỉ học sinh được đánh giá')
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { classId_studentId: { classId, studentId: session.userId } },
  })
  if (!enrollment) throw new Error('Bạn chưa tham gia lớp này')
}

async function assertTeacherOrAdmin(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, title: true, teacherId: true },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp')
  if (session.role === 'admin') return classroom
  if (session.role === 'teacher' && classroom.teacherId === session.userId) return classroom
  throw new Error('Không có quyền')
}

function clampRating(n: number) {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v) || v < 1 || v > 5) throw new Error('Điểm đánh giá phải từ 1 đến 5')
  return v
}

export async function notifySessionEvalOpen(sessionId: string) {
  const online = await prisma.onlineSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      classId: true,
      class: {
        select: {
          title: true,
          enrollments: { select: { studentId: true } },
        },
      },
    },
  })
  if (!online) return

  const sessionKey = `online-${online.id}`
  await Promise.all(
    online.class.enrollments.map((e) =>
      createNotification({
        userId: e.studentId,
        type: 'session_eval',
        title: 'Đánh giá buổi học',
        message: `Hãy đánh giá giáo viên sau buổi 「${online.title}」 — ${online.class.title}`,
        href: `/student/courses/${online.classId}?eval=${sessionKey}`,
        dedupeKey: `session-eval-${sessionKey}-${e.studentId}`,
      })
    )
  )
}

export async function listPendingSessionEvals(classId: string, session: SessionPayload) {
  await assertEnrolledStudent(classId, session)

  const ended = await prisma.onlineSession.findMany({
    where: { classId, status: 'ended' },
    orderBy: { endedAt: 'desc' },
    take: 20,
    select: { id: true, title: true, endedAt: true },
  })

  const keys = ended.map((s) => `online-${s.id}`)
  const done =
    keys.length === 0
      ? []
      : await prisma.sessionTeacherEval.findMany({
          where: { studentId: session.userId, sessionKey: { in: keys } },
          select: { sessionKey: true },
        })
  const doneSet = new Set(done.map((d) => d.sessionKey))

  return ended
    .filter((s) => !doneSet.has(`online-${s.id}`))
    .map((s) => ({
      sessionKey: `online-${s.id}`,
      onlineSessionId: s.id,
      title: s.title,
      endedAt: s.endedAt?.toISOString(),
    }))
}

export async function submitSessionEval(
  session: SessionPayload,
  input: {
    classId: string
    sessionKey: string
    onlineSessionId?: string
    rating: number
    comment?: string
  }
) {
  await assertCanWrite(session)
  await assertEnrolledStudent(input.classId, session)

  const rating = clampRating(input.rating)
  const comment = (input.comment ?? '').trim().slice(0, 1000)

  const onlineSessionId =
    input.onlineSessionId ||
    (input.sessionKey.startsWith('online-') ? input.sessionKey.slice('online-'.length) : undefined)
  if (!onlineSessionId) throw new Error('Buổi học không hợp lệ')

  const online = await prisma.onlineSession.findFirst({
    where: { id: onlineSessionId, classId: input.classId, status: 'ended' },
  })
  if (!online) throw new Error('Buổi học chưa kết thúc hoặc không hợp lệ')
  if (input.sessionKey !== `online-${online.id}`) throw new Error('sessionKey không khớp')

  const row = await prisma.sessionTeacherEval.upsert({
    where: {
      sessionKey_studentId: {
        sessionKey: input.sessionKey,
        studentId: session.userId,
      },
    },
    create: {
      classId: input.classId,
      sessionKey: input.sessionKey,
      onlineSessionId,
      studentId: session.userId,
      rating,
      comment,
    },
    update: { rating, comment },
  })

  return {
    id: row.id,
    sessionKey: row.sessionKey,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function getSessionEvalSummary(classId: string, session: SessionPayload) {
  await assertTeacherOrAdmin(classId, session)

  const rows = await prisma.sessionTeacherEval.findMany({
    where: { classId },
    include: {
      student: { select: { fullName: true } },
      onlineSession: { select: { title: true, endedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const avg =
    rows.length === 0
      ? 0
      : Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10

  return {
    average: avg,
    count: rows.length,
    items: rows.map((r) => ({
      id: r.id,
      sessionKey: r.sessionKey,
      sessionTitle: r.onlineSession?.title ?? r.sessionKey,
      studentName: r.student.fullName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

export async function listCourseEvals(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: { select: { studentId: true } } },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp')

  const isTeacher =
    session.role === 'admin' ||
    (session.role === 'teacher' && classroom.teacherId === session.userId)
  const isStudent =
    session.role === 'student' &&
    classroom.enrollments.some((e) => e.studentId === session.userId)
  if (!isTeacher && !isStudent) throw new Error('Không có quyền')

  let evals = await prisma.courseEvaluation.findMany({
    where: { classId },
    include: {
      responses: isTeacher
        ? true
        : { where: { studentId: session.userId } },
      _count: { select: { responses: true } },
    },
    orderBy: { kind: 'asc' },
  })

  // Ensure midterm + final rows exist as draft placeholders for teacher/admin UI
  if (isTeacher) {
    const missing = (['midterm', 'final'] as const).filter((kind) => !evals.some((e) => e.kind === kind))
    if (missing.length > 0) {
      await Promise.all(
        missing.map((kind) =>
          prisma.courseEvaluation.upsert({
            where: { classId_kind: { classId, kind } },
            create: { classId, kind, status: 'draft' },
            update: {},
          })
        )
      )
      evals = await prisma.courseEvaluation.findMany({
        where: { classId },
        include: {
          responses: true,
          _count: { select: { responses: true } },
        },
        orderBy: { kind: 'asc' },
      })
    }
  }

  return {
    enrollments: classroom.enrollments.length,
    evaluations: evals
      .slice()
      .sort((a, b) => (a.kind === 'midterm' ? 0 : 1) - (b.kind === 'midterm' ? 0 : 1))
      .map((e) => {
        const my = e.responses[0]
        const avgTeaching =
          e.responses.length === 0
            ? 0
            : Math.round(
                (e.responses.reduce((s, r) => s + r.teachingQuality, 0) / e.responses.length) *
                  10
              ) / 10
        return {
          id: e.id,
          kind: e.kind as 'midterm' | 'final',
          status: e.status as 'draft' | 'open' | 'closed',
          openAt: e.openAt?.toISOString(),
          closeAt: e.closeAt?.toISOString(),
          responseCount: e._count.responses,
          averageTeachingQuality: isTeacher ? avgTeaching : undefined,
          submitted: isStudent && Boolean(my),
          myResponse:
            isStudent && my
              ? {
                  teachingQuality: my.teachingQuality,
                  contentClarity: my.contentClarity,
                  pacing: my.pacing,
                  comment: my.comment,
                  createdAt: my.createdAt.toISOString(),
                }
              : undefined,
        }
      }),
  }
}

export async function setCourseEvalStatus(
  classId: string,
  kind: 'midterm' | 'final',
  session: SessionPayload,
  status: 'draft' | 'open' | 'closed'
) {
  await assertCanWrite(session)
  const classroom = await assertTeacherOrAdmin(classId, session)

  const row = await prisma.courseEvaluation.upsert({
    where: { classId_kind: { classId, kind } },
    create: {
      classId,
      kind,
      status,
      openAt: status === 'open' ? new Date() : null,
      closeAt: status === 'closed' ? new Date() : null,
    },
    update: {
      status,
      openAt: status === 'open' ? new Date() : undefined,
      closeAt: status === 'closed' ? new Date() : status === 'open' ? null : undefined,
    },
  })

  if (status === 'open') {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      select: { studentId: true },
    })
    const label = kind === 'midterm' ? 'giữa kỳ' : 'cuối kỳ'
    await Promise.all(
      enrollments.map((e) =>
        createNotification({
          userId: e.studentId,
          type: 'course_eval',
          title: `Đánh giá ${label}`,
          message: `Vui lòng đánh giá khoá học 「${classroom.title}」 (${label})`,
          href: `/student/courses/${classId}?courseEval=${kind}`,
          dedupeKey: `course-eval-${classId}-${kind}-${e.studentId}`,
        })
      )
    )
  }

  return {
    id: row.id,
    kind: row.kind as 'midterm' | 'final',
    status: row.status as 'draft' | 'open' | 'closed',
    openAt: row.openAt?.toISOString(),
    closeAt: row.closeAt?.toISOString(),
  }
}

export async function submitCourseEvalResponse(
  session: SessionPayload,
  input: {
    evaluationId: string
    teachingQuality: number
    contentClarity: number
    pacing: number
    comment?: string
  }
) {
  await assertCanWrite(session)
  if (session.role !== 'student') throw new Error('Chỉ học sinh được gửi đánh giá')

  const evaluation = await prisma.courseEvaluation.findUnique({
    where: { id: input.evaluationId },
    include: { class: { include: { enrollments: { select: { studentId: true } } } } },
  })
  if (!evaluation) throw new Error('Không tìm thấy đợt đánh giá')
  if (evaluation.status !== 'open') throw new Error('Đợt đánh giá chưa mở hoặc đã đóng')
  const enrolled = evaluation.class.enrollments.some((e) => e.studentId === session.userId)
  if (!enrolled) throw new Error('Bạn chưa tham gia lớp này')

  const row = await prisma.courseEvaluationResponse.upsert({
    where: {
      evaluationId_studentId: {
        evaluationId: input.evaluationId,
        studentId: session.userId,
      },
    },
    create: {
      evaluationId: input.evaluationId,
      studentId: session.userId,
      teachingQuality: clampRating(input.teachingQuality),
      contentClarity: clampRating(input.contentClarity),
      pacing: clampRating(input.pacing),
      comment: (input.comment ?? '').trim().slice(0, 1000),
    },
    update: {
      teachingQuality: clampRating(input.teachingQuality),
      contentClarity: clampRating(input.contentClarity),
      pacing: clampRating(input.pacing),
      comment: (input.comment ?? '').trim().slice(0, 1000),
    },
  })

  return {
    id: row.id,
    teachingQuality: row.teachingQuality,
    contentClarity: row.contentClarity,
    pacing: row.pacing,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function getAdminEvalOverview(session: SessionPayload) {
  requireAdmin(session)

  const [sessionAgg, courseEvals] = await Promise.all([
    prisma.sessionTeacherEval.groupBy({
      by: ['classId'],
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.courseEvaluation.findMany({
      where: { status: { in: ['open', 'closed'] } },
      include: {
        class: {
          select: {
            title: true,
            teacher: { select: { fullName: true } },
            enrollments: { select: { id: true } },
          },
        },
        _count: { select: { responses: true } },
        responses: { select: { teachingQuality: true } },
      },
    }),
  ])

  const classIds = Array.from(
    new Set([...sessionAgg.map((s) => s.classId), ...courseEvals.map((c) => c.classId)])
  )
  const classes =
    classIds.length === 0
      ? []
      : await prisma.class.findMany({
          where: { id: { in: classIds } },
          select: {
            id: true,
            title: true,
            teacher: { select: { fullName: true } },
          },
        })
  const classMap = new Map(classes.map((c) => [c.id, c]))

  return {
    sessionEvals: sessionAgg.map((s) => ({
      classId: s.classId,
      title: classMap.get(s.classId)?.title ?? s.classId,
      teacherName: classMap.get(s.classId)?.teacher.fullName ?? '',
      average: Math.round((s._avg.rating ?? 0) * 10) / 10,
      count: s._count._all,
    })),
    courseEvals: courseEvals.map((e) => {
      const avg =
        e.responses.length === 0
          ? 0
          : Math.round(
              (e.responses.reduce((sum, r) => sum + r.teachingQuality, 0) / e.responses.length) *
                10
            ) / 10
      return {
        id: e.id,
        classId: e.classId,
        title: e.class.title,
        teacherName: e.class.teacher.fullName,
        kind: e.kind as 'midterm' | 'final',
        status: e.status,
        responseCount: e._count.responses,
        enrollmentCount: e.class.enrollments.length,
        averageTeachingQuality: avg,
      }
    }),
  }
}
