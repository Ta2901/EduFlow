import { changePasswordForSession } from '@/lib/server/passwordChange'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role === 'admin') {
    return jsonError('Tài khoản admin không đổi mật khẩu tại đây', 400)
  }

  const body = await req.json().catch(() => ({}))
  const currentPassword = String(body.currentPassword || '')
  const newPassword = String(body.newPassword || '')

  if (!currentPassword || !newPassword) {
    return jsonError('Vui lòng nhập đầy đủ mật khẩu', 400)
  }

  try {
    await changePasswordForSession(currentPassword, newPassword)
    return jsonOk({ ok: true, message: 'Đã đổi mật khẩu thành công' })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Đổi mật khẩu thất bại', 400)
  }
}
