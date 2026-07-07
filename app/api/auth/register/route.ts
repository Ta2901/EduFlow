import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/server/http'
import { hashPassword } from '@/lib/server/password'
import { setSessionCookie, toSessionUser } from '@/lib/server/session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const password = String(body.password || '')
    const fullName = String(body.fullName || '').trim()
    const role = body.role === 'teacher' ? 'teacher' : 'student'

    if (!email || !password || !fullName) {
      return jsonError('Vui lòng điền đầy đủ thông tin', 400)
    }
    if (password.length < 6) {
      return jsonError('Mật khẩu phải có ít nhất 6 ký tự', 400)
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return jsonError('Email đã được sử dụng', 409)

    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
        fullName,
        role,
        phone: body.phone?.trim() || null,
        school: body.school?.trim() || null,
      },
    })

    await setSessionCookie({ userId: user.id, email: user.email, role: user.role as 'student' | 'teacher' })
    return jsonOk({ user: toSessionUser(user) }, 201)
  } catch {
    return jsonError('Đăng ký thất bại', 500)
  }
}
