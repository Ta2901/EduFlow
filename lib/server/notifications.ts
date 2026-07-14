import { prisma } from '../prisma'

export async function createNotification(input: {
  userId: string
  type: string
  title: string
  message: string
  href?: string
  dedupeKey?: string
}) {
  if (input.dedupeKey) {
    const existing = await prisma.notification.findUnique({
      where: {
        userId_dedupeKey: { userId: input.userId, dedupeKey: input.dedupeKey },
      },
    })
    if (existing) return existing
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
      dedupeKey: input.dedupeKey,
    },
  })
}

export async function notifyStudentsNewAssignment(
  studentIds: string[],
  taskTitle: string,
  classTitle: string,
  taskId: string
) {
  if (studentIds.length === 0) return
  const href = `/student/assignments/${taskId}`
  await prisma.notification.createMany({
    data: studentIds.map((studentId) => ({
      userId: studentId,
      type: 'new_assignment',
      title: 'Bài tập mới',
      message: `「${taskTitle}」 trong lớp ${classTitle}`,
      href,
      dedupeKey: `new-task-${taskId}-${studentId}`,
    })),
    skipDuplicates: true,
  })
}

export async function notifyTeacherSubmission(
  teacherId: string,
  studentName: string,
  taskTitle: string,
  taskId: string
) {
  await createNotification({
    userId: teacherId,
    type: 'submission_received',
    title: 'Học sinh đã nộp bài',
    message: `${studentName} đã nộp bài 「${taskTitle}」`,
    href: `/teacher/assignments/${taskId}/submissions`,
  })
}

export async function notifyStudentsOnlineSession(
  studentIds: string[],
  sessionTitle: string,
  classTitle: string,
  _classId: string,
  sessionId: string
) {
  const href = `/online/${sessionId}`
  await Promise.all(
    studentIds.map((studentId) =>
      createNotification({
        userId: studentId,
        type: 'online_class',
        title: 'Lớp học online đang diễn ra',
        message: `「${sessionTitle}」 — ${classTitle}`,
        href,
        dedupeKey: `online-live-${sessionId}-${studentId}`,
      })
    )
  )
}

export async function notifyStudentGraded(
  studentId: string,
  taskTitle: string,
  grade: number,
  maxGrade: number,
  taskId: string
) {
  await createNotification({
    userId: studentId,
    type: 'feedback',
    title: 'Đã có điểm và nhận xét',
    message: `Bài 「${taskTitle}」: ${grade}/${maxGrade}`,
    href: `/student/assignments/${taskId}`,
    dedupeKey: `graded-${taskId}-${studentId}`,
  })
}
