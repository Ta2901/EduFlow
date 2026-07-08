import {
  createAdminClass,
  listActiveTeachers,
  listAdminClasses,
  listEligibleStudents,
} from '@/lib/server/admin'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const { searchParams } = new URL(req.url)
  const meta = searchParams.get('meta')

  try {
    if (meta === 'teachers') {
      const teachers = await listActiveTeachers(session)
      return jsonOk({ teachers })
    }
    if (meta === 'students') {
      const students = await listEligibleStudents(session)
      return jsonOk({ students })
    }
    const classes = await listAdminClasses(session)
    return jsonOk({ classes })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải lớp học', 403)
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const body = await req.json().catch(() => ({}))
  try {
    const classroom = await createAdminClass(session, {
      title: String(body.title || ''),
      description: String(body.description || ''),
      teacherId: String(body.teacherId || ''),
    })
    return jsonOk({ classroom }, 201)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Tạo lớp thất bại', 400)
  }
}
