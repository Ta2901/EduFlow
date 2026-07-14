'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'

interface AdminTeachingMonitorProps {
  id?: string
}

export default function AdminTeachingMonitor({ id = 'admin-teaching-monitor' }: AdminTeachingMonitorProps) {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<
    Awaited<ReturnType<typeof api.admin.teachingProgress>>['progress'] | null
  >(null)
  const [overview, setOverview] = useState<
    Awaited<ReturnType<typeof api.admin.evalOverview>>['overview'] | null
  >(null)
  const [reminding, setReminding] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, e] = await Promise.all([api.admin.teachingProgress(), api.admin.evalOverview()])
      setProgress(p.progress)
      setOverview(e.overview)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được giám sát giảng dạy')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const remind = async (teacherId: string, classId: string, title: string) => {
    setReminding(classId)
    try {
      const res = await api.admin.remindTeacher({ teacherId, classId })
      toast.success(`Đã nhắc GV lớp 「${title}」`)
      void res
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không gửi được nhắc nhở')
    } finally {
      setReminding(null)
    }
  }

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Đang tải giám sát tiến độ giảng dạy…
      </div>
    )
  }

  if (!progress) return null

  return (
    <div id={id} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Tiến độ giảng dạy & đánh giá</h2>
        <p className="text-sm text-slate-500">
          Theo dõi kế hoạch GV, nhắc nhở khi chậm — xem điểm đánh giá từ học sinh
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Lớp đang mở', value: progress.summary.classes },
          { label: 'Có kế hoạch', value: progress.summary.withPlan },
          { label: 'Chậm tiến độ', value: progress.summary.behind, warn: true },
          { label: 'Chưa có kế hoạch', value: progress.summary.noPlan },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.warn ? 'text-amber-600' : 'text-slate-900'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Kế hoạch theo lớp</h3>
        </div>
        <div className="divide-y">
          {progress.classes.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Chưa có lớp</p>
          ) : (
            progress.classes.map((c) => (
              <div
                key={c.classId}
                id={`${id}-class-${c.classId}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">
                    GV: {c.teacherName} · {c.teacherEmail}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {!c.hasPlan
                      ? 'Chưa lập kế hoạch'
                      : `Tiến độ ${c.progressRate}% · ${c.done}/${c.total} buổi · chậm ${c.overdue}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.hasPlan && c.behind && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      Chậm kế hoạch
                    </span>
                  )}
                  {(c.behind || !c.hasPlan) && (
                    <button
                      type="button"
                      disabled={reminding === c.classId}
                      onClick={() => void remind(c.teacherId, c.classId, c.title)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Nhắc GV
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {overview && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Đánh giá sau buổi học</h3>
            </div>
            {overview.sessionEvals.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
            ) : (
              <div className="divide-y">
                {overview.sessionEvals.map((s) => (
                  <div key={s.classId} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.title}</p>
                      <p className="text-xs text-slate-500">{s.teacherName}</p>
                    </div>
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star className="h-4 w-4 fill-current" />
                      {s.average}/5
                      <span className="font-normal text-slate-400">({s.count})</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Đánh giá giữa kỳ / cuối kỳ</h3>
            </div>
            {overview.courseEvals.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">Chưa mở đợt nào</p>
            ) : (
              <div className="divide-y">
                {overview.courseEvals.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {e.title} · {e.kind === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {e.teacherName} · {e.responseCount}/{e.enrollmentCount} · {e.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {e.averageTeachingQuality > 0 ? `${e.averageTeachingQuality}/5` : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
