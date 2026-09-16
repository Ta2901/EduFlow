import { ratePracticeCard, savePracticeAnswers, submitPracticeAttempt } from '@/lib/server/practice'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

type Ctx = { params: { setId: string; attemptId: string } }

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const body = await req.json()
    if (body.action === 'save') {
      return jsonOk(await savePracticeAnswers(params.attemptId, session, body.answers ?? []))
    }
    if (body.action === 'submit') {
      return jsonOk(
        await submitPracticeAttempt(params.attemptId, session, {
          answers: body.answers,
          expired: Boolean(body.expired),
        })
      )
    }
    if (body.action === 'rate' || body.action === 'evaluate') {
      return jsonOk(
        await ratePracticeCard(params.attemptId, session, {
          questionId: body.questionId,
          optionId: body.optionId,
          timeSpentMs: body.timeSpentMs,
        })
      )
    }
    return jsonError('action không hợp lệ', 400)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}
