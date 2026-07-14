import { getAdminEvalOverview } from '@/lib/server/evaluations'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const overview = await getAdminEvalOverview(session)
    return jsonOk({ overview })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 403)
  }
}
