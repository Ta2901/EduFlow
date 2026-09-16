import {
  deletePracticeSet,
  generatePracticeQuestions,
  getPracticeSet,
  getPracticeStats,
  importPracticeQuestions,
  listMyAttempts,
  startPracticeAttempt,
  updatePracticeSet,
} from '@/lib/server/practice'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

type Ctx = { params: { setId: string } }

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const view = new URL(req.url).searchParams.get('view')
    if (view === 'stats') return jsonOk(await getPracticeStats(params.setId, session))
    if (view === 'attempts') return jsonOk(await listMyAttempts(params.setId, session))
    return jsonOk(await getPracticeSet(params.setId, session))
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 403)
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const body = await req.json()
    return jsonOk(await updatePracticeSet(params.setId, session, body))
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file')
      if (!(file instanceof File)) return jsonError('Thiếu file', 400)
      const text = await file.text()
      return jsonOk(await importPracticeQuestions(params.setId, session, text, file.name))
    }
    const body = await req.json()
    if (body.action === 'generate') {
      return jsonOk(
        await generatePracticeQuestions(params.setId, session, {
          topic: body.topic,
          count: body.count,
        })
      )
    }
    if (body.action === 'start') {
      return jsonOk(await startPracticeAttempt(params.setId, session))
    }
    return jsonError('action không hợp lệ', 400)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    return jsonOk(await deletePracticeSet(params.setId, session))
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}
