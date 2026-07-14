import { assertCanWrite } from '@/lib/server/account'
import {
  getClassChat,
  listClassChatMessages,
  postClassChatMessage,
} from '@/lib/server/classChat'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(
  _req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Chưa đăng nhập', 401)
    if (session.role !== 'student' && session.role !== 'teacher') {
      return jsonError('Không có quyền', 403)
    }

    const [chat, messages] = await Promise.all([
      getClassChat(params.classId, session),
      listClassChatMessages(params.classId, session),
    ])
    return jsonOk({ chat, messages })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không tải được chat', 403)
  }
}

export async function POST(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Chưa đăng nhập', 401)
    if (session.role !== 'student' && session.role !== 'teacher') {
      return jsonError('Không có quyền', 403)
    }
    await assertCanWrite(session)

    const body = await req.json()
    const message = await postClassChatMessage(
      params.classId,
      session,
      String(body.content || '')
    )
    return jsonOk({ message })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Gửi tin nhắn thất bại', 403)
  }
}
