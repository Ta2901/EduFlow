import { prisma } from '../prisma'

const NUMERIC_CODE_START = 100001

export async function generateNextMemberCode(): Promise<string> {
  const rows = await prisma.user.findMany({
    where: { memberCode: { not: null } },
    select: { memberCode: true },
  })

  let max = NUMERIC_CODE_START - 1
  for (const row of rows) {
    if (row.memberCode && /^\d+$/.test(row.memberCode)) {
      max = Math.max(max, Number.parseInt(row.memberCode, 10))
    }
  }

  return String(max + 1).padStart(6, '0')
}

export async function assignUniqueMemberCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await generateNextMemberCode()
    const exists = await prisma.user.findUnique({ where: { memberCode: code } })
    if (!exists) return code
  }
  throw new Error('Không thể tạo mã tài khoản')
}
