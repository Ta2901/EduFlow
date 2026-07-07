import { getOnlineSession } from '@/lib/server/online'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const onlineSession = await getOnlineSession(params.sessionId, session)
    return jsonOk({ session: onlineSession })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không tìm thấy buổi học', 400)
  }
}
