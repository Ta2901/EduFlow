import { listAdminUsers } from '@/lib/server/admin'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const { searchParams } = new URL(req.url)
  try {
    const users = await listAdminUsers(session, {
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      q: searchParams.get('q') || undefined,
    })
    return jsonOk({ users })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải người dùng', 403)
  }
}
