import {
  listSessionRecordings,
  saveSessionRecording,
} from '@/lib/server/online'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import { saveUploadedFile } from '@/lib/server/upload'

export async function GET(
  _req: Request,
  { params }: { params: { classId: string; sessionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const recordings = await listSessionRecordings(params.classId, params.sessionId, session)
    return jsonOk({ recordings })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi tải bản ghi', 400)
  }
}

export async function POST(
  req: Request,
  { params }: { params: { classId: string; sessionId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'teacher') return jsonError('Không có quyền', 403)

  try {
    const form = await req.formData()
    const file = form.get('file')
    const title = String(form.get('title') || 'Bản ghi bài giảng')
    const duration = form.get('duration') ? Number(form.get('duration')) : undefined

    if (!(file instanceof File) || file.size === 0) {
      return jsonError('Vui lòng chọn file ghi hình', 400)
    }

    const stored = await saveUploadedFile(file)
    const recording = await saveSessionRecording(params.classId, params.sessionId, session.userId, {
      title,
      fileUrl: stored.url,
      fileSize: stored.size,
      duration,
    })
    return jsonOk({ recording }, 201)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lưu bản ghi thất bại', 400)
  }
}
