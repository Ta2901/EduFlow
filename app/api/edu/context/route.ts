import { getEduContext } from '@/lib/server/edu'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const context = await getEduContext(session)
  return jsonOk(context)
}
