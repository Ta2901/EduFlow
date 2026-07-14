import { jsonError, jsonOk } from '@/lib/server/http'
import { requestPasswordReset, type ResetChannel } from '@/lib/server/passwordReset'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const channel = String(body.channel || '') as ResetChannel
    const result = await requestPasswordReset({
      loginId: String(body.loginId || ''),
      channel,
      contact: String(body.contact || ''),
    })
    return jsonOk(result)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không gửi được mã OTP', 400)
  }
}
