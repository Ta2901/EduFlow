import { classWritesBlocked, joinBlockedReason, normalizeClassStatus } from '../classStatus'
import { prisma } from '../prisma'
import { generateUniqueClassCode } from '../utils/generateClassCode'
import { logActivitiesManyLater, logActivityLater } from './activityLog'
import { ensureClassChat } from './classChat'
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

/** Student dashboard only needs self on the roster — avoids loading full class lists. */
const classIncludeSelf = (studentId: string) =>
  ({
    enrollments: {
      where: { studentId },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
      },
    },
  }) as const

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
    const [classes, tasks, submissions] = await Promise.all([
      prisma.class.findMany({
        where: { teacherId: session.userId },
        include: classInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: { class: { teacherId: session.userId } },
        include: taskInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.submission.findMany({
        where: { task: { class: { teacherId: session.userId } } },
        include: submissionInclude,
      }),
    ])

    return {
      classes: classes.map(mapClassRoom),
      tasks: tasks.map(mapTask),
      submissions: submissions.map(mapSubmission),
    }
  }

  const [enrollments, tasks, submissions] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: { studentId: session.userId },
      include: { class: { include: classIncludeSelf(session.userId) } },
    }),
    prisma.task.findMany({
      where: { class: { enrollments: { some: { studentId: session.userId } } } },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.submission.findMany({
      where: { studentId: session.userId },
      include: submissionInclude,
    }),
  ])

  return {
    classes: enrollments.map((e) => mapClassRoom(e.class)),
    tasks: tasks.map(mapTask),
    submissions: submissions.map(mapSubmission),
  }
}

export async function createClassForTeacher(
  teacherId: string,
  input: { title: string; description: string; publish?: boolean }
) {
  const existingCodes = (await prisma.class.findMany({ select: { classCode: true } })).map(
    (c) => c.classCode
  )
  const status = input.publish ? 'published' : 'draft'

  const row = await prisma.class.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      classCode: generateUniqueClassCode(existingCodes),
      teacherId,
      status,
    },
    include: classInclude,
  })

  await ensureClassChat(row.id, row.title)

  logActivityLater({
    userId: teacherId,
    type: 'class_create',
    title: status === 'draft' ? 'Lưu nháp lớp học' : 'Tạo lớp học',
    message:
      status === 'draft'
        ? `Đã lưu nháp lớp "${row.title}" (mã ${row.classCode}). Học sinh chưa thể tham gia.`
        : `Đã phát hành lớp "${row.title}" (mã ${row.classCode})`,
    href: `/teacher/courses/${row.id}`,
    meta: { classId: row.id, classCode: row.classCode, status },
  })

  return mapClassRoom(row)
}

export async function joinClassByCode(studentId: string, _studentName: string, _studentEmail: string, code: string) {
  const classroom = await prisma.class.findFirst({
    where: { classCode: code.trim().toUpperCase() },
    select: {
      id: true,
      title: true,
      description: true,
      classCode: true,
      teacherId: true,
      status: true,
      createdAt: true,
      enrollments: { select: { studentId: true } },
    },
  })

  if (!classroom) {
    return { ok: false as const, error: 'Mã lớp không tồn tại. Vui lòng kiểm tra lại.' }
  }

  const blocked = joinBlockedReason(classroom.status)
  if (blocked) {
    return { ok: false as const, error: blocked }
  }

  if (classroom.enrollments.some((e) => e.studentId === studentId)) {
    return { ok: false as const, error: 'Bạn đã tham gia lớp này rồi.' }
  }

  await prisma.classEnrollment.create({
    data: { classId: classroom.id, studentId },
  })

  const [, tasks] = await Promise.all([
    ensureClassChat(classroom.id, classroom.title),
    prisma.task.findMany({
      where: { classId: classroom.id },
      select: { id: true },
    }),
  ])

  if (tasks.length > 0) {
    await prisma.submission.createMany({
      data: tasks.map((task) => ({
        taskId: task.id,
        studentId,
        status: 'not_submitted',
      })),
      skipDuplicates: true,
    })
  }

  const updated = await prisma.class.findUniqueOrThrow({
    where: { id: classroom.id },
    include: classIncludeSelf(studentId),
  })

  logActivityLater({
    userId: studentId,
    type: 'class_join',
    title: 'Tham gia lớp học',
    message: `Đã tham gia lớp "${classroom.title}" (mã ${classroom.classCode})`,
    href: `/student/courses/${classroom.id}`,
    meta: { classId: classroom.id, classCode: classroom.classCode },
  })

  return { ok: true as const, classId: classroom.id, classroom: mapClassRoom(updated) }
}

export async function updateClassForTeacher(
  teacherId: string,
  classId: string,
  input: { title: string; description: string }
) {
  const classroom = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: classInclude,
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')
  if (normalizeClassStatus(classroom.status) === 'cancelled') {
    throw new Error('Lớp đã bị huỷ, không thể chỉnh sửa')
  }

  const title = input.title.trim()
  if (!title) throw new Error('Vui lòng nhập tên lớp')

  const updated = await prisma.class.update({
    where: { id: classId },
    data: {
      title,
      description: input.description.trim(),
    },
    include: classInclude,
  })

  logActivityLater({
    userId: teacherId,
    type: 'class_update',
    title: 'Thay đổi lớp học',
    message: `Đã cập nhật lớp "${classroom.title}" → "${updated.title}"`,
    href: `/teacher/courses/${classId}`,
    meta: {
      classId,
      before: { title: classroom.title, description: classroom.description },
      after: { title: updated.title, description: updated.description },
    },
  })

  return mapClassRoom(updated)
}

