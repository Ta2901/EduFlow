'use client'

import { useMemo } from 'react'
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
import type { ClassRoom, Submission, Task } from '@/lib/types'
import { useI18n } from '@/components/i18n/LanguageProvider'

const STATUS_COLORS: Record<string, string> = {
  not_submitted: '#f59e0b',
  submitted: '#22c55e',
  late: '#ef4444',
  graded: '#3b82f6',
}

interface StudentLearningChartsProps {
  classes: ClassRoom[]
  submissions: Submission[]
  tasks: Task[]
  id?: string
}

export default function StudentLearningCharts({
  classes,
  submissions,
  tasks,
  id = 'student-learning-charts',
}: StudentLearningChartsProps) {
  const { t } = useI18n()
  const statusData = useMemo(() => {
    const counts = {
      not_submitted: 0,
      submitted: 0,
      late: 0,
    }
    for (const s of submissions) {
      counts[s.status] = (counts[s.status] || 0) + 1
    }
    return (Object.keys(counts) as Array<keyof typeof counts>).map((key) => ({
      name: t(`status.submission.${key}`),
      key,
      value: counts[key],
    })).filter((d) => d.value > 0)
  }, [submissions, t])

  const progressData = useMemo(() => {
    const total = submissions.length
    const done = submissions.filter((s) => s.status === 'submitted' || s.status === 'late').length
    const graded = submissions.filter((s) => s.grade != null).length
    const pending = submissions.filter((s) => s.status === 'not_submitted').length
    return [
      { name: t('charts.submitted'), value: done, fill: '#22c55e' },
      { name: t('charts.graded'), value: graded, fill: '#3b82f6' },
      { name: t('charts.pending'), value: pending, fill: '#f59e0b' },
      { name: t('charts.totalTasks'), value: total, fill: '#94a3b8' },
    ]
  }, [submissions, t])

  const byClassData = useMemo(() => {
    return classes.map((c) => {
      const classTasks = tasks.filter((t) => t.classId === c.id)
      const classSubs = submissions.filter((s) => classTasks.some((t) => t.id === s.taskId))
      const submitted = classSubs.filter((s) => s.status === 'submitted' || s.status === 'late').length
      const graded = classSubs.filter((s) => s.grade != null)
      const avg =
        graded.length > 0
          ? graded.reduce((sum, s) => sum + ((s.grade ?? 0) / (s.maxGrade || 10)) * 10, 0) /
            graded.length
          : 0
      return {
        name: c.title.length > 14 ? `${c.title.slice(0, 14)}…` : c.title,
        fullName: c.title,
        submitted,
        pending: classSubs.filter((s) => s.status === 'not_submitted').length,
        avgScore: Number(avg.toFixed(1)),
      }
    })
  }, [classes, tasks, submissions])

  const completionRate =
    submissions.length === 0
      ? 0
      : Math.round(
          (submissions.filter((s) => s.status !== 'not_submitted').length / submissions.length) * 100
        )

  if (submissions.length === 0 && classes.length === 0) {
    return (
      <div
        id={id}
        className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-gray-500"
      >
        Chưa có dữ liệu học tập để vẽ biểu đồ. Tham gia lớp để bắt đầu theo dõi tiến trình.
      </div>
    )
  }

  return (
    <div id={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('charts.studentTitle')}</h2>
          <p className="text-sm text-gray-500">{t('charts.studentSubtitle')}</p>
        </div>
        <div
          id={`${id}-completion`}
          className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700"
        >
          Hoàn thành nộp bài: {completionRate}%
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div id={`${id}-status`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('charts.submissionStatus')}</h3>
          {statusData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">{t('charts.noTasks')}</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div id={`${id}-progress`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('charts.progressOverview')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {progressData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id={`${id}-by-class`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('charts.byClass')}</h3>
          {byClassData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">{t('charts.noClasses')}</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byClassData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'avgScore' ? t('charts.avgScore') : name === 'submitted' ? t('charts.submitted') : t('charts.pending'),
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Legend />
                  <Bar dataKey="avgScore" name={t('charts.avgScore')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="submitted" name={t('charts.submitted')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name={t('charts.pending')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
