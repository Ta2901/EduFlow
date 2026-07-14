import { prisma } from '../prisma'
import { mapSubmission, mapTask } from './mappers'
import type { SessionPayload } from './session'
import type { StudentClassProgress } from '../types'
import { getStudentAttendanceHistory } from './schedule'

export async function getStudentProgressInClass(
  classId: string,
  studentId: string,
  session: SessionPayload
): Promise<StudentClassProgress> {
  if (session.role !== 'teacher') {
    throw new Error('Chỉ giáo viên mới xem được tiến trình học sinh')
  }

  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      enrollments: {
        where: { studentId },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              memberCode: true,
              phone: true,
            },
          },
        },
      },
    },
  })

  if (!classroom) throw new Error('Không tìm thấy lớp học')
  if (classroom.teacherId !== session.userId) throw new Error('Không có quyền với lớp này')

  const enrollment = classroom.enrollments[0]
  if (!enrollment) throw new Error('Học sinh chưa thuộc lớp này')

  const tasks = await prisma.task.findMany({
    where: { classId },
    include: { attachments: true },
    orderBy: { dueDate: 'asc' },
  })

  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      taskId: { in: tasks.map((t) => t.id) },
    },
    include: {
      student: { select: { fullName: true, email: true } },
      files: true,
    },
  })

  const submissionByTask = new Map(submissions.map((s) => [s.taskId, mapSubmission(s)]))
  const mappedTasks = tasks.map(mapTask)

  const taskRows = mappedTasks.map((task) => ({
    task,
    submission: submissionByTask.get(task.id) ?? null,
  }))

  const submitted = taskRows.filter(
    (r) => r.submission && (r.submission.status === 'submitted' || r.submission.status === 'late')
  ).length
  const late = taskRows.filter((r) => r.submission?.status === 'late').length
  const notSubmitted = taskRows.filter(
    (r) => !r.submission || r.submission.status === 'not_submitted'
  ).length
  const gradedRows = taskRows.filter((r) => r.submission?.grade != null)
  const graded = gradedRows.length
  const averageScore =
    graded === 0
      ? null
      : gradedRows.reduce((sum, r) => {
          const s = r.submission!
          return sum + ((s.grade ?? 0) / (s.maxGrade || 10)) * 10
        }, 0) / graded

  const attendanceHistory = await getStudentAttendanceHistory(classId, studentId, session)
  const present = attendanceHistory.filter((a) => a.status === 'present').length
  const lateAtt = attendanceHistory.filter((a) => a.status === 'late').length
  const absent = attendanceHistory.filter((a) => a.status === 'absent').length
  const attTotal = attendanceHistory.length

  return {
    student: {
      id: enrollment.student.id,
      fullName: enrollment.student.fullName,
      email: enrollment.student.email,
      memberCode: enrollment.student.memberCode ?? undefined,
      phone: enrollment.student.phone ?? undefined,
    },
    classroom: {
      id: classroom.id,
      title: classroom.title,
      classCode: classroom.classCode,
    },
    joinedAt: enrollment.joinedAt.toISOString(),
    summary: {
      totalTasks: mappedTasks.length,
      submitted,
      notSubmitted,
      late,
      graded,
      completionRate: mappedTasks.length === 0 ? 0 : Math.round((submitted / mappedTasks.length) * 100),
      averageScore: averageScore == null ? null : Number(averageScore.toFixed(1)),
      attendance: {
        present,
        late: lateAtt,
        absent,
        total: attTotal,
        presentRate: attTotal === 0 ? 0 : Math.round((present / attTotal) * 100),
      },
    },
    tasks: taskRows,
    attendanceHistory,
  }
}
