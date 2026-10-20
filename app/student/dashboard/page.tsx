'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle,
  Clock,
  Plus,
  FileText,
  Award,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
} from 'lucide-react'
import ClassChatPanel from '@/components/chat/ClassChatPanel'
import SettingsPanel from '@/components/settings/SettingsPanel'
import DashboardScheduleTable from '@/components/dashboard/DashboardScheduleTable'
import EnterClassButton from '@/components/dashboard/EnterClassButton'
import QuickAccess from '@/components/dashboard/QuickAccess'
import StudentLearningCharts from '@/components/dashboard/StudentLearningCharts'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import DashboardShell from '@/components/layout/DashboardShell'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate, SUBMISSION_STATUS_COLORS } from '@/lib/format'
import StatDetailPanel from '@/components/dashboard/StatDetailPanel'

type StudentStatKey = 'classes' | 'pending' | 'graded' | 'all'

export default function StudentDashboard() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentUser = useAuthStore((s) => s.currentUser)!
  const logout = useAuthStore((s) => s.logout)
  const getClassesByStudent = useEduStore((s) => s.getClassesByStudent)
  const getStudentSubmissions = useEduStore((s) => s.getStudentSubmissions)
  const getTaskById = useEduStore((s) => s.getTaskById)
  const tasks = useEduStore((s) => s.tasks)

  const tabParam = searchParams.get('tab')
  const initialTab =
    tabParam === 'chat' || tabParam === 'settings' || tabParam === 'courses' || tabParam === 'submissions'
      ? tabParam
      : 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [activeStat, setActiveStat] = useState<StudentStatKey | null>(null)

  const classes = getClassesByStudent(currentUser.id, currentUser.email)
  const submissions = getStudentSubmissions(currentUser.id)
  const studentTasks = useMemo(
    () => tasks.filter((t) => classes.some((c) => c.id === t.classId)),
    [tasks, classes]
  )

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
    { key: 'classes', title: t('student.classes'), value: String(classes.length), icon: BookOpen, color: 'bg-blue-500' },
    { key: 'pending', title: t('student.pending'), value: String(pendingCount), icon: Clock, color: 'bg-amber-500' },
    { key: 'graded', title: t('student.graded'), value: String(gradedCount), icon: Award, color: 'bg-green-500' },
    { key: 'all', title: t('student.allTasks'), value: String(submissions.length), icon: FileText, color: 'bg-violet-500' },
  ]

  const recentSubmissions = useMemo(() => {
    return [...submissions]
      .map((sub) => ({ sub, task: getTaskById(sub.taskId) }))
      .filter((x) => x.task)
      .slice(0, 5)
  }, [submissions, getTaskById])

  const sidebarItems = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'courses', label: t('nav.classes'), icon: GraduationCap },
    { id: 'chat', label: t('nav.classChat'), icon: MessageCircle },
    { id: 'submissions', label: t('nav.submissions'), icon: CheckCircle },
    { id: 'settings', label: t('common.settings'), icon: Settings },
  ]

  const tabTitles: Record<string, string> = {
    overview: t('nav.overview'),
    courses: t('nav.classes'),
    chat: t('nav.classChat'),
    submissions: t('nav.submissions'),
    settings: t('common.settings'),
  }

  const handleLogout = async () => {
    await logout()
    toast.success(t('common.loggedOut'))
    router.push('/login')
  }

  const enterClassButton = <EnterClassButton classes={classes} />

  return (
    <DashboardShell
      idPrefix="student-dashboard"
      userId={currentUser.id}
      roleShort="HS"
      roleLabel={t('role.student')}
      userName={currentUser.fullName}
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      headerTitle={tabTitles[activeTab]}
      headerSubtitle={t('student.subtitle')}
      headerAction={enterClassButton}
    >
      {activeTab === 'overview' && (
        <div id="student-dashboard-overview" className="space-y-6">
          <QuickAccess
            onOpenChat={() => setActiveTab('chat')}
            onOpenSubmissions={() => setActiveTab('submissions')}
          />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => {
              const selected = activeStat === stat.key
              return (
                <button
                  key={stat.key}
                  id={`student-dashboard-stat-${stat.key}`}
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
                    {selected ? t('common.showingList') : t('common.tapToList')}
                  </p>
                </button>
              )
            })}
          </div>

          {activeStat === 'classes' && (
            <StatDetailPanel
              id="student-dashboard-stat-detail-classes"
              title={t('student.classes')}
              count={classes.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('student.noClasses')}
            >
              <ul className="space-y-2">
                {classes.map((c) => (
                  <li key={c.id}>
                    <Link
                      id={`student-dashboard-class-item-${c.id}`}
                      href={`/student/courses/${c.id}`}
                      className="block rounded-lg border p-3 hover:border-primary-200 hover:bg-primary-50/50"
                    >
                      <p className="font-medium text-gray-900">{c.title}</p>
                      <p className="mt-1 font-mono text-xs text-primary-600">{t('common.code')}: {c.classCode}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'pending' && (
            <StatDetailPanel
              id="student-dashboard-stat-detail-pending"
              title={t('student.pending')}
              count={pendingSubmissions.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('student.noPending')}
            >
              <ul className="space-y-2">
                {pendingSubmissions.map((sub) => {
                  const task = getTaskById(sub.taskId)
                  return (
                    <li key={sub.id}>
                      <Link
                        id={`student-dashboard-pending-item-${sub.id}`}
                        href={`/student/assignments/${sub.taskId}`}
                        className="block rounded-lg border border-amber-200 bg-amber-50/40 p-3 hover:bg-amber-50"
                      >
                        <p className="font-medium text-gray-900">{task?.title ?? '—'}</p>
                        <p className="text-xs text-gray-500">
                          {t('common.due')}: {task ? formatDate(task.dueDate, locale) : '—'}
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
              id="student-dashboard-stat-detail-graded"
              title={t('student.gradedTitle')}
              count={gradedSubmissions.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('student.noGraded')}
            >
              <ul className="space-y-2">
                {gradedSubmissions.map((sub) => {
                  const task = getTaskById(sub.taskId)
                  return (
                    <li key={sub.id}>
                      <Link
                        id={`student-dashboard-graded-item-${sub.id}`}
                        href={`/student/assignments/${sub.taskId}`}
                        className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{task?.title ?? '—'}</p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}
                          >
                            {t(`status.submission.${sub.status}`)}
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
              id="student-dashboard-stat-detail-all"
              title={t('student.allTitle')}
              count={submissions.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('student.noTasks')}
            >
              <ul className="divide-y divide-gray-100 rounded-lg border">
                {submissions.map((sub) => {
                  const task = getTaskById(sub.taskId)
                  return (
                    <li key={sub.id}>
                      <Link
                        id={`student-dashboard-all-item-${sub.id}`}
                        href={`/student/assignments/${sub.taskId}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{task?.title ?? '—'}</p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}
                          >
                            {t(`status.submission.${sub.status}`)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {sub.grade != null ? `${sub.grade}/${sub.maxGrade ?? 10}` : t('common.noGrade')}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </StatDetailPanel>
          )}

          <DashboardScheduleTable
            id="student-dashboard-schedule"
            classes={classes}
            tasks={studentTasks}
            assignmentHref={(taskId) => `/student/assignments/${taskId}`}
            classHref={(classId) => `/student/courses/${classId}`}
          />

          <StudentLearningCharts
            id="student-dashboard-charts"
            classes={classes}
            submissions={submissions}
            tasks={studentTasks}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div id="student-dashboard-classes-preview" className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t('student.yourClasses')}</h2>
                <button
                  id="student-dashboard-classes-view-all"
                  type="button"
                  onClick={() => setActiveTab('courses')}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {t('common.viewAll')}
                </button>
              </div>
              {classes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
                  <GraduationCap className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">{t('student.emptyClasses')}</p>
                  <Link id="student-dashboard-join-link" href="/student/join" className="mt-3 inline-block text-sm font-medium text-primary-600">
                    {t('student.joinHint')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.map((c) => (
                    <Link
                      key={c.id}
                      id={`student-dashboard-preview-class-${c.id}`}
                      href={`/student/courses/${c.id}`}
                      className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
                    >
                      <p className="font-medium text-gray-900">{c.title}</p>
                      <p className="mt-1 font-mono text-xs text-primary-600">{t('common.code')}: {c.classCode}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div id="student-dashboard-assignments-preview" className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t('student.recent')}</h2>
                <button
                  id="student-dashboard-assignments-view-all"
                  type="button"
                  onClick={() => setActiveTab('submissions')}
                  className="text-sm font-medium text-primary-600"
                >
                  {t('common.viewAll')}
                </button>
              </div>
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-gray-500">{t('student.noRecent')}</p>
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.map(({ sub, task }) => (
                    <Link
                      key={sub.id}
                      id={`student-dashboard-recent-item-${sub.id}`}
                      href={`/student/assignments/${sub.taskId}`}
                      className="block rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{task!.title}</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}
                      >
                        {t(`status.submission.${sub.status}`)}
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
        <div id="student-dashboard-courses" className="space-y-4">
          <Link
            id="student-dashboard-join-class"
            href="/student/join"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('common.joinClass')}
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                id={`student-dashboard-course-card-${c.id}`}
                href={`/student/courses/${c.id}`}
                className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                  <GraduationCap className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                {c.status === 'cancelled' && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {t('common.cancelled')}
                  </span>
                )}
                <p className="mt-2 font-mono text-sm text-primary-600">{c.classCode}</p>
              </Link>
            ))}
          </div>
          {classes.length === 0 && (
            <div className="rounded-xl border border-dashed bg-white py-12 text-center">
              <p className="text-gray-500">{t('student.emptyJoined')}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div id="student-dashboard-submissions" className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:px-6">
                    {t('common.assignment')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t('common.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t('common.grade')}
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
                          id={`student-dashboard-submission-item-${sub.id}`}
                          href={`/student/assignments/${sub.taskId}`}
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          {task?.title ?? '—'}
                        </Link>
                        <p className="text-xs text-gray-500">{t('common.due')}: {task ? formatDate(task.dueDate, locale) : '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}>
                          {t(`status.submission.${sub.status}`)}
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
            <p className="p-8 text-center text-sm text-gray-500">{t('student.joinToGetTasks')}</p>
          )}
        </div>
      )}

      {activeTab === 'chat' && <ClassChatPanel id="student-dashboard-chat" userId={currentUser.id} />}

      {activeTab === 'settings' && <SettingsPanel id="student-dashboard-settings" />}
    </DashboardShell>
  )
}
