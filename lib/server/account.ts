import { prisma } from '../prisma'
import type { AccountStatus } from '../types'
import type { SessionPayload } from './session'

export { ACCOUNT_STATUS_LABELS } from '../format'

export function loginErrorForStatus(status: AccountStatus): string | null {
  if (status === 'pending') {
    return 'Tài khoản đang chờ quản trị viên phê duyệt.'
  }
  if (status === 'suspended') {
    return 'Tài khoản đã bị đình chỉ. Vui lòng liên hệ quản trị viên.'
  }
  return null
}

export async function getUserAccount(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } })
}

/** Use when the user row is already loaded (avoids a second DB round-trip). */
export function assertCanLoginUser(user: {
  accountStatus: string
}) {
  const err = loginErrorForStatus(user.accountStatus as AccountStatus)
  if (err) throw new Error(err)
}

export async function assertCanLogin(userId: string) {
  const user = await getUserAccount(userId)
  if (!user) throw new Error('Không tìm thấy tài khoản')
  assertCanLoginUser(user)
  return user
}

export async function assertCanWrite(session: SessionPayload) {
  if (session.role === 'admin') return

  const user = await getUserAccount(session.userId)
  if (!user) throw new Error('Không tìm thấy tài khoản')

  const status = user.accountStatus as AccountStatus
  if (status === 'suspended') {
    throw new Error('Tài khoản đã bị đình chỉ')
  }
  if (status === 'pending') {
    throw new Error('Tài khoản chưa được phê duyệt')
  }
  if (status === 'restricted') {
    throw new Error('Tài khoản đang bị hạn chế — không thể thực hiện thao tác này')
  }
}

export function requireAdmin(session: SessionPayload | null) {
  if (!session) throw new Error('Chưa đăng nhập')
  if (session.role !== 'admin') throw new Error('Không có quyền quản trị')
}
