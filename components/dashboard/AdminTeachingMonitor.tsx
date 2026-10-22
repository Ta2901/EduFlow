'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText } from '@/components/i18n/useContentText'
import { api, ApiError } from '@/lib/api/client'

interface AdminTeachingMonitorProps {
  id?: string
}

export default function AdminTeachingMonitor({ id = 'admin-teaching-monitor' }: AdminTeachingMonitorProps) {
  const { t } = useI18n()
  const text = useContentText()
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
      toast.error(err instanceof ApiError ? err.message : t('charts.loadStatsFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const remind = async (teacherId: string, classId: string, title: string) => {
    setReminding(classId)
    try {
      const res = await api.admin.remindTeacher({ teacherId, classId })
      toast.success(t('charts.reminded', { title }))
      void res
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('charts.remindFailed'))
    } finally {
      setReminding(null)
    }
  }

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        {t('charts.loadingStats')}
      </div>
    )
  }

  if (!progress) return null

  return (
    <div id={id} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t('charts.monitorTitle')}</h2>
        <p className="meta-secondary text-sm text-slate-500">{t('charts.teacherSubtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: t('charts.openClasses'), value: progress.summary.classes },
          { label: t('charts.withPlan'), value: progress.summary.withPlan },
          { label: t('charts.behind'), value: progress.summary.behind, warn: true },
          { label: t('charts.noPlan'), value: progress.summary.noPlan },
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
          <h3 className="text-sm font-semibold text-slate-800">{t('charts.planByClass')}</h3>
        </div>
        <div className="compact-list divide-y">
          {progress.classes.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">{t('charts.noClasses')}</p>
          ) : (
            progress.classes.map((c) => (
              <div
                key={c.classId}
                id={`${id}-class-${c.classId}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{text(c.title)}</p>
                  <p className="meta-secondary truncate text-xs text-slate-500">
                    {t('charts.teacherPrefixLine', { name: c.teacherName })} · {c.teacherEmail}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {!c.hasPlan
                      ? t('charts.noPlanYet')
                      : t('charts.progressLine', {
                          rate: c.progressRate,
                          done: c.done,
                          total: c.total,
                          overdue: c.overdue,
                        })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.hasPlan && c.behind && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      {t('charts.behindBadge')}
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
                      {t('charts.remind')}
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
              <h3 className="text-sm font-semibold text-slate-800">{t('status.notification.session_eval')}</h3>
            </div>
            {overview.sessionEvals.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">{t('common.noData')}</p>
            ) : (
              <div className="compact-list divide-y">
                {overview.sessionEvals.map((s) => (
                  <div key={s.classId} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{s.title}</p>
                      <p className="meta-secondary truncate text-xs text-slate-500">{s.teacherName}</p>
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
              <h3 className="text-sm font-semibold text-slate-800">{t('status.notification.course_eval')}</h3>
            </div>
            {overview.courseEvals.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">{t('charts.noRounds')}</p>
            ) : (
              <div className="compact-list divide-y">
                {overview.courseEvals.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {e.title} · {e.kind === 'midterm' ? t('charts.midterm') : t('charts.finalTerm')}
                      </p>
                      <p className="meta-secondary truncate text-xs text-slate-500">
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
