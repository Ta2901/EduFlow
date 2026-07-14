'use client'

import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'

type PlanItemDraft = {
  id?: string
  sessionIndex: number
  title: string
  description: string
  plannedDate: string
  status?: 'planned' | 'done' | 'skipped'
}

interface TeachingPlanPanelProps {
  classId: string
  isTeacher: boolean
  id?: string
}

export default function TeachingPlanPanel({
  classId,
  isTeacher,
  id = 'teaching-plan',
}: TeachingPlanPanelProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [termStart, setTermStart] = useState('')
  const [termEnd, setTermEnd] = useState('')
  const [items, setItems] = useState<PlanItemDraft[]>([])
  const [summary, setSummary] = useState<{
    total: number
    done: number
    overdue: number
    behind: boolean
    progressRate: number
  } | null>(null)
  const [sessionAvg, setSessionAvg] = useState<{ average: number; count: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { plan } = await api.edu.getTeachingPlan(classId)
      setTermStart(plan.class.termStart ?? '')
      setTermEnd(plan.class.termEnd ?? '')
      setItems(
        plan.items.map((i) => ({
          id: i.id,
          sessionIndex: i.sessionIndex,
          title: i.title,
          description: i.description,
          plannedDate: i.plannedDate ?? '',
          status: i.status,
        }))
      )
      setSummary(plan.summary)
      if (isTeacher) {
        const { summary: ev } = await api.edu.getSessionEvalSummary(classId)
        setSessionAvg({ average: ev.average, count: ev.count })
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được kế hoạch')
    } finally {
      setLoading(false)
    }
  }, [classId, isTeacher])

  useEffect(() => {
    void load()
  }, [load])

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        sessionIndex: prev.length + 1,
        title: '',
        description: '',
        plannedDate: '',
        status: 'planned',
      },
    ])
  }

  const savePlan = async () => {
    setSaving(true)
    try {
      await api.edu.updateClassTerm(classId, {
        termStart: termStart || null,
        termEnd: termEnd || null,
      })
      await api.edu.saveTeachingPlan(
        classId,
        items.map((i, idx) => ({
          sessionIndex: idx + 1,
          title: i.title,
          description: i.description,
          plannedDate: i.plannedDate || null,
        }))
      )
      toast.success('Đã lưu kế hoạch giảng dạy')
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không lưu được')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (itemId: string, status: 'planned' | 'done' | 'skipped') => {
    try {
      await api.edu.updatePlanItemStatus(classId, { itemId, status })
      toast.success(status === 'done' ? 'Đã đánh dấu hoàn thành' : 'Đã cập nhật')
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không cập nhật được')
    }
  }

  if (loading) {
    return (
      <div id={id} className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
        Đang tải kế hoạch giảng dạy…
      </div>
    )
  }

  return (
    <div id={id} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <ClipboardList className="h-4 w-4" />
            Kế hoạch giảng dạy
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Lên lịch nội dung từng buổi — Admin sẽ theo dõi và nhắc nếu chậm tiến độ
          </p>
        </div>
        {summary && (
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
              Tiến độ {summary.progressRate}%
            </span>
            {summary.behind ? (
              <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-amber-800">
                Chậm {summary.overdue} buổi
              </span>
            ) : (
              <span className="rounded-lg bg-green-100 px-2.5 py-1 text-green-800">Đúng tiến độ</span>
            )}
            {sessionAvg && sessionAvg.count > 0 && (
              <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-sky-800">
                Đánh giá buổi học: {sessionAvg.average}/5 ({sessionAvg.count})
              </span>
            )}
          </div>
        )}
      </div>

      {isTeacher && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Ngày bắt đầu khoá</span>
            <input
              id={`${id}-term-start`}
              type="date"
              value={termStart}
              onChange={(e) => setTermStart(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Ngày kết thúc khoá</span>
            <input
              id={`${id}-term-end`}
              type="date"
              value={termEnd}
              onChange={(e) => setTermEnd(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>
      )}

      {!isTeacher && (termStart || termEnd) && (
        <p className="text-sm text-gray-500">
          Thời gian khoá: {termStart || '…'} → {termEnd || '…'}
        </p>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-gray-400">
            Chưa có buổi nào trong kế hoạch
          </p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id ?? `new-${idx}`}
              id={`${id}-item-${idx}`}
              className="rounded-lg border bg-gray-50 p-3 sm:p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Buổi {idx + 1}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {item.status && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.status === 'done'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'skipped'
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status === 'done'
                        ? 'Đã dạy'
                        : item.status === 'skipped'
                          ? 'Bỏ qua'
                          : 'Chưa dạy'}
                    </span>
                  )}
                  {isTeacher && item.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatus(item.id!, 'done')}
                        className="rounded-md bg-green-600 px-2 py-1 text-xs text-white"
                      >
                        Hoàn thành
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(item.id!, 'skipped')}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        Bỏ qua
                      </button>
                    </>
                  )}
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-md p-1 text-red-500 hover:bg-red-50"
                      aria-label="Xóa buổi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {isTeacher ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    value={item.title}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, title: e.target.value } : row))
                      )
                    }
                    placeholder="Tiêu đề buổi học"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={item.plannedDate}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, plannedDate: e.target.value } : row
                        )
                      )
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, description: e.target.value } : row
                        )
                      )
                    }
                    placeholder="Nội dung dự kiến"
                    rows={2}
                    className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
                  />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  {item.plannedDate && (
                    <p className="mt-1 text-xs text-gray-500">Kế hoạch: {item.plannedDate}</p>
                  )}
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isTeacher && (
        <div className="flex flex-wrap gap-2">
          <button
            id={`${id}-add`}
            type="button"
            onClick={addRow}
            className="inline-flex items-center rounded-lg border px-3 py-2 text-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Thêm buổi
          </button>
          <button
            id={`${id}-save`}
            type="button"
            disabled={saving}
            onClick={() => void savePlan()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Đang lưu…' : 'Lưu kế hoạch'}
          </button>
        </div>
      )}
    </div>
  )
}
