import { jsonError, jsonOk } from '@/lib/server/http'
import { loginWithQuickToken } from '@/lib/server/quickLogin'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = String(body.token || '').trim()
    if (!token) return jsonError('Thiếu mã đăng nhập nhanh', 400)

    const user = await loginWithQuickToken(token)
    return jsonOk({ user })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Đăng nhập nhanh thất bại', 401)
  }
}
