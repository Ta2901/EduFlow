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
import type { ClassRoom, Task } from '@/lib/types'

interface TeacherLearningChartsProps {
  classes: ClassRoom[]
  tasks: Task[]
  getSubmissionStats: (taskId: string) => { submitted: number; total: number; late: number }
  id?: string
}

export default function TeacherLearningCharts({
  classes,
  tasks,
  getSubmissionStats,
  id = 'teacher-learning-charts',
}: TeacherLearningChartsProps) {
  const classBars = useMemo(() => {
    return classes.map((c) => {
      const classTasks = tasks.filter((t) => t.classId === c.id)
      let submitted = 0
      let total = 0
      let late = 0
      for (const t of classTasks) {
        const s = getSubmissionStats(t.id)
        submitted += s.submitted
        total += s.total
        late += s.late
      }
      const rate = total === 0 ? 0 : Math.round((submitted / total) * 100)
      return {
        name: c.title.length > 12 ? `${c.title.slice(0, 12)}…` : c.title,
        fullName: c.title,
        students: c.students.length,
        tasks: classTasks.length,
        submitRate: rate,
        late,
      }
    })
  }, [classes, tasks, getSubmissionStats])

  const submissionPie = useMemo(() => {
    let submitted = 0
    let missing = 0
    let late = 0
    for (const t of tasks) {
      const s = getSubmissionStats(t.id)
      submitted += s.submitted
      late += s.late
      missing += Math.max(0, s.total - s.submitted)
    }
    return [
      { name: 'Đã nộp', value: submitted, color: '#22c55e' },
      { name: 'Chưa nộp', value: missing, color: '#f59e0b' },
      { name: 'Nộp muộn', value: late, color: '#ef4444' },
    ].filter((d) => d.value > 0)
  }, [tasks, getSubmissionStats])

  const taskBars = useMemo(() => {
    return [...tasks]
      .slice(0, 8)
      .map((t) => {
        const s = getSubmissionStats(t.id)
        const classroom = classes.find((c) => c.id === t.classId)
        return {
          name: t.title.length > 16 ? `${t.title.slice(0, 16)}…` : t.title,
          fullName: `${t.title} · ${classroom?.title ?? ''}`,
          submitted: s.submitted,
          missing: Math.max(0, s.total - s.submitted),
          late: s.late,
        }
      })
  }, [tasks, classes, getSubmissionStats])

  if (classes.length === 0) {
    return (
      <div
        id={id}
        className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-gray-500"
      >
        Chưa có lớp để thống kê. Tạo lớp và giao bài để xem biểu đồ.
      </div>
    )
  }

  return (
    <div id={id} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Thống kê giảng dạy</h2>
        <p className="text-sm text-gray-500">Tình trạng nộp bài và tiến độ theo lớp</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div id={`${id}-status`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Tình trạng nộp bài (toàn bộ)</h3>
          {submissionPie.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Chưa có bài tập</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={submissionPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {submissionPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div id={`${id}-by-class`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Tiến độ theo lớp (%)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBars} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'submitRate') return [`${value}%`, 'Tỷ lệ nộp']
                    if (name === 'students') return [value, 'Học sinh']
                    if (name === 'tasks') return [value, 'Bài tập']
                    return [value, name]
                  }}
                />
                <Legend />
                <Bar dataKey="submitRate" name="Tỷ lệ nộp %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="students" name="Học sinh" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks" name="Bài tập" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div id={`${id}-by-task`} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Nộp bài theo từng bài tập</h3>
        {taskBars.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Chưa giao bài tập</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskBars} margin={{ top: 8, right: 8, left: -8, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="submitted" name="Đã nộp" stackId="a" fill="#22c55e" />
                <Bar dataKey="missing" name="Chưa nộp" stackId="a" fill="#f59e0b" />
                <Bar dataKey="late" name="Muộn" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
