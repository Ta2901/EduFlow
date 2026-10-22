'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, ApiError } from '@/lib/api/client'
import { useI18n } from '@/components/i18n/LanguageProvider'
import StatDetailPanel from '@/components/dashboard/StatDetailPanel'
import { formatDateTime } from '@/lib/format'
import toast from 'react-hot-toast'

type WorkItem = {
  id: string
  kind: string
  title: string
  subtitle: string
  meta?: string
  statusKey?: string
  statusLabel?: string
  teacherId?: string
  studentId?: string
  classId?: string
}

type WorkStats = Awaited<ReturnType<typeof api.admin.workStats>>['stats']

type Selection =
  | { source: 'student_status'; key: string; label: string }
  | { source: 'teacher_status'; key: string; label: string }
  | { source: 'teacher_bar'; teacherId: string; label: string }
  | { source: 'student_bar'; studentId: string; label: string }
  | { source: 'class_bar'; classId: string; label: string }

const STUDENT_COLORS: Record<string, string> = {
  not_submitted: '#f59e0b',
  submitted: '#22c55e',
  late: '#ef4444',
  graded: '#3b82f6',
}

const TEACHER_COLORS: Record<string, string> = {
  pending_grade: '#f59e0b',
  graded: '#22c55e',
}

interface AdminWorkChartsProps {
  id?: string
}

