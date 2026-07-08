import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  ADMIN_DEFAULT_PASSWORD,
  ADMIN_LOGIN_ID,
  LEGACY_ADMIN_LOGIN_ID,
} from '../lib/constants/accounts'

const prisma = new PrismaClient()

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

async function ensureAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: 'admin' } })

  if (!existing) {
    return prisma.user.create({
      data: {
        email: ADMIN_LOGIN_ID,
        password: await hashPassword(ADMIN_DEFAULT_PASSWORD),
        fullName: 'Quản trị viên EduFlow',
        role: 'admin',
        accountStatus: 'active',
        approvedAt: new Date(),
        school: 'THPT EduFlow',
      },
    })
  }

  if (existing.email === LEGACY_ADMIN_LOGIN_ID) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email: ADMIN_LOGIN_ID,
        password: await hashPassword(ADMIN_DEFAULT_PASSWORD),
      },
    })
  }

  return existing
}

async function ensureUser(input: {
  email: string
  memberCode?: string
  fullName: string
  role: 'teacher' | 'student'
  password: string
  school?: string
}) {
  const found = await prisma.user.findUnique({ where: { email: input.email } })
  if (found) return found

  return prisma.user.create({
    data: {
      email: input.email,
      memberCode: input.memberCode,
      password: await hashPassword(input.password),
      fullName: input.fullName,
      role: input.role,
      accountStatus: 'active',
      approvedAt: new Date(),
      school: input.school,
    },
  })
}

async function seedDemoContent() {
  const classCount = await prisma.class.count()
  if (classCount > 0) {
    console.log('Demo classes already exist — skipping demo content seed.')
    return
  }

  const demoPassword = 'password123'
  const teacher = await ensureUser({
    memberCode: '100001',
    email: 'teacher@eduflow.com',
    fullName: 'Cô Nguyễn Thị Lan',
    role: 'teacher',
    password: demoPassword,
    school: 'THPT EduFlow',
  })

  const student = await ensureUser({
    memberCode: '100002',
    email: 'student@eduflow.com',
    fullName: 'Nguyễn Văn An',
    role: 'student',
    password: demoPassword,
    school: 'THPT EduFlow',
  })

  const extraStudents = await Promise.all(
    [
      { fullName: 'Trần Thị Bình', email: 'binh.tran@student.edu', memberCode: '100003' },
      { fullName: 'Lê Văn Cường', email: 'cuong.le@student.edu', memberCode: '100004' },
      { fullName: 'Phạm Thị Dung', email: 'dung.pham@student.edu', memberCode: '100005' },
      { fullName: 'Hoàng Văn Em', email: 'em.hoang@student.edu', memberCode: '100006' },
    ].map((s) =>
      ensureUser({
        memberCode: s.memberCode,
        email: s.email,
        fullName: s.fullName,
        role: 'student',
        password: demoPassword,
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
}

async function resetAllData() {
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
}

async function main() {
  const forceReset = process.env.SEED_RESET === 'true'

  if (forceReset) {
    console.log('SEED_RESET=true — wiping all data before seeding...')
    await resetAllData()
    await ensureAdmin()
    await seedDemoContent()
    console.log(
      `Reset seed OK — admin: ${ADMIN_LOGIN_ID} / ${ADMIN_DEFAULT_PASSWORD} | demo GV/HS: password123`
    )
    return
  }

  await ensureAdmin()
  await seedDemoContent()

  console.log(
    `Seed OK (non-destructive) — admin: ${ADMIN_LOGIN_ID} | existing user passwords preserved`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
