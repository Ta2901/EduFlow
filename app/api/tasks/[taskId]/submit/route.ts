import { submitWorkForTask } from '@/lib/server/edu'
import { assertCanWrite } from '@/lib/server/account'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import { saveUploadedFile } from '@/lib/server/upload'

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  if (session.role !== 'student') return jsonError('Chỉ học sinh mới nộp bài', 403)

  try {
    await assertCanWrite(session)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Không có quyền', 403)
  }

  const form = await req.formData()
  const content = String(form.get('content') || '')

  const files: { name: string; size: number; url: string }[] = []
  for (const entry of form.getAll('files')) {
    if (entry instanceof File && entry.size > 0) {
      const stored = await saveUploadedFile(entry)
      files.push({ name: stored.name, size: stored.size, url: stored.url })
    }
  }

  const result = await submitWorkForTask(session.userId, params.taskId, { content, files })
  if (!result.ok) return jsonError(result.error, 400)

  return jsonOk({ submission: result.submission })
}
