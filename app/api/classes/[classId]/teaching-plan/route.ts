import {
  getTeachingPlan,
  updateClassTerm,
  updatePlanItemStatus,
  upsertTeachingPlanItems,
} from '@/lib/server/teachingPlan'
import { jsonError, jsonOk } from '@/lib/server/http'
import { getSession } from '@/lib/server/session'

type Ctx = { params: { classId: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const plan = await getTeachingPlan(params.classId, session)
    return jsonOk({ plan })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 403)
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const body = await req.json()
    if (body.termStart !== undefined || body.termEnd !== undefined) {
      const term = await updateClassTerm(params.classId, session, {
        termStart: body.termStart,
        termEnd: body.termEnd,
      })
      return jsonOk({ term })
    }
    const plan = await upsertTeachingPlanItems(params.classId, session, body.items ?? [])
    return jsonOk({ plan })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return jsonError('Chưa đăng nhập', 401)
  try {
    const body = await req.json()
    const item = await updatePlanItemStatus(
      params.classId,
      body.itemId,
      session,
      body.status
    )
    return jsonOk({ item })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Lỗi', 400)
  }
}
