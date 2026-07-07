import { prisma } from '@/lib/prisma'
import { jsonOk } from '@/lib/server/http'
import { getSession, toSessionUser } from '@/lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonOk({ user: null })

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return jsonOk({ user: null })

  return jsonOk({ user: toSessionUser(user) })
}
