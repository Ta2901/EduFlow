import { prisma } from '../prisma'
import { logActivityLater } from './activityLog'
import { hashPassword, verifyPassword } from './password'
import { revokeAllQuickLoginsForUser } from './quickLogin'
import { getSession } from './session'

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Không tìm thấy tài khoản')

  if (!(await verifyPassword(currentPassword, user.password))) {
    throw new Error('Mật khẩu hiện tại không đúng')
  }
  if (newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự')
  }
  if (currentPassword === newPassword) {
    throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại')
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: await hashPassword(newPassword) },
  })

  void revokeAllQuickLoginsForUser(userId)

  logActivityLater({
    userId,
    type: 'password_change',
    title: 'Đổi mật khẩu',
    message: 'Bạn đã đổi mật khẩu đăng nhập thành công',
    href: undefined,
    meta: {},
  })
}

export async function changePasswordForSession(
  currentPassword: string,
  newPassword: string
) {
  const session = await getSession()
  if (!session) throw new Error('Chưa đăng nhập')
  await changeOwnPassword(session.userId, currentPassword, newPassword)
}
