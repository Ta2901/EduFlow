import { getAdminWorkStats } from '@/lib/server/admin'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const stats = await getAdminWorkStats(session)
    return jsonOk({ stats })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không tải được thống kê', 403)
  }
}
