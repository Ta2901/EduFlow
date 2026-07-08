import { gradeSubmissionById } from '@/lib/server/edu'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function PATCH(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'teacher') return jsonError('Không có quyền', 403)

  try {
    await assertCanWrite(session)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không có quyền', 403)
  }

  const body = await req.json()
  const grade = Number(body.grade)
  const maxGrade = Number(body.maxGrade) || 10
  const feedback = String(body.feedback || '')

  if (Number.isNaN(grade)) return jsonError('Nhập điểm hợp lệ', 400)

  try {
    const submission = await gradeSubmissionById(
      session.userId,
      params.submissionId,
      grade,
      maxGrade,
      feedback
    )
    return jsonOk({ submission })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Chấm điểm thất bại', 400)
  }
}
