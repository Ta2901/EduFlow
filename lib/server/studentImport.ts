import { prisma } from '../prisma'
import { defaultStudentEmail, parseStudentImportFile, BULK_STUDENT_DEFAULT_PASSWORD } from '../utils/parseStudentImport'
import { hashPassword } from './password'
import { requireAdmin } from './account'
import type { SessionPayload } from './session'

export { BULK_STUDENT_DEFAULT_PASSWORD }

export interface BulkImportResult {
  created: {
    studentCode: string
    fullName: string
    email: string
  }[]
  skipped: {
    studentCode: string
    reason: string
  }[]
  parseErrors: { line: number; message: string }[]
}

export async function bulkImportStudents(
  session: SessionPayload,
  fileContent: string
): Promise<BulkImportResult> {
  requireAdmin(session)

  const { rows, errors: parseErrors } = parseStudentImportFile(fileContent)
  if (rows.length === 0 && parseErrors.length > 0) {
    return { created: [], skipped: [], parseErrors }
  }

  const passwordHash = await hashPassword(BULK_STUDENT_DEFAULT_PASSWORD)
  const created: BulkImportResult['created'] = []
  const skipped: BulkImportResult['skipped'] = []

  for (const row of rows) {
    const email = row.email || defaultStudentEmail(row.studentCode)

    const existingCode = await prisma.user.findUnique({
      where: { memberCode: row.studentCode },
    })
    if (existingCode) {
      skipped.push({ studentCode: row.studentCode, reason: 'Mã tài khoản đã tồn tại' })
      continue
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      skipped.push({ studentCode: row.studentCode, reason: `Email ${email} đã được sử dụng` })
      continue
    }

    await prisma.user.create({
      data: {
        memberCode: row.studentCode,
        email,
        password: passwordHash,
        fullName: row.fullName,
        role: 'student',
        accountStatus: 'active',
        approvedAt: new Date(),
        school: row.school || '',
        phone: row.phone || '',
        statusNote: 'Tạo hàng loạt bởi quản trị viên',
      },
    })

    created.push({
      studentCode: row.studentCode,
      fullName: row.fullName,
      email,
    })
  }

  return { created, skipped, parseErrors }
}
