import { prisma } from '../prisma'
import type { ActivityLogItem, ActivityLogType } from '../types'
import type { SessionPayload } from './session'

export async function logActivity(input: {
  userId: string
  type: ActivityLogType | string
  title: string
  message: string
  href?: string
  meta?: Record<string, unknown>
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href,
        meta: JSON.stringify(input.meta ?? {}),
      },
    })
  } catch (err) {
    console.error('[activity-log]', err)
    return null
  }
}

/** Fire-and-forget — do not await on request critical path */
export function logActivityLater(
  input: Parameters<typeof logActivity>[0]
): void {
  void logActivity(input)
}

export async function logActivitiesMany(
  inputs: Array<Parameters<typeof logActivity>[0]>
) {
  if (inputs.length === 0) return
  try {
    await prisma.activityLog.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href,
        meta: JSON.stringify(input.meta ?? {}),
      })),
    })
  } catch (err) {
    console.error('[activity-log-many]', err)
  }
}

export function logActivitiesManyLater(
  inputs: Array<Parameters<typeof logActivity>[0]>
): void {
  void logActivitiesMany(inputs)
}

export async function logActivityForSession(
  session: SessionPayload,
  input: Omit<Parameters<typeof logActivity>[0], 'userId'>
) {
  return logActivity({ ...input, userId: session.userId })
}

function mapActivity(row: {
  id: string
  userId: string
  type: string
  title: string
  message: string
  href: string | null
  meta: string
  createdAt: Date
}): ActivityLogItem {
  let meta: Record<string, unknown> = {}
  try {
    meta = JSON.parse(row.meta || '{}') as Record<string, unknown>
  } catch {
    meta = {}
  }
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as ActivityLogType,
    title: row.title,
    message: row.message,
    href: row.href ?? undefined,
    meta,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listActivityForUser(userId: string, limit = 100) {
  const rows = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200),
  })
  return rows.map(mapActivity)
}
