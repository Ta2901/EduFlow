import {
  createOnlineSession,
  listClassRecordings,
  listOnlineSessions,
} from '@/lib/server/online'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(
  _req: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const sessions = await listOnlineSessions(params.classId, session)
    const recordings = await listClassRecordings(params.classId, session)
    return jsonOk({ sessions, recordings })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải buổi học online', 400)
  }
}

export async function POST(
  req: Request,
  { params }: { params: { classId: string } }
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
  try {
    const onlineSession = await createOnlineSession(params.classId, session.userId, {
      title: String(body.title || ''),
      scheduleSlotId: body.scheduleSlotId ? String(body.scheduleSlotId) : undefined,
    })
    return jsonOk({ session: onlineSession }, 201)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không thể tạo buổi học', 400)
  }
}
