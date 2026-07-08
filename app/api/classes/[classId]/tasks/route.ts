import { createTaskForClass } from '@/lib/server/edu'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import { saveUploadedFile } from '@/lib/server/upload'

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

  const form = await req.formData()
  const title = String(form.get('title') || '').trim()
  const description = String(form.get('description') || '')
  const dueDate = String(form.get('dueDate') || '')

  if (!title) return jsonError('Vui lòng nhập tiêu đề bài tập', 400)
  if (!dueDate) return jsonError('Vui lòng chọn hạn nộp', 400)

  const attachments: { name: string; size: number; type: string; url: string }[] = []
  const files = form.getAll('files')
  for (const entry of files) {
    if (entry instanceof File && entry.size > 0) {
      const stored = await saveUploadedFile(entry)
      attachments.push({
        name: stored.name,
        size: stored.size,
        type: stored.type,
        url: stored.url,
      })
    }
  }

  try {
    const task = await createTaskForClass(session.userId, params.classId, {
      title,
      description,
      dueDate,
      attachments,
    })
    return jsonOk({ task }, 201)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Tạo bài tập thất bại', 400)
  }
}
