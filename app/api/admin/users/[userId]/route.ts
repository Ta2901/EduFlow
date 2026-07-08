import { updateAdminUser } from '@/lib/server/admin'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import type { AccountStatus } from '@/lib/types'

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const body = await req.json().catch(() => ({}))
  try {
    const result = await updateAdminUser(session, params.userId, {
      action: String(body.action || ''),
      status: body.status as AccountStatus | undefined,
      statusNote: body.statusNote ? String(body.statusNote) : undefined,
      newPassword: body.newPassword ? String(body.newPassword) : undefined,
    })
    if ('temporaryPassword' in result) {
      return jsonOk(result)
    }
    return jsonOk({ user: result })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Cập nhật thất bại', 400)
  }
}
