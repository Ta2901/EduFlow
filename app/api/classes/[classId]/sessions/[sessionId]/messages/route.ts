import { listSessionMessages, postSessionMessage } from '@/lib/server/online'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(
  _req: Request,
  { params }: { params: { classId: string; sessionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const messages = await listSessionMessages(params.classId, params.sessionId, session)
    return jsonOk({ messages })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải tin nhắn', 400)
  }
}

export async function POST(
  req: Request,
  { params }: { params: { classId: string; sessionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const body = await req.json().catch(() => ({}))
  const content = String(body.content || '')
  const userName = String(body.userName || 'Người dùng')

  try {
    const message = await postSessionMessage(
      params.classId,
      params.sessionId,
      session,
      userName,
      content
    )
    return jsonOk({ message }, 201)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Gửi tin nhắn thất bại', 400)
  }
}
