import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type Prisma } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaPool: Pool | undefined
}

const log: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']

function createPrismaClient() {
  const url = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '') ?? ''

  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    // Reuse one pool across HMR recreations to avoid leaking connections
    if (!globalForPrisma.prismaPool) {
      globalForPrisma.prismaPool = new Pool({
        connectionString: url,
        connectionTimeoutMillis: 60_000,
        max: 10,
      })
    }
    return new PrismaClient({ adapter: new PrismaPg(globalForPrisma.prismaPool), log })
  }

  return new PrismaClient({ log })
}

function isClientCurrent(client: PrismaClient | undefined): client is PrismaClient {
  // HMR may keep a PrismaClient created before schema models were added.
  const delegates = client as PrismaClient & {
    classChat?: { findUnique?: unknown }
    passwordResetToken?: { findUnique?: unknown }
    activityLog?: { findMany?: unknown }
    quickLoginToken?: { findUnique?: unknown; create?: unknown }
    teachingPlanItem?: { findMany?: unknown }
    sessionTeacherEval?: { findMany?: unknown }
    courseEvaluation?: { findMany?: unknown }
    practiceSet?: { findMany?: unknown }
    practiceCardState?: { findMany?: unknown }
  }
  return (
    typeof delegates?.classChat?.findUnique === 'function' &&
    typeof delegates?.passwordResetToken?.findUnique === 'function' &&
    typeof delegates?.activityLog?.findMany === 'function' &&
    typeof delegates?.quickLoginToken?.create === 'function' &&
    typeof delegates?.teachingPlanItem?.findMany === 'function' &&
    typeof delegates?.sessionTeacherEval?.findMany === 'function' &&
    typeof delegates?.courseEvaluation?.findMany === 'function' &&
    typeof delegates?.practiceSet?.findMany === 'function' &&
    typeof delegates?.practiceCardState?.findMany === 'function'
  )
}

function getPrismaClient(): PrismaClient {
  if (isClientCurrent(globalForPrisma.prisma)) {
    return globalForPrisma.prisma
  }

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

/**
 * Lazy proxy so each access re-validates the client after schema/HMR changes.
 * Avoids stale PrismaClient missing newly added models (e.g. QuickLoginToken).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
