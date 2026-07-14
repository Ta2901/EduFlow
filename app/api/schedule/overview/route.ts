import { listScheduleOverview } from '@/lib/server/schedule'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'student' && session.role !== 'teacher') {
    return jsonError('Không có quyền', 403)
  }

  try {
    const data = await listScheduleOverview(session)
    return jsonOk(data)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không tải được lịch', 400)
  }
}
