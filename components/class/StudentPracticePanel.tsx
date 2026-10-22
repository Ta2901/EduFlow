'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { api, ApiError } from '@/lib/api/client'

type Attempt = Awaited<ReturnType<typeof api.edu.startPractice>>['attempt']

const RATING_STYLE: Record<string, string> = {
  forgot: 'bg-red-50 text-red-800 border-red-200',
  hard: 'bg-amber-50 text-amber-900 border-amber-200',
  good: 'bg-sky-50 text-sky-900 border-sky-200',
  easy: 'bg-green-50 text-green-800 border-green-200',
}

interface StudentPracticePanelProps {
  classId: string
  id?: string
}

export default function StudentPracticePanel({
  classId,
  id = 'student-practice',
}: StudentPracticePanelProps) {
  const { t } = useI18n()
  const [sets, setSets] = useState<Awaited<ReturnType<typeof api.edu.listPracticeSets>>['sets']>([])
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<Record<string, string | null>>({})
  const [phase, setPhase] = useState<'pick' | 'result'>('pick')
  const [aiResult, setAiResult] = useState<{
    ratingLabel: string
    rating: string
    reason: string
    box: number
    nextLabel: string
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const shownAt = useRef(Date.now())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { sets: rows } = await api.edu.listPracticeSets(classId)
      setSets(rows)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('student.uiPracticeLoadFail'))
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    shownAt.current = Date.now()
  }, [index, attempt?.id, phase])

  const start = async (setId: string) => {
    try {
      const { attempt: next } = await api.edu.startPractice(setId)
      setAttempt(next)
      const firstOpen = next.questions.findIndex((q) => !q.rating)
      setIndex(firstOpen < 0 ? 0 : firstOpen)
      const initial: Record<string, string | null> = {}
      for (const q of next.questions) initial[q.id] = q.selectedOptionId ?? null
      setPicks(initial)
      setPhase('pick')
      setAiResult(null)
      shownAt.current = Date.now()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('student.uiPracticeStartFail'))
    }
  }

  const checkAndEvaluate = async () => {
    if (!attempt) return
    const q = attempt.questions[index]
    const optionId = picks[q.id]
    if (!optionId) {
      toast.error(t('student.uiPickAnswer'))
      return
    }
    setBusy(true)
    try {
      const timeSpentMs = Date.now() - shownAt.current
      const res = await api.edu.ratePractice(attempt.setId, attempt.id, {
        questionId: q.id,
        optionId,
        timeSpentMs,
      })
      setAttempt((prev) => {
        if (!prev) return prev
        const updated = res.attempt as Attempt
        return updated ?? prev
      })
      setAiResult({
        rating: res.rating,
        ratingLabel: res.ratingLabel,
        reason: res.reason,
        box: res.box,
        nextLabel: res.nextLabel,
      })
      setPhase('result')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('student.uiPracticeAiFail'))
    } finally {
      setBusy(false)
    }
  }

  const goNext = () => {
    if (!attempt) return
    if (attempt.status !== 'in_progress') {
      setPhase('pick')
      setAiResult(null)
      return
    }
    const nextIdx = index + 1
    if (nextIdx >= attempt.questions.length) {
      void load()
      return
    }
    setIndex(nextIdx)
    setPhase('pick')
    setAiResult(null)
    shownAt.current = Date.now()
  }

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-5 text-sm text-gray-500 shadow-sm">
        {t('student.uiPracticeLoading')}
      </div>
    )
  }

  if (attempt && (attempt.status === 'in_progress' || (phase === 'result' && aiResult))) {
    const q = attempt.questions[index]
    if (!q) return null
    return (
      <div id={id} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">{attempt.title}</h2>
          <span className="rounded-lg bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800">
            {t('student.uiPracticeBadge', { current: index + 1, total: attempt.questions.length })}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {t('student.uiPracticePickHint')}
        </p>
        <p className="mt-4 font-medium text-gray-900">{q.prompt}</p>
        <div className="mt-3 space-y-2">
          {q.options.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                phase === 'result' && o.isCorrect
                  ? 'border-green-500 bg-green-50'
                  : phase === 'result' && picks[q.id] === o.id && !o.isCorrect
                    ? 'border-red-400 bg-red-50'
                    : picks[q.id] === o.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={q.id}
                disabled={phase === 'result' || busy}
                checked={picks[q.id] === o.id}
                onChange={() => setPicks((p) => ({ ...p, [q.id]: o.id }))}
              />
              {o.text}
            </label>
          ))}
        </div>

        {phase === 'pick' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkAndEvaluate()}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {busy ? t('student.uiAiChecking') : t('student.uiCheck')}
          </button>
        )}

        {phase === 'result' && aiResult && (
          <div className={`mt-4 space-y-2 rounded-lg border p-3 text-sm ${RATING_STYLE[aiResult.rating] ?? 'bg-gray-50'}`}>
            <p className="font-semibold">AI: {aiResult.ratingLabel}</p>
            <p>{aiResult.reason}</p>
            <p className="text-xs opacity-80">
              {t('student.uiLeitner', { box: aiResult.box, when: aiResult.nextLabel })}
            </p>
            {q.explanation && <p className="text-xs text-gray-600">{q.explanation}</p>}
            <button
              type="button"
              onClick={goNext}
              className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
            >
              {index + 1 >= attempt.questions.length ? t('student.uiSeeResult') : t('student.uiNextQ')}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (attempt && attempt.status !== 'in_progress') {
    return (
      <div id={id} className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">{attempt.title}</h2>
        <p className="mt-2 text-lg font-bold text-green-700">
          {t('student.uiSessionScore', { score: attempt.score ?? 0, total: attempt.total ?? 0 })}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {t('student.uiPracticePlan')}
        </p>
        <button
          type="button"
          onClick={() => {
            setAttempt(null)
            void load()
          }}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {t('student.uiPracticeBack')}
        </button>
      </div>
    )
  }

  return (
    <div id={id} className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-gray-900">{t('student.uiPracticeTitle')}</h2>
      <p className="meta-secondary mt-1 text-sm text-gray-500">
        {t('student.uiPracticeIntro')}
      </p>
      {sets.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">{t('student.uiPracticeEmpty')}</p>
      ) : (
        <ul className="mt-4 divide-y">
          {sets.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-500">
                  {t('student.uiPracticeMeta', {
                    count: s.questionCount,
                    due: s.dueCount ?? 0,
                    fresh: s.newCount ?? 0,
                    mastered: s.masteredCount ?? 0,
                  })}
                  {s.myAttempts ? ` · ${t('student.uiPracticeAttempts', { count: s.myAttempts })}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={(s.dueCount ?? 0) === 0 && (s.newCount ?? 0) === 0}
                onClick={() => void start(s.id)}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(s.dueCount ?? 0) === 0 ? t('student.uiPracticeTitle') : t('student.uiReviewDue')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
