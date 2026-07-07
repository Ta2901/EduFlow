import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/server/http'
import { verifyPassword } from '@/lib/server/password'
import { setSessionCookie, toSessionUser } from '@/lib/server/session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const password = String(body.password || '')

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await verifyPassword(password, user.password))) {
      return jsonError('Email hoặc mật khẩu không đúng', 401)
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role as 'student' | 'teacher',
    })
    return jsonOk({ user: toSessionUser(user) })
  } catch {
    return jsonError('Đăng nhập thất bại', 500)
  }
}
