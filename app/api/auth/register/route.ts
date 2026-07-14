import { assignUniqueMemberCode } from '@/lib/server/memberCode'
import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/server/http'
import { hashPassword } from '@/lib/server/password'
import { toSessionUser } from '@/lib/server/session'

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

    const memberCode = await assignUniqueMemberCode()

    const user = await prisma.user.create({
      data: {
        memberCode,
        email,
        password: await hashPassword(password),
        fullName,
        role,
        accountStatus: 'pending',
        phone: body.phone?.trim() || null,
        recoveryEmail: body.recoveryEmail?.trim().toLowerCase() || null,
        school: body.school?.trim() || null,
      },
    })

    return jsonOk(
      {
        pending: true,
        message: 'Đăng ký thành công. Tài khoản đang chờ quản trị viên phê duyệt.',
        memberCode,
        user: toSessionUser(user),
      },
      201
    )
  } catch {
    return jsonError('Đăng ký thất bại', 500)
  }
}
