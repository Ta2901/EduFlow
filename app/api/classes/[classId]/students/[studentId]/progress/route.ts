import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import { getStudentProgressInClass } from '@/lib/server/studentProgress'

export async function GET(
  _req: Request,
  { params }: { params: { classId: string; studentId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Chưa đăng nhập', 401)
    if (session.role !== 'teacher') return jsonError('Không có quyền', 403)

    const progress = await getStudentProgressInClass(params.classId, params.studentId, session)
    return jsonOk({ progress })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không tải được tiến trình', 403)
  }
}
