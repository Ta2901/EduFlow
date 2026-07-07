import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import type { AppNotification } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const rows = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const notifications: AppNotification[] = rows.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type as AppNotification['type'],
    title: n.title,
    message: n.message,
    href: n.href ?? undefined,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    dedupeKey: n.dedupeKey ?? undefined,
  }))

  return jsonOk({ notifications })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const body = await req.json()
  const dedupeKey = body.dedupeKey ? String(body.dedupeKey) : undefined

  if (dedupeKey) {
    const existing = await prisma.notification.findUnique({
      where: { userId_dedupeKey: { userId: session.userId, dedupeKey } },
    })
    if (existing) return jsonOk({ notification: existing })
  }

  const notification = await prisma.notification.create({
    data: {
      userId: session.userId,
      type: String(body.type || 'deadline_reminder'),
      title: String(body.title || 'Thông báo'),
      message: String(body.message || ''),
      href: body.href ? String(body.href) : null,
      dedupeKey,
    },
  })

  return jsonOk({ notification }, 201)
}
