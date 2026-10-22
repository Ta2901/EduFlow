'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  User,
  ClipboardList,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { useI18n } from '@/components/i18n/LanguageProvider'
import PageHeader from '@/components/layout/PageHeader'
import { api, ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/authStore'
import type { StudentClassProgress } from '@/lib/types'
import {
  ATTENDANCE_STATUS_COLORS,
  formatDate,
  formatDateTime,
  SUBMISSION_STATUS_COLORS,
} from '@/lib/format'

export default function TeacherStudentProgressPage() {
  const params = useParams()
  const classId = params.id as string
  const studentId = params.studentId as string
  const currentUser = useAuthStore((s) => s.currentUser)!
  const { t, locale } = useI18n()

  const [progress, setProgress] = useState<StudentClassProgress | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { progress: data } = await api.edu.getStudentProgress(classId, studentId)
        if (!cancelled) setProgress(data)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : t('charts.loadStatsFailed'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [classId, studentId, t])

  if (loading) {
    return (
      <div id="teacher-student-progress-loading" className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error || !progress) {
    return (
      <div id="teacher-student-progress-error" className="min-h-screen bg-gray-50">
        <PageHeader
          id="teacher-student-progress-error-header"
          userId={currentUser.id}
          title={t('charts.studentTitle')}
          backHref={`/teacher/courses/${classId}`}
        />
        <p className="p-8 text-center text-sm text-red-600">{error || t('common.noData')}</p>
      </div>
    )
  }

  const { student, classroom, summary, tasks, attendanceHistory } = progress

  const submissionPie = [
    { name: t('status.submission.submitted'), value: summary.submitted, color: '#22c55e' },
    { name: t('status.submission.not_submitted'), value: summary.notSubmitted, color: '#f59e0b' },
    { name: t('status.submission.late'), value: summary.late, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  const attendancePie = [
    { name: t('status.attendance.present'), value: summary.attendance.present, color: '#22c55e' },
    { name: t('status.attendance.late'), value: summary.attendance.late, color: '#f59e0b' },
    { name: t('status.attendance.absent'), value: summary.attendance.absent, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  const scoreBars = tasks
    .filter((t) => t.submission?.grade != null)
    .map((t) => ({
      name: t.task.title.length > 12 ? `${t.task.title.slice(0, 12)}…` : t.task.title,
      score: Number(
        (((t.submission!.grade ?? 0) / (t.submission!.maxGrade || 10)) * 10).toFixed(1)
      ),
    }))

  return (
    <div id="teacher-student-progress" className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader
        id="teacher-student-progress-header"
        userId={currentUser.id}
        title={student.fullName}
        subtitle={`${classroom.title} · ${t('charts.studentTitle')}`}
        backHref={`/teacher/courses/${classId}`}
      />

      <div id="teacher-student-progress-content" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
              <User className="h-7 w-7 text-primary-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900">{student.fullName}</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {student.email}
                </span>
                {student.memberCode && (
                  <span className="font-mono text-primary-700">{t('common.code')}: {student.memberCode}</span>
                )}
                {student.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {student.phone}
                  </span>
                )}
                {progress.joinedAt && (
                  <span>{t('common.joined')}: {formatDate(progress.joinedAt, locale)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: t('charts.completionLabel'),
              value: `${summary.completionRate}%`,
              icon: CheckCircle,
              color: 'bg-green-500',
            },
            {
              label: t('charts.scorePerTen'),
              value: summary.averageScore == null ? '—' : String(summary.averageScore),
              icon: Award,
              color: 'bg-blue-500',
            },
            {
              label: t('status.submission.not_submitted'),
              value: String(summary.notSubmitted),
              icon: Clock,
              color: 'bg-amber-500',
            },
            {
              label: t('charts.attendanceTitle'),
              value: `${summary.attendance.presentRate}%`,
              icon: ClipboardList,
              color: 'bg-violet-500',
            },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${card.color}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('charts.submissionStatus')}</h3>
            {submissionPie.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">{t('charts.noTasks')}</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={submissionPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={68}
                    >
                      {submissionPie.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('charts.attendanceTitle')}</h3>
            {attendancePie.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">{t('common.noData')}</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={68}
                    >
                      {attendancePie.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('charts.byAssignment')}</h3>
            {scoreBars.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">{t('charts.noScores')}</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBars} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" name={t('charts.scorePerTen')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <FileText className="h-4 w-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-900">{t('charts.tasks')}</h3>
          </div>
          {tasks.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">{t('charts.noAssigned')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">{t('common.assignment')}</th>
                    <th className="px-4 py-2 font-medium">{t('common.due')}</th>
                    <th className="px-4 py-2 font-medium">{t('common.status')}</th>
                    <th className="px-4 py-2 font-medium">{t('common.grade')}</th>
                    <th className="px-4 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map(({ task, submission }) => {
                    const status = submission?.status ?? 'not_submitted'
                    return (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {formatDate(task.dueDate, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs ${SUBMISSION_STATUS_COLORS[status]}`}
                          >
                            {t(`status.submission.${status}`)}
                          </span>
                          {submission?.submittedAt && (
                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatDateTime(submission.submittedAt, locale)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {submission?.grade != null
                            ? `${submission.grade}/${submission.maxGrade ?? 10}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            id={`teacher-student-progress-task-${task.id}`}
                            href={`/teacher/assignments/${task.id}/submissions`}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            {t('charts.gradeAction')}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ClipboardList className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-gray-900">{t('charts.attendanceTitle')}</h3>
          </div>
          {attendanceHistory.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">{t('common.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">{t('common.due')}</th>
                    <th className="px-4 py-2 font-medium">{t('schedule.classOrSubject')}</th>
                    <th className="px-4 py-2 font-medium">{t('common.period')}</th>
                    <th className="px-4 py-2 font-medium">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceHistory.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(row.sessionDate, locale)}</td>
                      <td className="px-4 py-2.5">
                        {row.subject}
                        <span className="text-gray-500">
                          {' '}
                          · {t(`weekday.${row.dayOfWeek}`)} · {t('common.periodN', { n: row.period })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">
                        {row.startTime}–{row.endTime}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${ATTENDANCE_STATUS_COLORS[row.status]}`}
                        >
                          {t(`status.attendance.${row.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
