import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'
import { saveUploadedFile } from '@/lib/server/upload'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return jsonError('Không có tệp', 400)
  }

  const stored = await saveUploadedFile(file)
  return jsonOk({
    id: stored.id,
    name: stored.name,
    size: stored.size,
    type: stored.type,
    url: stored.url,
  })
}
