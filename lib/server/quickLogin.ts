import { createHash, randomBytes } from 'crypto'
import { prisma } from '../prisma'
import { assertCanLoginUser } from './account'
import { setSessionCookie, toSessionUser } from './session'
import type { SessionUser, UserRole } from '../types'

const QUICK_LOGIN_TTL_DAYS = 90
const MAX_TOKENS_PER_USER = 5

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex')
}

function newRawToken() {
  return randomBytes(32).toString('hex')
}

function assertQuickLoginDelegate() {
  const client = prisma as typeof prisma & {
    quickLoginToken?: { findMany?: unknown; create?: unknown }
  }
  if (typeof client.quickLoginToken?.create !== 'function') {
    throw new Error(
      'Prisma client chưa có QuickLoginToken — chạy npx prisma generate và restart server'
    )
  }
}

export async function issueQuickLoginToken(userId: string, label = '') {
  assertQuickLoginDelegate()

  const raw = newRawToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + QUICK_LOGIN_TTL_DAYS)

  const existing = await prisma.quickLoginToken.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  if (existing.length >= MAX_TOKENS_PER_USER) {
    const overflow = existing.slice(0, existing.length - MAX_TOKENS_PER_USER + 1)
    await prisma.quickLoginToken.updateMany({
      where: { id: { in: overflow.map((t) => t.id) } },
      data: { revokedAt: new Date() },
    })
  }

  const row = await prisma.quickLoginToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      label: label.slice(0, 80),
      expiresAt,
    },
  })

  return { tokenId: row.id, token: raw, expiresAt: row.expiresAt.toISOString() }
}

export async function loginWithQuickToken(rawToken: string): Promise<SessionUser> {
  assertQuickLoginDelegate()

  const tokenHash = hashToken(rawToken.trim())
  const row = await prisma.quickLoginToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!row || row.revokedAt) {
    throw new Error('Phiên đăng nhập nhanh không còn hiệu lực')
  }
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.quickLoginToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    })
    throw new Error('Phiên đăng nhập nhanh đã hết hạn')
  }

  assertCanLoginUser(row.user)

  await setSessionCookie({
    userId: row.user.id,
    email: row.user.email,
    role: row.user.role as UserRole,
  })

  void prisma.quickLoginToken
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => console.error('[quick-login] lastUsedAt', err))

  return toSessionUser(row.user)
}

export async function revokeQuickLoginToken(tokenId: string, userId?: string) {
  assertQuickLoginDelegate()
  await prisma.quickLoginToken.updateMany({
    where: {
      id: tokenId,
      ...(userId ? { userId } : {}),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}

export async function revokeQuickLoginByRawToken(rawToken: string) {
  assertQuickLoginDelegate()
  const tokenHash = hashToken(rawToken.trim())
  await prisma.quickLoginToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllQuickLoginsForUser(userId: string) {
  try {
    assertQuickLoginDelegate()
  } catch {
    return
  }
  await prisma.quickLoginToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
