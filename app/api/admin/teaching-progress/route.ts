import { getAdminTeachingProgress, remindTeacherAboutPlan } from '@/lib/server/teachingPlan'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const progress = await getAdminTeachingProgress(session)
    return jsonOk({ progress })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 403)
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const body = await req.json()
    const result = await remindTeacherAboutPlan(session, {
      teacherId: body.teacherId,
      classId: body.classId,
      message: body.message,
    })
    return jsonOk(result)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}
