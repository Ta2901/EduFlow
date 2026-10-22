import { getAdminInbox } from '@/lib/server/adminInbox'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const inbox = await getAdminInbox(session)
    return jsonOk({ inbox })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải thông báo', 403)
  }
}
