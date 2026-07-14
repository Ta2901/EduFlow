import {
  listCourseEvals,
  setCourseEvalStatus,
  submitCourseEvalResponse,
} from '@/lib/server/evaluations'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

type Ctx = { params: { classId: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const data = await listCourseEvals(params.classId, session)
    return jsonOk(data)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 403)
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const body = await req.json()
    if (body.action === 'setStatus') {
      const evaluation = await setCourseEvalStatus(
        params.classId,
        body.kind,
        session,
        body.status
      )
      return jsonOk({ evaluation })
    }
    if (body.action === 'respond') {
      const response = await submitCourseEvalResponse(session, {
        evaluationId: body.evaluationId,
        teachingQuality: body.teachingQuality,
        contentClarity: body.contentClarity,
        pacing: body.pacing,
        comment: body.comment,
      })
      return jsonOk({ response })
    }
    return jsonError('action không hợp lệ', 400)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}
