import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type Prisma } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const log: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']

function createPrismaClient() {
  const url = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '') ?? ''

  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    const pool = new Pool({
      connectionString: url,
      connectionTimeoutMillis: 60_000,
    })
    return new PrismaClient({ adapter: new PrismaPg(pool), log })
  }

  return new PrismaClient({ log })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
