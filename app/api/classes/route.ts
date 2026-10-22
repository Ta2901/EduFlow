import { createClassForTeacher } from '@/lib/server/edu'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'teacher') return jsonError('Không có quyền', 403)

  try {
    await assertCanWrite(session)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không có quyền', 403)
  }

  const body = await req.json()
  const title = String(body.title || '').trim()
  if (!title) return jsonError('Vui lòng nhập tên lớp', 400)

  const classroom = await createClassForTeacher(session.userId, {
    title,
    description: String(body.description || ''),
    publish: Boolean(body.publish),
  })

  return jsonOk({ classroom }, 201)
}
