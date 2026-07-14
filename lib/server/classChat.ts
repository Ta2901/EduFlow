import { prisma } from '../prisma'
import type { ClassChatMessage, ClassChatRoom } from '../types'
import type { SessionPayload } from './session'

function mapMessage(row: {
  id: string
  chatId: string
  userId: string
  userName: string
  memberCode: string | null
  role: string
  content: string
  createdAt: Date
}): ClassChatMessage {
  return {
    id: row.id,
    chatId: row.chatId,
    userId: row.userId,
    userName: row.userName,
    memberCode: row.memberCode ?? undefined,
    role: row.role as ClassChatMessage['role'],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }
}

function mapChat(row: {
  id: string
  classId: string
  name: string
  createdAt: Date
  class: {
    title: string
    teacherId: string
    teacher: { fullName: string; memberCode: string | null }
    enrollments: {
      student: { id: string; fullName: string; memberCode: string | null }
    }[]
  }
  _count?: { messages: number }
}): ClassChatRoom {
  return {
    id: row.id,
    classId: row.classId,
    name: row.name,
    classTitle: row.class.title,
    teacherId: row.class.teacherId,
    teacherName: row.class.teacher.fullName,
    memberCount: row.class.enrollments.length + 1,
    messageCount: row._count?.messages ?? 0,
    members: [
      {
        id: row.class.teacherId,
        name: row.class.teacher.fullName,
        memberCode: row.class.teacher.memberCode ?? undefined,
        role: 'teacher' as const,
      },
      ...row.class.enrollments.map((e) => ({
        id: e.student.id,
        name: e.student.fullName,
        memberCode: e.student.memberCode ?? undefined,
        role: 'student' as const,
      })),
    ],
    createdAt: row.createdAt.toISOString(),
  }
}

const chatInclude = {
  class: {
    include: {
      teacher: { select: { fullName: true, memberCode: true } },
      enrollments: {
        include: {
          student: { select: { id: true, fullName: true, memberCode: true } },
        },
      },
    },
  },
  _count: { select: { messages: true } },
} as const

/** Create class group chat if missing. Id is deterministic: classchat_<classId>. */
export async function ensureClassChat(classId: string, classTitle: string) {
  const existing = await prisma.classChat.findUnique({ where: { classId } })
  if (existing) {
    if (existing.name !== classTitle.trim()) {
      return prisma.classChat.update({
        where: { id: existing.id },
        data: { name: classTitle.trim() },
      })
    }
    return existing
  }

  return prisma.classChat.create({
    data: {
      id: `classchat_${classId}`,
      classId,
      name: classTitle.trim(),
    },
  })
}

async function assertClassChatAccess(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: { select: { studentId: true } }, chat: true },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp học')

  const isTeacher = session.role === 'teacher' && classroom.teacherId === session.userId
  const isStudent = classroom.enrollments.some((e) => e.studentId === session.userId)
  if (!isTeacher && !isStudent) throw new Error('Bạn chưa tham gia lớp này')

  const chat =
    classroom.chat ??
    (await ensureClassChat(classroom.id, classroom.title))

  return { classroom, chat, isTeacher }
}

export async function listClassChatsForUser(session: SessionPayload): Promise<ClassChatRoom[]> {
  if (session.role === 'teacher') {
    const classes = await prisma.class.findMany({
      where: { teacherId: session.userId },
      select: { id: true, title: true },
    })
    await Promise.all(classes.map((c) => ensureClassChat(c.id, c.title)))
  } else if (session.role === 'student') {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: session.userId },
      include: { class: { select: { id: true, title: true } } },
    })
    await Promise.all(enrollments.map((e) => ensureClassChat(e.class.id, e.class.title)))
  } else {
    return []
  }

  const where =
    session.role === 'teacher'
      ? { class: { teacherId: session.userId } }
      : { class: { enrollments: { some: { studentId: session.userId } } } }

  const rows = await prisma.classChat.findMany({
    where,
    include: chatInclude,
    orderBy: { createdAt: 'desc' },
  })

  return rows.map(mapChat)
}

export async function getClassChat(classId: string, session: SessionPayload) {
  const { chat } = await assertClassChatAccess(classId, session)
  const row = await prisma.classChat.findUniqueOrThrow({
    where: { id: chat.id },
    include: chatInclude,
  })
  return mapChat(row)
}

export async function listClassChatMessages(classId: string, session: SessionPayload) {
  const { chat } = await assertClassChatAccess(classId, session)
  const rows = await prisma.classChatMessage.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: 'asc' },
    take: 500,
  })
  return rows.map(mapMessage)
}

export async function postClassChatMessage(
  classId: string,
  session: SessionPayload,
  content: string
) {
  const text = content.trim()
  if (!text) throw new Error('Tin nhắn trống')
  if (text.length > 2000) throw new Error('Tin nhắn tối đa 2000 ký tự')

  const { chat } = await assertClassChatAccess(classId, session)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { id: true, fullName: true, memberCode: true, role: true },
  })

  const row = await prisma.classChatMessage.create({
    data: {
      chatId: chat.id,
      userId: user.id,
      userName: user.fullName,
      memberCode: user.memberCode,
      role: user.role,
      content: text,
    },
  })

  return mapMessage(row)
}
