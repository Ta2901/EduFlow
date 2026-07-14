import { prisma } from '@/lib/prisma'
import { assertCanLoginUser } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { verifyPassword } from '@/lib/server/password'
import { issueQuickLoginToken } from '@/lib/server/quickLogin'
import { setSessionCookie, toSessionUser } from '@/lib/server/session'
import type { UserRole } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const loginId = String(body.email || '').trim()
    const password = String(body.password || '')
    const enableQuickLogin = Boolean(body.enableQuickLogin)

    if (!loginId || !password) {
      return jsonError('Vui lòng nhập tài khoản và mật khẩu', 400)
    }

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
      assertCanLoginUser(user)
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : 'Không thể đăng nhập', 403)
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    })

    let quickLogin: { tokenId: string; token: string; expiresAt: string } | undefined
    if (enableQuickLogin) {
      try {
        quickLogin = await issueQuickLoginToken(user.id, loginId)
      } catch (err) {
        // Never fail the whole login just because quick-login token could not be issued
        console.error('[login] issueQuickLoginToken failed', err)
      }
    }

    return jsonOk({ user: toSessionUser(user), quickLogin })
  } catch (err) {
    console.error('[login] failed', err)
    return jsonError(
      err instanceof Error ? err.message : 'Đăng nhập thất bại',
      500
    )
  }
}
