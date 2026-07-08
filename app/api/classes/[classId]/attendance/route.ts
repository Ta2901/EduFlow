import {
  getAttendanceForSession,
  getStudentAttendanceHistory,
  saveAttendanceForSession,
} from '@/lib/server/schedule'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import type { AttendanceStatus } from '@/lib/types'

export async function GET(
  req: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const { searchParams } = new URL(req.url)
  const scheduleSlotId = searchParams.get('slotId')
  const sessionDate = searchParams.get('date')
  const studentHistory = searchParams.get('studentHistory') === '1'

  try {
    if (studentHistory) {
      const studentId =
        session.role === 'student' ? session.userId : searchParams.get('studentId') || session.userId
      const history = await getStudentAttendanceHistory(params.classId, studentId, session)
      return jsonOk({ history })
    }

    if (!scheduleSlotId || !sessionDate) {
      return jsonError('Thiếu slotId hoặc date', 400)
    }

    const records = await getAttendanceForSession(
      params.classId,
      session,
      scheduleSlotId,
      sessionDate
    )
    return jsonOk({ records })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải điểm danh', 400)
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'teacher') return jsonError('Không có quyền', 403)

  try {
    await assertCanWrite(session)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không có quyền', 403)
  }

  const body = await req.json().catch(() => ({}))
  const scheduleSlotId = String(body.scheduleSlotId || '')
  const sessionDate = String(body.sessionDate || '')
  const records = Array.isArray(body.records) ? body.records : []

  if (!scheduleSlotId || !sessionDate) {
    return jsonError('Thiếu tiết học hoặc ngày', 400)
  }

  try {
    const saved = await saveAttendanceForSession(params.classId, session.userId, {
      scheduleSlotId,
      sessionDate,
      records: records.map((r: { studentId: string; status: string }) => ({
        studentId: String(r.studentId),
        status: r.status as AttendanceStatus,
      })),
    })
    return jsonOk({ records: saved })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lưu điểm danh thất bại', 400)
  }
}
