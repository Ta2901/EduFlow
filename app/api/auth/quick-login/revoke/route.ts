import { jsonError, jsonOk } from '@/lib/server/http'
import { revokeQuickLoginByRawToken, revokeQuickLoginToken } from '@/lib/server/quickLogin'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const tokenId = String(body.tokenId || '').trim()
    const token = String(body.token || '').trim()

    if (tokenId) {
      await revokeQuickLoginToken(tokenId)
      return jsonOk({ ok: true })
    }
    if (token) {
      await revokeQuickLoginByRawToken(token)
      return jsonOk({ ok: true })
    }
    return jsonError('Thiếu tokenId hoặc token', 400)
  } catch {
    return jsonError('Không thể huỷ đăng nhập nhanh', 400)
  }
}
