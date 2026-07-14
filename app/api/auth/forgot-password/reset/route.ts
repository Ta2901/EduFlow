import { jsonError, jsonOk } from '@/lib/server/http'
import { resetPasswordWithOtp } from '@/lib/server/passwordReset'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await resetPasswordWithOtp({
      requestId: String(body.requestId || ''),
      code: String(body.code || ''),
      newPassword: String(body.newPassword || ''),
    })
    return jsonOk(result)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Đặt lại mật khẩu thất bại', 400)
  }
}