export async function cancelClassForTeacher(teacherId: string, classId: string) {
  const classroom = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: classInclude,
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')
  if (normalizeClassStatus(classroom.status) === 'cancelled') {
    throw new Error('Lớp đã được huỷ trước đó')
  }

  const updated = await prisma.class.update({
    where: { id: classId },
    data: { status: 'cancelled' },
    include: classInclude,
  })

  logActivitiesManyLater([
    {
      userId: teacherId,
      type: 'class_cancel',
      title: 'Huỷ lớp học',
      message: `Đã huỷ lớp "${classroom.title}" (mã ${classroom.classCode})`,
      href: `/teacher/courses/${classId}`,
      meta: { classId, classCode: classroom.classCode },
    },
    ...classroom.enrollments.map((enrollment) => ({
      userId: enrollment.studentId,
      type: 'class_cancel' as const,
      title: 'Lớp học bị huỷ',
      message: `Lớp "${classroom.title}" đã bị giáo viên huỷ`,
      href: `/student/dashboard?tab=courses`,
      meta: { classId, classCode: classroom.classCode },
    })),
  ])

  return mapClassRoom(updated)
}

export async function setClassLifecycleForTeacher(
  teacherId: string,
  classId: string,
  action: 'publish' | 'archive' | 'reopen'
) {
  const classroom = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: classInclude,
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')

  const current = normalizeClassStatus(classroom.status)
  if (current === 'cancelled') throw new Error('Lớp đã bị huỷ, không thể đổi trạng thái')

  let next: 'published' | 'archived' | 'draft' = current
  if (action === 'publish') {
    if (current !== 'draft' && current !== 'archived') {
      throw new Error('Chỉ phát hành lớp đang nháp hoặc đã lưu trữ')
    }
    next = 'published'
  } else if (action === 'archive') {
    if (current !== 'published') throw new Error('Chỉ lưu trữ lớp đang phát hành')
    next = 'archived'
  } else {
    if (current !== 'archived') throw new Error('Chỉ mở lại lớp đã lưu trữ')
    next = 'published'
  }

  const updated = await prisma.class.update({
    where: { id: classId },
    data: { status: next },
    include: classInclude,
  })

  const log =
    next === 'archived'
      ? {
          type: 'class_archive' as const,
          title: 'Lưu trữ lớp học',
          message: `Đã lưu trữ lớp "${classroom.title}". Học sinh không thể tham gia mới.`,
        }
      : {
          type: 'class_publish' as const,
          title: current === 'archived' ? 'Mở lại lớp học' : 'Phát hành lớp học',
          message: `Đã phát hành lớp "${classroom.title}" (mã ${classroom.classCode}). Học sinh có thể tham gia.`,
        }

  logActivityLater({
    userId: teacherId,
    type: log.type,
    title: log.title,
    message: log.message,
    href: `/teacher/courses/${classId}`,
    meta: { classId, classCode: classroom.classCode, status: next },
  })

  return mapClassRoom(updated)
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
  const writeBlocked = classWritesBlocked(classroom.status)
  if (writeBlocked) throw new Error(writeBlocked)

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

  if (classroom.enrollments.length > 0) {
    await prisma.submission.createMany({
      data: classroom.enrollments.map((enrollment) => ({
        taskId: task.id,
        studentId: enrollment.studentId,
        status: 'not_submitted',
      })),
      skipDuplicates: true,
    })
  }

  const studentIds = classroom.enrollments.map((e) => e.studentId)
  if (studentIds.length > 0) {
    // Don't block the teacher response on fan-out notifications
    void notifyStudentsNewAssignment(studentIds, task.title, classroom.title, task.id)
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
    include: { class: { select: { teacherId: true, id: true, status: true } } },
  })
  if (!task) return { ok: false as const, error: 'Không tìm thấy bài tập' }
  const writeBlocked = classWritesBlocked(task.class.status)
  if (writeBlocked) return { ok: false as const, error: writeBlocked }

  const submission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId } },
    include: { student: { select: { fullName: true } } },
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

  void notifyTeacherSubmission(
    task.class.teacherId,
    updated.student.fullName,
    task.title,
    task.id
  )

  logActivityLater({
    userId: studentId,
    type: 'assignment_submit',
    title: 'Nộp bài tập',
    message: `Đã nộp bài "${task.title}"${late ? ' (muộn)' : ''}`,
    href: `/student/assignments/${taskId}`,
    meta: {
      taskId,
      classId: task.classId,
      status: late ? 'late' : 'submitted',
      fileCount: input.files.length,
    },
  })

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

  void notifyStudentGraded(
    submission.studentId,
    submission.task.title,
    grade,
    maxGrade,
    submission.taskId
  )

  return mapSubmission(updated)
}
