'use client'

import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
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
  const { t } = useI18n()
  const kindLabel = (kind: 'midterm' | 'final') => (kind === 'midterm' ? t('student.uiMidterm') : t('student.uiFinal'))
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
  const [courseForms, setCourseForms] = useState<
    Record<string, { teachingQuality: number; contentClarity: number; pacing: number; comment: string }>
  >({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRes, courseRes] = await Promise.all([
        api.edu.listPendingSessionEvals(classId),
        api.edu.listCourseEvals(classId),
      ])
      const pending = pendingRes.pending ?? []
      const evaluations = courseRes.evaluations ?? []
      setPendingSessions(pending)
      setCourseEvals(evaluations)
      const highlighted = highlightSessionKey
        ? pending.find((p) => p.sessionKey === highlightSessionKey)
        : undefined
      setActiveSession(highlighted?.sessionKey ?? pending[0]?.sessionKey ?? null)
      setCourseForms((prev) => {
        const next = { ...prev }
        for (const ev of evaluations) {
          if (!next[ev.id]) {
            next[ev.id] = {
              teachingQuality: 5,
              contentClarity: 5,
              pacing: 5,
              comment: '',
            }
          }
        }
        return next
      })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('student.uiEvalLoadFail'))
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
      toast.success(t('student.uiEvalSessionOk'))
      setSessionComment('')
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('student.uiSendFail'))
    }
  }

  const submitCourse = async (evaluationId: string) => {
    const form = courseForms[evaluationId] ?? {
      teachingQuality: 5,
      contentClarity: 5,
      pacing: 5,
      comment: '',
    }
    try {
      await api.edu.submitCourseEval(classId, { evaluationId, ...form })
      toast.success(t('student.uiEvalCourseOk'))
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('student.uiSendFail'))
    }
  }

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
        {t('student.uiEvalLoading')}
      </div>
    )
  }

  const openCourses = courseEvals
    .filter((e) => e.status === 'open' && !e.submitted)
    .sort((a, b) => {
      if (highlightCourseKind && a.kind === highlightCourseKind) return -1
      if (highlightCourseKind && b.kind === highlightCourseKind) return 1
      return a.kind === 'midterm' ? -1 : 1
    })
  const active = pendingSessions.find((p) => p.sessionKey === activeSession)

  if (pendingSessions.length === 0 && openCourses.length === 0) {
    const done = courseEvals.filter((e) => e.submitted)
    return (
      <div id={id} className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">{t('student.uiEvalTitle')}</h2>
        <p className="mt-2 text-sm text-gray-500">
          {t('student.uiEvalEmpty')}
        </p>
        {done.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {done.map((e) => (
              <li key={e.id}>
                {t('student.uiEvalSent', { kind: kindLabel(e.kind) })}
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
          <h2 className="font-semibold text-gray-900">{t('student.uiEvalSession')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('student.uiEvalSessionHint')}</p>

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
                label={t('student.uiSatisfaction')}
                value={sessionRating}
                onChange={setSessionRating}
              />
              <textarea
                id={`${id}-session-comment`}
                value={sessionComment}
                onChange={(e) => setSessionComment(e.target.value)}
                placeholder={t('student.uiCommentOptional')}
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <button
                id={`${id}-session-submit`}
                type="button"
                onClick={() => void submitSession()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
              >
                {t('student.uiSendSession')}
              </button>
            </div>
          )}
        </div>
      )}

      {openCourses.map((ev) => {
        const form = courseForms[ev.id] ?? {
          teachingQuality: 5,
          contentClarity: 5,
          pacing: 5,
          comment: '',
        }
        const patch = (partial: Partial<typeof form>) =>
          setCourseForms((prev) => ({
            ...prev,
            [ev.id]: { ...form, ...partial },
          }))
        return (
        <div key={ev.id} id={`${id}-course-${ev.kind}`} className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            {t('student.uiEvalKindTitle', { kind: kindLabel(ev.kind) })}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{t('student.uiEvalCourseHint')}</p>
          <div className="mt-4 space-y-3">
            <RatingRow
              id={`${id}-${ev.kind}-teaching`}
              label={t('student.uiTeaching')}
              value={form.teachingQuality}
              onChange={(n) => patch({ teachingQuality: n })}
            />
            <RatingRow
              id={`${id}-${ev.kind}-clarity`}
              label={t('student.uiClarity')}
              value={form.contentClarity}
              onChange={(n) => patch({ contentClarity: n })}
            />
            <RatingRow
              id={`${id}-${ev.kind}-pacing`}
              label={t('student.uiPacing')}
              value={form.pacing}
              onChange={(n) => patch({ pacing: n })}
            />
            <textarea
              id={`${id}-${ev.kind}-comment`}
              value={form.comment}
              onChange={(e) => patch({ comment: e.target.value })}
              placeholder={t('student.uiCommentMore')}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              id={`${id}-${ev.kind}-submit`}
              type="button"
              onClick={() => void submitCourse(ev.id)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              {t('student.uiSendCourse', { kind: kindLabel(ev.kind) })}
            </button>
          </div>
        </div>
        )
      })}
    </div>
  )
}
