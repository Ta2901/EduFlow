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
  const [stats, setStats] = useState<WorkStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<Selection | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { stats: data } = await api.admin.workStats()
      setStats(data)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được thống kê công việc')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const studentPie = useMemo(() => {
    if (!stats) return []
    const s = stats.student.summary
    return [
      { key: 'not_submitted', name: 'Chưa nộp', value: s.not_submitted, color: STUDENT_COLORS.not_submitted },
      { key: 'submitted', name: 'Đã nộp', value: s.submitted, color: STUDENT_COLORS.submitted },
      { key: 'late', name: 'Nộp muộn', value: s.late, color: STUDENT_COLORS.late },
      { key: 'graded', name: 'Đã chấm', value: s.graded, color: STUDENT_COLORS.graded },
    ].filter((d) => d.value > 0)
  }, [stats])

  const teacherPie = useMemo(() => {
    if (!stats) return []
    const t = stats.teacher.summary
    return [
      { key: 'pending_grade', name: 'Chờ chấm', value: t.pending_grade, color: TEACHER_COLORS.pending_grade },
      { key: 'graded', name: 'Đã chấm', value: t.graded, color: TEACHER_COLORS.graded },
    ].filter((d) => d.value > 0)
  }, [stats])

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
      return { title: `Học sinh · ${selection.label}`, items }
    }
    if (selection.source === 'teacher_status') {
      const items = stats.teacher.items.filter((i) => i.statusKey === selection.key)
      return { title: `Giáo viên · ${selection.label}`, items }
    }
    if (selection.source === 'teacher_bar') {
      const t = stats.teachersOverview.find((x) => x.teacherId === selection.teacherId)
      const items = stats.teacher.items.filter((i) => i.teacherId === selection.teacherId)
      return {
        title: `Giáo viên · ${selection.label}`,
        items:
          items.length > 0
            ? items
            : t
              ? [
                  {
                    id: t.teacherId,
                    kind: 'teacher_summary',
                    title: t.fullName,
                    subtitle: t.email,
                    meta: `${t.classes} lớp · ${t.tasks} bài · chờ chấm ${t.pendingGrade} · đã chấm ${t.graded} (${t.gradeRate}%)`,
                    statusLabel: `${t.gradeRate}% hoàn thành chấm`,
                    teacherId: t.teacherId,
                  },
                ]
              : [],
      }
    }
    if (selection.source === 'student_bar') {
      const s = stats.studentsOverview.find((x) => x.studentId === selection.studentId)
      const items = stats.student.items.filter((i) => i.studentId === selection.studentId)
      return {
        title: `Học sinh · ${selection.label}`,
        items:
          items.length > 0
            ? items
            : s
              ? [
                  {
                    id: s.studentId,
                    kind: 'student_summary',
                    title: s.fullName,
                    subtitle: s.email,
                    meta: `${s.classes} lớp · ${s.total} BT · hoàn thành ${s.completionRate}%`,
                    statusLabel: `${s.completionRate}%`,
                    studentId: s.studentId,
                  },
                ]
              : [],
      }
    }
    if (selection.source === 'class_bar') {
      const c = stats.byClass.find((x) => x.classId === selection.classId)
      const items = stats.student.items.filter((i) => i.classId === selection.classId)
      return {
        title: `Lớp · ${selection.label}`,
        items:
          items.length > 0
            ? items
            : c
              ? [
                  {
                    id: c.classId,
                    kind: 'class_summary',
                    title: c.title,
                    subtitle: `GV: ${c.teacherName}`,
                    meta: `${c.students} HS · ${c.tasks} bài · nộp ${c.submitRate}% · chấm ${c.gradeRate}%`,
                    statusLabel: `Nộp ${c.submitRate}%`,
                    classId: c.classId,
                  },
                ]
              : [],
      }
    }
    return { title: '', items: [] }
  }, [stats, selection])

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Đang tải thống kê hoàn thành công việc…
      </div>
    )
  }

  if (!stats) {
    return (
      <div id={id} className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
        Không có dữ liệu thống kê.
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
          <h2 className="text-lg font-semibold text-slate-900">Hoàn thành công việc</h2>
          <p className="text-sm text-slate-500">
            Click vào từng phần biểu đồ để xem danh sách chi tiết
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-lg bg-violet-50 px-3 py-1.5 text-violet-700">
            HS nộp bài: {studentDoneRate}%
          </span>
          <span className="rounded-lg bg-sky-50 px-3 py-1.5 text-sky-700">
            GV chấm bài: {teacherDoneRate}%
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id={`${id}-student-pie`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Học sinh · tình trạng bài tập</h3>
          <p className="mb-3 text-xs text-slate-400">Nhấn một phần để xem danh sách</p>
          {studentPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Chưa có bài nộp</p>
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
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Giáo viên · tiến độ chấm bài</h3>
          <p className="mb-3 text-xs text-slate-400">Nhấn một phần để xem danh sách</p>
          {teacherPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Chưa có bài cần chấm</p>
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
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Giáo viên · chờ chấm / đã chấm</h3>
          <p className="mb-3 text-xs text-slate-400">Click cột để xem công việc của GV</p>
          {teacherBars.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Chưa có giáo viên</p>
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
                      name === 'pendingGrade' ? 'Chờ chấm' : name === 'graded' ? 'Đã chấm' : name,
                    ]}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as (typeof teacherBars)[0] | undefined
                      return p ? `${p.fullName} · ${p.email}` : ''
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="pendingGrade"
                    name="Chờ chấm"
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
                    name="Đã chấm"
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
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Học sinh · tỷ lệ hoàn thành (%)</h3>
          <p className="mb-3 text-xs text-slate-400">Click cột để xem bài tập của HS</p>
          {studentBars.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Chưa có học sinh</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentBars} margin={{ top: 8, right: 8, left: -8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'completionRate') return [`${value}%`, 'Hoàn thành']
                      if (name === 'notSubmitted') return [value, 'Chưa nộp']
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
                    name="Hoàn thành %"
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
                    name="Chưa nộp"
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
        <h3 className="mb-1 text-sm font-semibold text-slate-800">Theo lớp · tỷ lệ nộp / chấm (%)</h3>
        <p className="mb-3 text-xs text-slate-400">Click cột để xem danh sách bài trong lớp</p>
        {classBars.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Chưa có lớp học</p>
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
                    name === 'submitRate' ? 'Nộp bài' : 'Chấm bài',
                  ]}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as (typeof classBars)[0] | undefined
                    return p ? `${p.title} · GV ${p.teacherName}` : ''
                  }}
                />
                <Legend />
                <Bar
                  dataKey="submitRate"
                  name="Nộp bài %"
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
                  name="Chấm bài %"
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
          emptyMessage="Không có mục nào trong nhóm này."
        >
          <ul className="divide-y rounded-lg border">
            {detail.items.map((item) => (
              <li key={item.id} id={`${id}-item-${item.id}`} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
                    {item.meta ? (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.meta.startsWith('Nộp:')
                          ? `Nộp: ${formatDateTime(item.meta.replace(/^Nộp:\s*/, ''))}`
                          : item.meta}
                      </p>
                    ) : null}
                  </div>
                  {item.statusLabel ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {item.statusLabel}
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
