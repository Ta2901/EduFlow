import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const body = await req.json()

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    })
    return jsonOk({ ok: true })
  }

  const id = String(body.id || '')
  if (!id) return jsonError('Thiếu id thông báo', 400)

  await prisma.notification.updateMany({
    where: { id, userId: session.userId },
    data: { read: true },
  })

  return jsonOk({ ok: true })
}
