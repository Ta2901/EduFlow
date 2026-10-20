import { listActivityForUser, logActivityForSession } from '@/lib/server/activityLog'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import type { ActivityLogType } from '@/lib/types'

const CLIENT_ALLOWED_TYPES = new Set<ActivityLogType>(['theme_change', 'language_change'])

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') || '100')
  const items = await listActivityForUser(session.userId, Number.isFinite(limit) ? limit : 100)
  return jsonOk({ items })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const body = await req.json().catch(() => ({}))
  const type = String(body.type || '') as ActivityLogType
  const title = String(body.title || '').trim()
  const message = String(body.message || '').trim()

  if (!CLIENT_ALLOWED_TYPES.has(type)) {
    return jsonError('Loại nhật ký không được phép', 400)
  }
  if (!title || !message) {
    return jsonError('Thiếu tiêu đề hoặc nội dung', 400)
  }

  const item = await logActivityForSession(session, {
    type,
    title,
    message,
    href: typeof body.href === 'string' ? body.href : undefined,
    meta: body.meta && typeof body.meta === 'object' ? body.meta : undefined,
  })

  return jsonOk({ item }, 201)
}
