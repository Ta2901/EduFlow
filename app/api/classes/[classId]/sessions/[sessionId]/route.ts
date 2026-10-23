import {
  endOnlineSession,
  getOnlineSession,
  startOnlineSession,
  updateOnlineSessionDetails,
} from '@/lib/server/online'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(
  _req: Request,
  { params }: { params: { classId: string; sessionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const onlineSession = await getOnlineSession(params.sessionId, session)
    if (onlineSession.classId !== params.classId) {
      return jsonError('Buổi học không thuộc lớp này', 400)
    }
    return jsonOk({ session: onlineSession })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không tìm thấy buổi học', 400)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { classId: string; sessionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'teacher') return jsonError('Không có quyền', 403)

  try {
    await assertCanWrite(session)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không có quyền', 403)
  }

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')

  try {
    if (action === 'start') {
      const onlineSession = await startOnlineSession(params.sessionId, params.classId, session.userId)
      return jsonOk({ session: onlineSession })
    }
    if (action === 'end') {
      const onlineSession = await endOnlineSession(params.sessionId, params.classId, session.userId)
      return jsonOk({ session: onlineSession })
    }
    if (action === 'update') {
      const onlineSession = await updateOnlineSessionDetails(
        params.sessionId,
        params.classId,
        session.userId,
        {
          title: body.title !== undefined ? String(body.title) : undefined,
          meetingUrl: body.meetingUrl !== undefined ? String(body.meetingUrl) : undefined,
          scheduledAt: body.scheduledAt !== undefined ? (body.scheduledAt ? String(body.scheduledAt) : null) : undefined,
        }
      )
      return jsonOk({ session: onlineSession })
    }
    return jsonError('Hành động không hợp lệ', 400)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Cập nhật thất bại', 400)
  }
}
