import type { ClassRoom, ClassStudent, Submission, Task, TaskAttachment } from '../types'

type ClassWithRelations = {
  id: string
  title: string
  description: string
  classCode: string
  teacherId: string
  status?: string
  createdAt: Date
  enrollments: {
    student: { id: string; fullName: string; email: string }
  }[]
}

type TaskWithAttachments = {
  id: string
  classId: string
  title: string
  description: string
  dueDate: string
  teacherId: string
  createdAt: Date
  attachments: { id: string; name: string; size: number; type: string; url: string }[]
}

type SubmissionWithRelations = {
  id: string
  taskId: string
  studentId: string
  status: string
  content: string | null
  submittedAt: Date | null
  grade: number | null
  maxGrade: number | null
  feedback: string | null
  gradedAt: Date | null
  student: { fullName: string; email: string }
  files: { id: string; name: string; size: number; url: string }[]
}

export function mapClassStudent(enrollment: ClassWithRelations['enrollments'][0]): ClassStudent {
  return {
    id: enrollment.student.id,
    name: enrollment.student.fullName,
    email: enrollment.student.email,
  }
}

export function mapClassRoom(row: ClassWithRelations): ClassRoom {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    classCode: row.classCode,
    teacherId: row.teacherId,
    status: row.status === 'cancelled' ? 'cancelled' : 'active',
    students: row.enrollments.map(mapClassStudent),
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapTask(row: TaskWithAttachments): Task {
  return {
    id: row.id,
    classId: row.classId,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate,
    teacherId: row.teacherId,
    createdAt: row.createdAt.toISOString(),
    attachments: row.attachments.map(
      (a): TaskAttachment => ({
        id: a.id,
        name: a.name,
        size: a.size,
        type: a.type,
        url: a.url,
      })
    ),
  }
}

export function mapSubmission(row: SubmissionWithRelations): Submission {
  return {
    id: row.id,
    taskId: row.taskId,
    studentId: row.studentId,
    studentName: row.student.fullName,
    studentEmail: row.student.email,
    status: row.status as Submission['status'],
    submittedAt: row.submittedAt?.toISOString(),
    content: row.content ?? undefined,
    grade: row.grade ?? undefined,
    maxGrade: row.maxGrade ?? undefined,
    feedback: row.feedback ?? undefined,
    gradedAt: row.gradedAt?.toISOString(),
    submittedFiles: row.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      url: f.url,
    })),
  }
}
