import { updateAdminClassRoster } from '@/lib/server/admin'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function PUT(
  req: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const body = await req.json().catch(() => ({}))
  const studentIds = Array.isArray(body.studentIds)
    ? body.studentIds.map((id: unknown) => String(id))
    : []

  try {
    const roster = await updateAdminClassRoster(session, params.classId, studentIds)
    return jsonOk({ roster })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Cập nhật danh sách thất bại', 400)
  }
}
