import { jsonOk } from '@/lib/server/http'
import { clearSessionCookie } from '@/lib/server/session'

export async function POST() {
  clearSessionCookie()
  return jsonOk({ ok: true })
}
