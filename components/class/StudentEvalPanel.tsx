'use client'

import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'

interface StudentEvalPanelProps {
  classId: string
  highlightSessionKey?: string | null
  highlightCourseKind?: 'midterm' | 'final' | null
  id?: string
}

function RatingRow({
  label,
  value,
  onChange,
  id,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  id: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div id={id} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded p-1 ${value >= n ? 'text-amber-500' : 'text-gray-300'}`}
            aria-label={`${label} ${n}`}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function StudentEvalPanel({
  classId,
  highlightSessionKey,
  highlightCourseKind,
  id = 'student-eval',
}: StudentEvalPanelProps) {
  const [pendingSessions, setPendingSessions] = useState<
    { sessionKey: string; onlineSessionId: string; title: string; endedAt?: string }[]
  >([])
  const [courseEvals, setCourseEvals] = useState<
    Awaited<ReturnType<typeof api.edu.listCourseEvals>>['evaluations']
  >([])
  const [loading, setLoading] = useState(true)
  const [sessionRating, setSessionRating] = useState(5)
  const [sessionComment, setSessionComment] = useState('')
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [courseForm, setCourseForm] = useState({
    evaluationId: '',
    teachingQuality: 5,
    contentClarity: 5,
    pacing: 5,
    comment: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRes, courseRes] = await Promise.all([
        api.edu.listPendingSessionEvals(classId),
        api.edu.listCourseEvals(classId),
      ])
      setPendingSessions(pendingRes.pending)
      setCourseEvals(courseRes.evaluations)
      const highlighted = highlightSessionKey
        ? pendingRes.pending.find((p) => p.sessionKey === highlightSessionKey)
        : undefined
      setActiveSession(highlighted?.sessionKey ?? pendingRes.pending[0]?.sessionKey ?? null)

      const openCourse =
        courseRes.evaluations.find(
          (e) =>
            e.status === 'open' &&
            !e.submitted &&
            (!highlightCourseKind || e.kind === highlightCourseKind)
        ) ?? courseRes.evaluations.find((e) => e.status === 'open' && !e.submitted)
      if (openCourse) {
        setCourseForm((f) => ({ ...f, evaluationId: openCourse.id }))
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được đánh giá')
    } finally {
      setLoading(false)
    }
  }, [classId, highlightSessionKey, highlightCourseKind])

  useEffect(() => {
    void load()
  }, [load])

  const submitSession = async () => {
    const target = pendingSessions.find((p) => p.sessionKey === activeSession)
    if (!target) return
    try {
      await api.edu.submitSessionEval(classId, {
        sessionKey: target.sessionKey,
        onlineSessionId: target.onlineSessionId,
        rating: sessionRating,
        comment: sessionComment,
      })
      toast.success('Đã gửi đánh giá buổi học')
      setSessionComment('')
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Gửi thất bại')
    }
  }

  const submitCourse = async (evaluationId: string) => {
    try {
      await api.edu.submitCourseEval(classId, { ...courseForm, evaluationId })
      toast.success('Đã gửi đánh giá khoá học')
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Gửi thất bại')
    }
  }

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
        Đang tải đánh giá…
      </div>
    )
  }

  const openCourses = courseEvals.filter((e) => e.status === 'open' && !e.submitted)
  const active = pendingSessions.find((p) => p.sessionKey === activeSession)

  if (pendingSessions.length === 0 && openCourses.length === 0) {
    const done = courseEvals.filter((e) => e.submitted)
    return (
      <div id={id} className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Đánh giá</h2>
        <p className="mt-2 text-sm text-gray-500">
          Hiện không có đợt đánh giá nào cần hoàn thành.
        </p>
        {done.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {done.map((e) => (
              <li key={e.id}>
                Đã gửi đánh giá {e.kind === 'midterm' ? 'giữa kỳ' : 'cuối kỳ'}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div id={id} className="space-y-4">
      {pendingSessions.length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Đánh giá sau buổi học</h2>
          <p className="mt-1 text-sm text-gray-500">Chấm nhanh giáo viên sau mỗi buổi đã kết thúc</p>

          {pendingSessions.length > 1 && (
            <select
              id={`${id}-session-select`}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
              value={activeSession ?? ''}
              onChange={(e) => setActiveSession(e.target.value)}
            >
              {pendingSessions.map((p) => (
                <option key={p.sessionKey} value={p.sessionKey}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {active && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-gray-800">{active.title}</p>
              <RatingRow
                id={`${id}-session-stars`}
                label="Mức hài lòng"
                value={sessionRating}
                onChange={setSessionRating}
              />
              <textarea
                id={`${id}-session-comment`}
                value={sessionComment}
                onChange={(e) => setSessionComment(e.target.value)}
                placeholder="Góp ý ngắn (không bắt buộc)"
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <button
                id={`${id}-session-submit`}
                type="button"
                onClick={() => void submitSession()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
              >
                Gửi đánh giá buổi học
              </button>
            </div>
          )}
        </div>
      )}

      {openCourses.map((ev) => (
        <div key={ev.id} id={`${id}-course-${ev.kind}`} className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            Đánh giá {ev.kind === 'midterm' ? 'giữa kỳ' : 'cuối kỳ'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">Hai lần trong khoá: giữa kỳ và cuối kỳ</p>
          <div className="mt-4 space-y-3">
            <RatingRow
              id={`${id}-${ev.kind}-teaching`}
              label="Chất lượng giảng dạy"
              value={courseForm.evaluationId === ev.id ? courseForm.teachingQuality : 5}
              onChange={(n) =>
                setCourseForm((f) => ({ ...f, evaluationId: ev.id, teachingQuality: n }))
              }
            />
            <RatingRow
              id={`${id}-${ev.kind}-clarity`}
              label="Độ rõ ràng nội dung"
              value={courseForm.evaluationId === ev.id ? courseForm.contentClarity : 5}
              onChange={(n) =>
                setCourseForm((f) => ({ ...f, evaluationId: ev.id, contentClarity: n }))
              }
            />
            <RatingRow
              id={`${id}-${ev.kind}-pacing`}
              label="Nhịp độ học"
              value={courseForm.evaluationId === ev.id ? courseForm.pacing : 5}
              onChange={(n) => setCourseForm((f) => ({ ...f, evaluationId: ev.id, pacing: n }))}
            />
            <textarea
              id={`${id}-${ev.kind}-comment`}
              value={courseForm.evaluationId === ev.id ? courseForm.comment : ''}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, evaluationId: ev.id, comment: e.target.value }))
              }
              placeholder="Nhận xét thêm"
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              id={`${id}-${ev.kind}-submit`}
              type="button"
              onClick={() => void submitCourse(ev.id)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Gửi đánh giá {ev.kind === 'midterm' ? 'giữa kỳ' : 'cuối kỳ'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
