import { cancelClassForTeacher, updateClassForTeacher } from '@/lib/server/edu'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function PATCH(
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
  const title = String(body.title || '').trim()
  if (!title) return jsonError('Vui lòng nhập tên lớp', 400)

  try {
    const classroom = await updateClassForTeacher(session.userId, params.classId, {
      title,
      description: String(body.description || ''),
    })
    return jsonOk({ classroom })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không thể cập nhật lớp', 400)
  }
}

export async function DELETE(
  _req: Request,
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

  try {
    const classroom = await cancelClassForTeacher(session.userId, params.classId)
    return jsonOk({ classroom, message: 'Đã huỷ lớp học' })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không thể huỷ lớp', 400)
  }
}
