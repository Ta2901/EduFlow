import {
  getSessionEvalSummary,
  listPendingSessionEvals,
  submitSessionEval,
} from '@/lib/server/evaluations'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

type Ctx = { params: { classId: string } }

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view')
    if (view === 'summary' || session.role !== 'student') {
      const summary = await getSessionEvalSummary(params.classId, session)
      return jsonOk({ summary })
    }
    const pending = await listPendingSessionEvals(params.classId, session)
    return jsonOk({ pending })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 403)
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const body = await req.json()
    const result = await submitSessionEval(session, {
      classId: params.classId,
      sessionKey: body.sessionKey,
      onlineSessionId: body.onlineSessionId,
      rating: body.rating,
      comment: body.comment,
    })
    return jsonOk({ eval: result })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}
