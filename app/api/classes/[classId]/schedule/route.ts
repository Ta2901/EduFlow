import {
  createScheduleSlot,
  deleteScheduleSlot,
  listScheduleSlots,
} from '@/lib/server/schedule'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function GET(
  _req: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const slots = await listScheduleSlots(params.classId, session)
    return jsonOk({ slots })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải thời khóa biểu', 400)
  }
}

export async function POST(
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
  try {
    const slot = await createScheduleSlot(params.classId, session.userId, {
      dayOfWeek: Number(body.dayOfWeek),
      period: Number(body.period),
      subject: String(body.subject || ''),
      startTime: String(body.startTime || ''),
      endTime: String(body.endTime || ''),
      room: body.room ? String(body.room) : '',
    })
    return jsonOk({ slot }, 201)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không thể thêm tiết học', 400)
  }
}

export async function DELETE(
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

  const { searchParams } = new URL(req.url)
  const slotId = searchParams.get('slotId')
  if (!slotId) return jsonError('Thiếu slotId', 400)

  try {
    await deleteScheduleSlot(params.classId, session.userId, slotId)
    return jsonOk({ ok: true })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không thể xóa tiết học', 400)
  }
}
