import { getAdminOverview } from '@/lib/server/admin'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const overview = await getAdminOverview(session)
    return jsonOk({ overview })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu', 403)
  }
}
