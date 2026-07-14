import { listClassChatsForUser } from '@/lib/server/classChat'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return jsonError('Chưa đăng nhập', 401)
    if (session.role !== 'student' && session.role !== 'teacher') {
      return jsonError('Không có quyền', 403)
    }
    const chats = await listClassChatsForUser(session)
    return jsonOk({ chats })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không tải được danh sách chat', 500)
  }
}
