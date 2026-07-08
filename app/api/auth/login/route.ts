import { prisma } from '@/lib/prisma'
import { assertCanLogin } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { verifyPassword } from '@/lib/server/password'
import { setSessionCookie, toSessionUser } from '@/lib/server/session'
import type { UserRole } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const loginId = String(body.email || '').trim()
    const password = String(body.password || '')

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId.toLowerCase() },
          { memberCode: loginId },
        ],
      },
    })
    if (!user || !(await verifyPassword(password, user.password))) {
      return jsonError('Mã tài khoản/email hoặc mật khẩu không đúng', 401)
    }

    try {
      await assertCanLogin(user.id)
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : 'Không thể đăng nhập', 403)
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    })
    return jsonOk({ user: toSessionUser(user) })
  } catch {
    return jsonError('Đăng nhập thất bại', 500)
  }
}
