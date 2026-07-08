import { bulkImportStudents } from '@/lib/server/studentImport'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return jsonError('Vui lòng chọn file danh sách học sinh', 400)
    }

    const content = await file.text()
    const result = await bulkImportStudents(session, content)
    return jsonOk(result)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Import thất bại', 403)
  }
}
