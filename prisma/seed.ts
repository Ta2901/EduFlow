import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.notification.deleteMany()
  await prisma.sessionRecording.deleteMany()
  await prisma.sessionMessage.deleteMany()
  await prisma.onlineSession.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.scheduleSlot.deleteMany()
  await prisma.submissionFile.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.taskAttachment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.classEnrollment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.storedFile.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@eduflow.com',
      password: passwordHash,
      fullName: 'Cô Nguyễn Thị Lan',
      role: 'teacher',
      school: 'THPT EduFlow',
    },
  })

  const student = await prisma.user.create({
    data: {
      email: 'student@eduflow.com',
      password: passwordHash,
      fullName: 'Nguyễn Văn An',
      role: 'student',
      school: 'THPT EduFlow',
    },
  })

  const extraStudents = await Promise.all(
    [
      { fullName: 'Trần Thị Bình', email: 'binh.tran@student.edu' },
      { fullName: 'Lê Văn Cường', email: 'cuong.le@student.edu' },
      { fullName: 'Phạm Thị Dung', email: 'dung.pham@student.edu' },
      { fullName: 'Hoàng Văn Em', email: 'em.hoang@student.edu' },
    ].map((s) =>
      prisma.user.create({
        data: {
          email: s.email,
          password: passwordHash,
          fullName: s.fullName,
          role: 'student',
        },
      })
    )
  )

  const class1 = await prisma.class.create({
    data: {
      title: 'Toán học lớp 10A1',
      description: 'Khóa học toán học cơ bản cho học sinh lớp 10',
      classCode: 'MATH10A',
      teacherId: teacher.id,
    },
  })

  const class2 = await prisma.class.create({
    data: {
      title: 'Toán học lớp 10A2',
      description: 'Khóa học toán học nâng cao lớp 10',
      classCode: 'MATH10B',
      teacherId: teacher.id,
    },
  })

  const allStudents = [student, ...extraStudents]
  for (const s of allStudents) {
    await prisma.classEnrollment.create({
      data: { classId: class1.id, studentId: s.id },
    })
    if (s.id !== student.id) {
      await prisma.classEnrollment.create({
        data: { classId: class2.id, studentId: s.id },
      })
    }
  }

  const slotMon1 = await prisma.scheduleSlot.create({
    data: {
      classId: class1.id,
      dayOfWeek: 1,
      period: 1,
      subject: 'Toán học',
      startTime: '07:00',
      endTime: '07:45',
      room: 'P.201',
    },
  })

  await prisma.scheduleSlot.create({
    data: {
      classId: class1.id,
      dayOfWeek: 1,
      period: 2,
      subject: 'Toán học',
      startTime: '07:50',
      endTime: '08:35',
      room: 'P.201',
    },
  })

  await prisma.scheduleSlot.create({
    data: {
      classId: class1.id,
      dayOfWeek: 3,
      period: 1,
      subject: 'Toán học',
      startTime: '07:00',
      endTime: '07:45',
      room: 'P.201',
    },
  })

  await prisma.attendanceRecord.create({
    data: {
      classId: class1.id,
      scheduleSlotId: slotMon1.id,
      studentId: student.id,
      sessionDate: '2026-05-19',
      status: 'present',
    },
  })

  const task1 = await prisma.task.create({
    data: {
      classId: class1.id,
      title: 'Bài tập phương trình bậc nhất',
      description: 'Giải các bài tập từ 1 đến 15 trong sách giáo khoa trang 42-45.',
      dueDate: '2026-05-25',
      teacherId: teacher.id,
      attachments: {
        create: [
          {
            name: 'de-bai.pdf',
            size: 245000,
            type: 'application/pdf',
            url: '/uploads/demo-de-bai.pdf',
          },
        ],
      },
    },
  })

  const task2 = await prisma.task.create({
    data: {
      classId: class1.id,
      title: 'Kiểm tra 15 phút chương 1',
      description: 'Kiểm tra kiến thức phương trình bậc nhất và bậc hai.',
      dueDate: '2026-05-28',
      teacherId: teacher.id,
    },
  })

  for (const t of [task1, task2]) {
    for (const s of allStudents) {
      await prisma.submission.create({
        data: {
          taskId: t.id,
          studentId: s.id,
          status: 'not_submitted',
        },
      })
    }
  }

  await prisma.submission.update({
    where: { taskId_studentId: { taskId: task1.id, studentId: student.id } },
    data: {
      status: 'submitted',
      submittedAt: new Date('2026-05-18T10:30:00'),
      content: 'Đã hoàn thành bài tập 1-15, nộp file PDF.',
      grade: 9,
      maxGrade: 10,
      feedback: 'Bài làm tốt, trình bày rõ ràng. Cần chú ý bài 12 phần c.',
      gradedAt: new Date('2026-05-19T09:00:00'),
    },
  })

  await prisma.submission.update({
    where: {
      taskId_studentId: { taskId: task1.id, studentId: extraStudents[0].id },
    },
    data: {
      status: 'submitted',
      submittedAt: new Date('2026-05-19T14:20:00'),
      content: 'Em đã nộp bài ạ.',
    },
  })

  console.log('Seed OK — teacher@eduflow.com / student@eduflow.com — password: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
