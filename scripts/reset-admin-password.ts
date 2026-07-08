import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { ADMIN_DEFAULT_PASSWORD, ADMIN_LOGIN_ID } from '../lib/constants/accounts'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) {
    console.error('Không tìm thấy tài khoản admin. Chạy: npm run db:seed')
    process.exit(1)
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      email: ADMIN_LOGIN_ID,
      password: await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10),
      accountStatus: 'active',
      approvedAt: admin.approvedAt ?? new Date(),
    },
  })

  console.log(`Đã reset admin — đăng nhập: ${ADMIN_LOGIN_ID} / ${ADMIN_DEFAULT_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