export default function AdminWorkCharts({ id = 'admin-work-charts' }: AdminWorkChartsProps) {
  const { t, locale } = useI18n()
  const [stats, setStats] = useState<WorkStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<Selection | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { stats: data } = await api.admin.workStats()
      setStats(data)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('charts.loadStatsFailed'))
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const studentPie = useMemo(() => {
    if (!stats) return []
    const s = stats.student.summary
    return [
      { key: 'not_submitted', name: t('status.submission.not_submitted'), value: s.not_submitted, color: STUDENT_COLORS.not_submitted },
      { key: 'submitted', name: t('status.submission.submitted'), value: s.submitted, color: STUDENT_COLORS.submitted },
      { key: 'late', name: t('status.submission.late'), value: s.late, color: STUDENT_COLORS.late },
      { key: 'graded', name: t('charts.graded'), value: s.graded, color: STUDENT_COLORS.graded },
    ].filter((d) => d.value > 0)
  }, [stats, t])

  const teacherPie = useMemo(() => {
    if (!stats) return []
    const summary = stats.teacher.summary
    return [
      { key: 'pending_grade', name: t('charts.pendingGrade'), value: summary.pending_grade, color: TEACHER_COLORS.pending_grade },
      { key: 'graded', name: t('charts.graded'), value: summary.graded, color: TEACHER_COLORS.graded },
    ].filter((d) => d.value > 0)
  }, [stats, t])

  const teacherBars = useMemo(() => {
    if (!stats) return []
    return stats.teachersOverview
      .slice()
      .sort((a, b) => b.pendingGrade - a.pendingGrade || b.tasks - a.tasks)
      .slice(0, 10)
      .map((t) => ({
        ...t,
        name: t.fullName.length > 12 ? `${t.fullName.slice(0, 12)}…` : t.fullName,
      }))
  }, [stats])

  const studentBars = useMemo(() => {
    if (!stats) return []
    return stats.studentsOverview
      .slice()
      .sort((a, b) => a.completionRate - b.completionRate || b.notSubmitted - a.notSubmitted)
      .slice(0, 10)
      .map((s) => ({
        ...s,
        name: s.fullName.length > 12 ? `${s.fullName.slice(0, 12)}…` : s.fullName,
      }))
  }, [stats])

  const classBars = useMemo(() => {
    if (!stats) return []
    return stats.byClass.slice(0, 10).map((c) => ({
      ...c,
      name: c.title.length > 12 ? `${c.title.slice(0, 12)}…` : c.title,
    }))
  }, [stats])

  const detail = useMemo(() => {
    if (!stats || !selection) return { title: '', items: [] as WorkItem[] }

    if (selection.source === 'student_status') {
      const items = stats.student.items.filter((i) => i.statusKey === selection.key)
      return { title: t('charts.detailTitle', { role: t('role.student'), name: selection.label }), items }
    }
    if (selection.source === 'teacher_status') {
      const items = stats.teacher.items.filter((i) => i.statusKey === selection.key)
      return { title: t('charts.detailTitle', { role: t('role.teacher'), name: selection.label }), items }
    }
    if (selection.source === 'teacher_bar') {
      const row = stats.teachersOverview.find((x) => x.teacherId === selection.teacherId)
      const items = stats.teacher.items.filter((i) => i.teacherId === selection.teacherId)
      return {
        title: t('charts.detailTitle', { role: t('role.teacher'), name: selection.label }),
        items:
          items.length > 0
            ? items
            : row
              ? [
                  {
                    id: row.teacherId,
                    kind: 'teacher_summary',
                    title: row.fullName,
                    subtitle: row.email,
                    meta: t('charts.teacherSummaryMeta', {
                      classes: row.classes,
                      tasks: row.tasks,
                      pending: row.pendingGrade,
                      graded: row.graded,
                      rate: row.gradeRate,
                    }),
                    statusLabel: t('charts.gradeDone', { rate: row.gradeRate }),
                    teacherId: row.teacherId,
                  },
                ]
              : [],
      }
    }
    if (selection.source === 'student_bar') {
      const row = stats.studentsOverview.find((x) => x.studentId === selection.studentId)
      const items = stats.student.items.filter((i) => i.studentId === selection.studentId)
      return {
        title: t('charts.detailTitle', { role: t('role.student'), name: selection.label }),
        items:
          items.length > 0
            ? items
            : row
              ? [
                  {
                    id: row.studentId,
                    kind: 'student_summary',
                    title: row.fullName,
                    subtitle: row.email,
                    meta: t('charts.studentSummaryMeta', {
                      classes: row.classes,
                      total: row.total,
                      rate: row.completionRate,
                    }),
                    statusLabel: `${row.completionRate}%`,
                    studentId: row.studentId,
                  },
                ]
              : [],
      }
    }
    if (selection.source === 'class_bar') {
      const row = stats.byClass.find((x) => x.classId === selection.classId)
      const items = stats.student.items.filter((i) => i.classId === selection.classId)
      return {
        title: t('charts.detailTitle', { role: t('common.classLabel'), name: selection.label }),
        items:
          items.length > 0
            ? items
            : row
              ? [
                  {
                    id: row.classId,
                    kind: 'class_summary',
                    title: row.title,
                    subtitle: t('charts.teacherPrefixLine', { name: row.teacherName }),
                    meta: t('charts.classSummaryMeta', {
                      students: row.students,
                      tasks: row.tasks,
                      submit: row.submitRate,
                      grade: row.gradeRate,
                    }),
                    statusLabel: `${t('charts.submitWork')} ${row.submitRate}%`,
                    classId: row.classId,
                  },
                ]
              : [],
      }
    }
    return { title: '', items: [] }
  }, [stats, selection, t])

  const workStatusLabel = (key?: string, fallback?: string) => {
    if (key === 'not_submitted') return t('status.submission.not_submitted')
    if (key === 'submitted') return t('status.submission.submitted')
    if (key === 'late') return t('status.submission.late')
    if (key === 'graded') return t('charts.graded')
    if (key === 'pending_grade') return t('charts.pendingGrade')
    return fallback || ''
  }

  const workMeta = (meta?: string) => {
    if (!meta) return null
    if (meta.startsWith('score:')) {
      const [grade, max] = meta.slice(6).split('/')
      return t('charts.scoreLine', { grade, max })
    }
    if (meta.startsWith('graded:')) {
      const [grade, max] = meta.slice(7).split('/')
      return t('charts.gradedLine', { grade, max })
    }
    if (meta.startsWith('submitted:')) {
      return t('charts.submittedAt', { time: formatDateTime(meta.slice(10), locale) })
    }
    if (meta === 'pending') return t('charts.pendingGrade')
    return meta
  }

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        {t('charts.loadingStats')}
      </div>
    )
  }

  if (!stats) {
    return (
      <div id={id} className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
        {t('charts.noStats')}
      </div>
    )
  }

  const studentDoneRate =
    stats.student.summary.total === 0
      ? 0
      : Math.round(
          ((stats.student.summary.total - stats.student.summary.not_submitted) /
            stats.student.summary.total) *
            100
        )
  const teacherDoneRate =
    stats.teacher.summary.total_actionable === 0
      ? 0
      : Math.round(
          (stats.teacher.summary.graded / stats.teacher.summary.total_actionable) * 100
        )

  return (
    <div id={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('charts.workTitle')}</h2>
          <p className="text-sm text-slate-500">{t('charts.workHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-lg bg-violet-50 px-3 py-1.5 text-violet-700">
            {t('charts.studentSubmitBadge', { rate: studentDoneRate })}
          </span>
          <span className="rounded-lg bg-sky-50 px-3 py-1.5 text-sky-700">
            {t('charts.teacherGradeBadge', { rate: teacherDoneRate })}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id={`${id}-student-pie`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">{t('charts.studentPieTitle')}</h3>
          <p className="mb-3 text-xs text-slate-400">{t('charts.clickSlice')}</p>
          {studentPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">{t('charts.noSubmissions')}</p>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={82}
                    paddingAngle={2}
                    cursor="pointer"
                    onClick={(_, index) => {
                      const entry = studentPie[index]
                      if (!entry) return
                      setSelection({
                        source: 'student_status',
                        key: entry.key,
                        label: entry.name,
                      })
                    }}
                  >
                    {studentPie.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div id={`${id}-teacher-pie`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">{t('charts.teacherPieTitle')}</h3>
          <p className="mb-3 text-xs text-slate-400">{t('charts.clickSlice')}</p>
          {teacherPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">{t('charts.noToGrade')}</p>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teacherPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={82}
                    paddingAngle={2}
                    cursor="pointer"
                    onClick={(_, index) => {
                      const entry = teacherPie[index]
                      if (!entry) return
                      setSelection({
                        source: 'teacher_status',
                        key: entry.key,
                        label: entry.name,
                      })
                    }}
                  >
                    {teacherPie.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div id={`${id}-teachers`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">{t('charts.teachersBarTitle')}</h3>
          <p className="mb-3 text-xs text-slate-400">{t('charts.clickTeacher')}</p>
          {teacherBars.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">{t('charts.noTeachers')}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teacherBars} margin={{ top: 8, right: 8, left: -8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'pendingGrade' ? t('charts.pendingGrade') : name === 'graded' ? t('charts.graded') : name,
                    ]}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as (typeof teacherBars)[0] | undefined
                      return p ? `${p.fullName} · ${p.email}` : ''
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="pendingGrade"
                    name={t('charts.pendingGrade')}
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      const row = data as unknown as (typeof teacherBars)[0]
                      if (!row?.teacherId) return
                      setSelection({
                        source: 'teacher_bar',
                        teacherId: row.teacherId,
                        label: row.fullName,
                      })
                    }}
                  />
                  <Bar
                    dataKey="graded"
                    name={t('charts.graded')}
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      const row = data as unknown as (typeof teacherBars)[0]
                      if (!row?.teacherId) return
                      setSelection({
                        source: 'teacher_bar',
                        teacherId: row.teacherId,
                        label: row.fullName,
                      })
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div id={`${id}-students`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">{t('charts.studentsBarTitle')}</h3>
          <p className="mb-3 text-xs text-slate-400">{t('charts.clickStudent')}</p>
          {studentBars.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">{t('charts.noStudents')}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentBars} margin={{ top: 8, right: 8, left: -8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'completionRate') return [`${value}%`, t('charts.completion')]
                      if (name === 'notSubmitted') return [value, t('status.submission.not_submitted')]
                      return [value, name]
                    }}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as (typeof studentBars)[0] | undefined
                      return p ? `${p.fullName} · ${p.email}` : ''
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="completionRate"
                    name={t('charts.completionPct')}
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      const row = data as unknown as (typeof studentBars)[0]
                      if (!row?.studentId) return
                      setSelection({
                        source: 'student_bar',
                        studentId: row.studentId,
                        label: row.fullName,
                      })
                    }}
                  />
                  <Bar
                    dataKey="notSubmitted"
                    name={t('status.submission.not_submitted')}
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      const row = data as unknown as (typeof studentBars)[0]
                      if (!row?.studentId) return
                      setSelection({
                        source: 'student_bar',
                        studentId: row.studentId,
                        label: row.fullName,
                      })
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div id={`${id}-classes`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">{t('charts.classesBarTitle')}</h3>
        <p className="mb-3 text-xs text-slate-400">{t('charts.clickClass')}</p>
        {classBars.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">{t('charts.noClasses')}</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBars} margin={{ top: 8, right: 8, left: -8, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={48} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === 'submitRate' ? t('charts.submitWork') : t('charts.gradeWork'),
                  ]}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as (typeof classBars)[0] | undefined
                    return p ? `${p.title} · ${p.teacherName}` : ''
                  }}
                />
                <Legend />
                <Bar
                  dataKey="submitRate"
                  name={t('charts.submitPct')}
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const row = data as unknown as (typeof classBars)[0]
                    if (!row?.classId) return
                    setSelection({
                      source: 'class_bar',
                      classId: row.classId,
                      label: row.title,
                    })
                  }}
                />
                <Bar
                  dataKey="gradeRate"
                  name={t('charts.gradePct')}
                  fill="#14b8a6"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const row = data as unknown as (typeof classBars)[0]
                    if (!row?.classId) return
                    setSelection({
                      source: 'class_bar',
                      classId: row.classId,
                      label: row.title,
                    })
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {selection && (
        <StatDetailPanel
          id={`${id}-detail`}
          title={detail.title}
          count={detail.items.length}
          onClose={() => setSelection(null)}
          emptyMessage={t('charts.detailEmpty')}
        >
          <ul className="divide-y rounded-lg border">
            {detail.items.map((item) => (
              <li key={item.id} id={`${id}-item-${item.id}`} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
                    {workMeta(item.meta) ? (
                      <p className="mt-1 text-xs text-slate-400">{workMeta(item.meta)}</p>
                    ) : null}
                  </div>
                  {workStatusLabel(item.statusKey, item.statusLabel) ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {workStatusLabel(item.statusKey, item.statusLabel)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </StatDetailPanel>
      )}
    </div>
  )
}
