'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle,
  Clock,
  Plus,
  FileText,
  Award,
  Hash,
  GraduationCap,
  LayoutDashboard,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardShell from '@/components/layout/DashboardShell'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate, SUBMISSION_STATUS_COLORS, SUBMISSION_STATUS_LABELS } from '@/lib/format'
import StatDetailPanel from '@/components/dashboard/StatDetailPanel'

type StudentStatKey = 'classes' | 'pending' | 'graded' | 'all'

const sidebarItems = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'courses', label: 'Lớp học', icon: GraduationCap },
  { id: 'submissions', label: 'Nộp bài', icon: CheckCircle },
]

export default function StudentDashboard() {
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.currentUser)!
  const logout = useAuthStore((s) => s.logout)
  const getClassesByStudent = useEduStore((s) => s.getClassesByStudent)
  const getStudentSubmissions = useEduStore((s) => s.getStudentSubmissions)
  const getTaskById = useEduStore((s) => s.getTaskById)

  const [activeTab, setActiveTab] = useState('overview')
  const [activeStat, setActiveStat] = useState<StudentStatKey | null>(null)

  const classes = getClassesByStudent(currentUser.id, currentUser.email)
  const submissions = getStudentSubmissions(currentUser.id)

  const gradedCount = submissions.filter((s) => s.grade != null).length
  const pendingCount = submissions.filter((s) => s.status === 'not_submitted').length

  const pendingSubmissions = submissions.filter((s) => s.status === 'not_submitted')
  const gradedSubmissions = submissions.filter((s) => s.grade != null)

  const toggleStat = (key: StudentStatKey) => {
    setActiveStat((prev) => (prev === key ? null : key))
  }

  const stats: {
    key: StudentStatKey
    title: string
    value: string
    icon: typeof BookOpen
    color: string
  }[] = [
    { key: 'classes', title: 'Lớp đang học', value: String(classes.length), icon: BookOpen, color: 'bg-blue-500' },
    { key: 'pending', title: 'Bài chưa nộp', value: String(pendingCount), icon: Clock, color: 'bg-amber-500' },
    { key: 'graded', title: 'Đã có điểm', value: String(gradedCount), icon: Award, color: 'bg-green-500' },
    { key: 'all', title: 'Tổng bài tập', value: String(submissions.length), icon: FileText, color: 'bg-violet-500' },
  ]

  const recentSubmissions = useMemo(() => {
    return [...submissions]
      .map((sub) => ({ sub, task: getTaskById(sub.taskId) }))
      .filter((x) => x.task)
      .slice(0, 5)
  }, [submissions, getTaskById])

  const tabTitles: Record<string, string> = {
    overview: 'Tổng quan',
    courses: 'Lớp học',
    submissions: 'Nộp bài',
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Đã đăng xuất')
    router.push('/login')
  }

  const joinButton = (
    <Link
      href="/student/join"
      className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
    >
      <Hash className="mr-1.5 h-4 w-4" />
      <span className="hidden sm:inline">Nhập mã lớp</span>
      <span className="sm:hidden">Mã lớp</span>
    </Link>
  )

  return (
    <DashboardShell
      userId={currentUser.id}
      roleLabel="Học sinh"
      userName={currentUser.fullName}
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      headerTitle={tabTitles[activeTab]}
      headerSubtitle="Chào mừng bạn quay trở lại!"
      headerAction={joinButton}
    >
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => {
              const selected = activeStat === stat.key
              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => toggleStat(stat.key)}
                  className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md sm:p-6 ${
                    selected
                      ? 'border-primary-400 ring-2 ring-primary-500 ring-offset-1'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className={`mb-3 inline-flex rounded-lg p-2.5 ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 sm:text-sm">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stat.value}</p>
                  <p className="mt-2 text-[10px] font-medium text-primary-600 sm:text-xs">
                    {selected ? 'Đang hiển thị danh sách ▲' : 'Nhấn để xem danh sách'}
                  </p>
                </button>
              )
            })}
          </div>

          {activeStat === 'classes' && (
            <StatDetailPanel
              title="Lớp đang học"
              count={classes.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Chưa tham gia lớp nào."
            >
              <ul className="space-y-2">
                {classes.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/student/courses/${c.id}`}
                      className="block rounded-lg border p-3 hover:border-primary-200 hover:bg-primary-50/50"
                    >
                      <p className="font-medium text-gray-900">{c.title}</p>
                      <p className="mt-1 font-mono text-xs text-primary-600">Mã: {c.classCode}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'pending' && (
            <StatDetailPanel
              title="Bài chưa nộp"
              count={pendingSubmissions.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Không có bài chưa nộp."
            >
              <ul className="space-y-2">
                {pendingSubmissions.map((sub) => {
                  const task = getTaskById(sub.taskId)
                  return (
                    <li key={sub.id}>
                      <Link
                        href={`/student/assignments/${sub.taskId}`}
                        className="block rounded-lg border border-amber-200 bg-amber-50/40 p-3 hover:bg-amber-50"
                      >
                        <p className="font-medium text-gray-900">{task?.title ?? '—'}</p>
                        <p className="text-xs text-gray-500">
                          Hạn: {task ? formatDate(task.dueDate) : '—'}
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'graded' && (
            <StatDetailPanel
              title="Bài đã có điểm"
              count={gradedSubmissions.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Chưa có bài được chấm điểm."
            >
              <ul className="space-y-2">
                {gradedSubmissions.map((sub) => {
                  const task = getTaskById(sub.taskId)
                  return (
                    <li key={sub.id}>
                      <Link
                        href={`/student/assignments/${sub.taskId}`}
                        className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{task?.title ?? '—'}</p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}
                          >
                            {SUBMISSION_STATUS_LABELS[sub.status]}
                          </span>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-green-700">
                          {sub.grade}/{sub.maxGrade ?? 10}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'all' && (
            <StatDetailPanel
              title="Tất cả bài tập"
              count={submissions.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Chưa có bài tập."
            >
              <ul className="divide-y divide-gray-100 rounded-lg border">
                {submissions.map((sub) => {
                  const task = getTaskById(sub.taskId)
                  return (
                    <li key={sub.id}>
                      <Link
                        href={`/student/assignments/${sub.taskId}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{task?.title ?? '—'}</p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}
                          >
                            {SUBMISSION_STATUS_LABELS[sub.status]}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {sub.grade != null ? `${sub.grade}/${sub.maxGrade ?? 10}` : 'Chưa có điểm'}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </StatDetailPanel>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Lớp học của bạn</h2>
                <Link href="/student/join" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  + Tham gia
                </Link>
              </div>
              {classes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
                  <GraduationCap className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Chưa có lớp nào</p>
                  <Link href="/student/join" className="mt-3 inline-block text-sm font-medium text-primary-600">
                    Nhập mã lớp để tham gia
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.map((c) => (
                    <Link
                      key={c.id}
                      href={`/student/courses/${c.id}`}
                      className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
                    >
                      <p className="font-medium text-gray-900">{c.title}</p>
                      <p className="mt-1 font-mono text-xs text-primary-600">Mã: {c.classCode}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Bài tập gần đây</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('submissions')}
                  className="text-sm font-medium text-primary-600"
                >
                  Xem tất cả
                </button>
              </div>
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có bài tập</p>
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.map(({ sub, task }) => (
                    <Link
                      key={sub.id}
                      href={`/student/assignments/${sub.taskId}`}
                      className="block rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{task!.title}</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}
                      >
                        {SUBMISSION_STATUS_LABELS[sub.status]}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-4">
          <Link
            href="/student/join"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tham gia lớp mới
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/student/courses/${c.id}`}
                className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                  <GraduationCap className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                <p className="mt-2 font-mono text-sm text-primary-600">{c.classCode}</p>
              </Link>
            ))}
          </div>
          {classes.length === 0 && (
            <div className="rounded-xl border border-dashed bg-white py-12 text-center">
              <p className="text-gray-500">Chưa tham gia lớp nào</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:px-6">
                    Bài tập
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Điểm
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((sub) => {
                  const task = getTaskById(sub.taskId)
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 sm:px-6">
                        <Link
                          href={`/student/assignments/${sub.taskId}`}
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          {task?.title ?? '—'}
                        </Link>
                        <p className="text-xs text-gray-500">Hạn: {task ? formatDate(task.dueDate) : '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}>
                          {SUBMISSION_STATUS_LABELS[sub.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {sub.grade != null ? `${sub.grade}/${sub.maxGrade ?? 10}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {submissions.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">Tham gia lớp để nhận bài tập.</p>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
