import { joinClassByCode } from '@/lib/server/edu'
import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'student') return jsonError('Chỉ học sinh mới tham gia lớp', 403)

  const body = await req.json()
  const code = String(body.code || '').trim()
  if (!code) return jsonError('Vui lòng nhập mã lớp', 400)

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } })
  const result = await joinClassByCode(session.userId, user.fullName, user.email, code)

  if (!result.ok) return jsonError(result.error, 400)
  return jsonOk({ classId: result.classId, classroom: result.classroom })
}
