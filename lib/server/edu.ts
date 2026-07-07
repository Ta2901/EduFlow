import { prisma } from '../prisma'
import { generateUniqueClassCode } from '../utils/generateClassCode'
import { mapClassRoom, mapSubmission, mapTask } from './mappers'
import {
  notifyStudentGraded,
  notifyStudentsNewAssignment,
  notifyTeacherSubmission,
} from './notifications'
import type { SessionPayload } from './session'

const classInclude = {
  enrollments: {
    include: {
      student: { select: { id: true, fullName: true, email: true } },
    },
  },
} as const

const taskInclude = {
  attachments: true,
} as const

const submissionInclude = {
  student: { select: { fullName: true, email: true } },
  files: true,
} as const

function isLate(dueDate: string): boolean {
  const due = new Date(dueDate)
  due.setHours(23, 59, 59, 999)
  return new Date() > due
}

export async function getEduContext(session: SessionPayload) {
  if (session.role === 'teacher') {
    const classes = await prisma.class.findMany({
      where: { teacherId: session.userId },
      include: classInclude,
      orderBy: { createdAt: 'desc' },
    })
    const classIds = classes.map((c) => c.id)
    const tasks = await prisma.task.findMany({
      where: { classId: { in: classIds } },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    })
    const taskIds = tasks.map((t) => t.id)
    const submissions = await prisma.submission.findMany({
      where: { taskId: { in: taskIds } },
      include: submissionInclude,
    })

    return {
      classes: classes.map(mapClassRoom),
      tasks: tasks.map(mapTask),
      submissions: submissions.map(mapSubmission),
    }
  }

  const enrollments = await prisma.classEnrollment.findMany({
    where: { studentId: session.userId },
    include: { class: { include: classInclude } },
  })
  const classes = enrollments.map((e) => mapClassRoom(e.class))
  const classIds = classes.map((c) => c.id)

  const tasks = await prisma.task.findMany({
    where: { classId: { in: classIds } },
    include: taskInclude,
    orderBy: { createdAt: 'desc' },
  })

  const submissions = await prisma.submission.findMany({
    where: { studentId: session.userId },
    include: submissionInclude,
  })

  return {
    classes,
    tasks: tasks.map(mapTask),
    submissions: submissions.map(mapSubmission),
  }
}

export async function createClassForTeacher(
  teacherId: string,
  input: { title: string; description: string }
) {
  const existingCodes = (await prisma.class.findMany({ select: { classCode: true } })).map(
    (c) => c.classCode
  )

  const row = await prisma.class.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      classCode: generateUniqueClassCode(existingCodes),
      teacherId,
    },
    include: classInclude,
  })

  return mapClassRoom(row)
}

export async function joinClassByCode(
  studentId: string,
  studentName: string,
  studentEmail: string,
  code: string
) {
  const classroom = await prisma.class.findFirst({
    where: { classCode: code.trim().toUpperCase() },
    include: classInclude,
  })

  if (!classroom) {
    return { ok: false as const, error: 'Mã lớp không tồn tại. Vui lòng kiểm tra lại.' }
  }

  const exists = classroom.enrollments.some((e) => e.studentId === studentId)
  if (exists) {
    return { ok: false as const, error: 'Bạn đã tham gia lớp này rồi.' }
  }

  await prisma.classEnrollment.create({
    data: { classId: classroom.id, studentId },
  })

  const tasks = await prisma.task.findMany({ where: { classId: classroom.id } })
  for (const task of tasks) {
    await prisma.submission.upsert({
      where: { taskId_studentId: { taskId: task.id, studentId } },
      create: {
        taskId: task.id,
        studentId,
        status: 'not_submitted',
      },
      update: {},
    })
  }

  const updated = await prisma.class.findUniqueOrThrow({
    where: { id: classroom.id },
    include: classInclude,
  })

  return { ok: true as const, classId: classroom.id, classroom: mapClassRoom(updated) }
}

export async function createTaskForClass(
  teacherId: string,
  classId: string,
  input: {
    title: string
    description: string
    dueDate: string
    attachments: { name: string; size: number; type: string; url: string }[]
  }
) {
  const classroom = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: classInclude,
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')

  const task = await prisma.task.create({
    data: {
      classId,
      title: input.title.trim(),
      description: input.description.trim(),
      dueDate: input.dueDate,
      teacherId,
      attachments: {
        create: input.attachments.map((a) => ({
          name: a.name,
          size: a.size,
          type: a.type,
          url: a.url,
        })),
      },
    },
    include: taskInclude,
  })

  for (const enrollment of classroom.enrollments) {
    await prisma.submission.upsert({
      where: {
        taskId_studentId: { taskId: task.id, studentId: enrollment.studentId },
      },
      create: {
        taskId: task.id,
        studentId: enrollment.studentId,
        status: 'not_submitted',
      },
      update: {},
    })
  }

  const studentIds = classroom.enrollments.map((e) => e.studentId)
  if (studentIds.length > 0) {
    await notifyStudentsNewAssignment(studentIds, task.title, classroom.title, task.id)
  }

  return mapTask(task)
}

export async function submitWorkForTask(
  studentId: string,
  taskId: string,
  input: { content: string; files: { name: string; size: number; url: string }[] }
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { class: { include: { teacher: true } } },
  })
  if (!task) return { ok: false as const, error: 'Không tìm thấy bài tập' }

  const submission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId } },
    include: { student: true },
  })
  if (!submission) {
    return { ok: false as const, error: 'Bạn chưa tham gia lớp học này' }
  }

  if (!input.content.trim() && input.files.length === 0) {
    return { ok: false as const, error: 'Vui lòng nhập nội dung hoặc đính kèm tệp' }
  }

  const late = isLate(task.dueDate)
  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: late ? 'late' : 'submitted',
      submittedAt: new Date(),
      content: input.content.trim(),
      files: {
        deleteMany: {},
        create: input.files.map((f) => ({
          name: f.name,
          size: f.size,
          url: f.url,
        })),
      },
    },
    include: submissionInclude,
  })

  await notifyTeacherSubmission(
    task.class.teacherId,
    updated.student.fullName,
    task.title,
    task.id
  )

  return { ok: true as const, submission: mapSubmission(updated) }
}

export async function gradeSubmissionById(
  teacherId: string,
  submissionId: string,
  grade: number,
  maxGrade: number,
  feedback: string
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      task: { include: { class: true } },
      student: true,
    },
  })

  if (!submission || submission.task.class.teacherId !== teacherId) {
    throw new Error('Không có quyền chấm bài này')
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade,
      maxGrade,
      feedback,
      gradedAt: new Date(),
    },
    include: submissionInclude,
  })

  await notifyStudentGraded(
    submission.studentId,
    submission.task.title,
    grade,
    maxGrade,
    submission.taskId
  )

  return mapSubmission(updated)
}
