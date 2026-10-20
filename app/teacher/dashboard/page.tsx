'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  Plus,
  Copy,
  ClipboardList,
  Eye,
  GraduationCap,
  MessageCircle,
  Settings,
} from 'lucide-react'
import ClassChatPanel from '@/components/chat/ClassChatPanel'
import SettingsPanel from '@/components/settings/SettingsPanel'
import DashboardScheduleTable from '@/components/dashboard/DashboardScheduleTable'
import TeacherLearningCharts from '@/components/dashboard/TeacherLearningCharts'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import DashboardShell from '@/components/layout/DashboardShell'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate } from '@/lib/format'
import StatDetailPanel from '@/components/dashboard/StatDetailPanel'

type TeacherStatKey = 'classes' | 'students' | 'tasks' | 'codes'

export default function TeacherDashboard() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentUser = useAuthStore((s) => s.currentUser)!
  const logout = useAuthStore((s) => s.logout)
  const getClassesByTeacher = useEduStore((s) => s.getClassesByTeacher)
  const tasks = useEduStore((s) => s.tasks)
  const getSubmissionStats = useEduStore((s) => s.getSubmissionStats)

  const tabParam = searchParams.get('tab')
  const initialTab =
    tabParam === 'chat' || tabParam === 'settings' || tabParam === 'courses' || tabParam === 'assignments'
      ? tabParam
      : 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [activeStat, setActiveStat] = useState<TeacherStatKey | null>(null)

  const classes = getClassesByTeacher(currentUser.id)
  const teacherTasks = tasks.filter((t) => t.teacherId === currentUser.id)

  const pendingAssignments = useMemo(() => {
    return teacherTasks.map((task) => {
      const stats = getSubmissionStats(task.id)
      const classroom = classes.find((c) => c.id === task.classId)
      return {
        id: task.id,
        title: task.title,
        class: classroom?.title ?? '—',
        submitted: stats.submitted,
        total: stats.total,
        dueDate: task.dueDate,
      }
    })
  }, [teacherTasks, classes, getSubmissionStats])

  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0)

  const allStudents = useMemo(() => {
    return classes.flatMap((c) =>
      c.students.map((s) => ({
        ...s,
        classId: c.id,
        classTitle: c.title,
        classCode: c.classCode,
      }))
    )
  }, [classes])

  const toggleStat = (key: TeacherStatKey) => {
    setActiveStat((prev) => (prev === key ? null : key))
  }

  const stats: {
    key: TeacherStatKey
    title: string
    value: string
    icon: typeof BookOpen
    color: string
    change: string
  }[] = [
    {
      key: 'classes',
      title: t('teacher.teaching'),
      value: String(classes.length),
      icon: BookOpen,
      color: 'bg-blue-500',
      change: t('teacher.classCount', { count: classes.length }),
    },
    {
      key: 'students',
      title: t('teacher.students'),
      value: String(totalStudents),
      icon: Users,
      color: 'bg-green-500',
      change: t('teacher.totalStudents'),
    },
    {
      key: 'tasks',
      title: t('teacher.assigned'),
      value: String(teacherTasks.length),
      icon: CheckCircle,
      color: 'bg-amber-500',
      change: t('teacher.waiting', {
        count: pendingAssignments.filter((a) => a.submitted < a.total).length,
      }),
    },
    {
      key: 'codes',
      title: t('teacher.classCodes'),
      value: String(classes.length),
      icon: ClipboardList,
      color: 'bg-violet-500',
      change: t('teacher.tapCopy'),
    },
  ]

  const sidebarItems = [
    { id: 'overview', label: t('nav.overview'), icon: TrendingUp },
    { id: 'courses', label: t('nav.classes'), icon: GraduationCap },
    { id: 'chat', label: t('nav.classChat'), icon: MessageCircle },
    { id: 'assignments', label: t('nav.assignments'), icon: CheckCircle },
    { id: 'settings', label: t('common.settings'), icon: Settings },
  ]

  const tabTitles: Record<string, string> = {
    overview: t('nav.overview'),
    courses: t('nav.classes'),
    chat: t('nav.classChat'),
    assignments: t('nav.assignments'),
    settings: t('common.settings'),
  }

  const handleLogout = async () => {
    await logout()
    toast.success(t('common.loggedOut'))
    router.push('/login')
  }

  const copyClassCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    toast.success(t('common.copiedCode', { code }))
  }

  const createClassBtn = (
    <Link
      id="teacher-dashboard-create-class"
      href="/teacher/classes/new"
      className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
    >
      <Plus className="mr-1.5 h-4 w-4" />
      <span className="hidden sm:inline">{t('common.createClass')}</span>
      <span className="sm:hidden">{t('common.createClassShort')}</span>
    </Link>
  )

  return (
    <DashboardShell
      idPrefix="teacher-dashboard"
      userId={currentUser.id}
      roleShort="GV"
      roleLabel={t('role.teacher')}
      userName={currentUser.fullName}
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      headerTitle={tabTitles[activeTab]}
      headerSubtitle={t('teacher.subtitle')}
      headerAction={createClassBtn}
    >
      {activeTab === 'overview' && (
        <div id="teacher-dashboard-overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => {
              const selected = activeStat === stat.key
              return (
                <button
                  key={stat.key}
                  id={`teacher-dashboard-stat-${stat.key}`}
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
                  <p className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                  <p className="mt-2 text-[10px] font-medium text-primary-600 sm:text-xs">
                    {selected ? t('common.showingList') : t('common.tapToList')}
                  </p>
                </button>
              )
            })}
          </div>

          {activeStat === 'classes' && (
            <StatDetailPanel
              id="teacher-dashboard-stat-detail-classes"
              title={t('teacher.classList')}
              count={classes.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('teacher.noClasses')}
            >
              <ul className="space-y-2">
                {classes.map((course) => (
                  <li
                    key={course.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                      <GraduationCap className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-xs text-gray-500">
                        {t('common.studentCount', { count: course.students.length })} · {t('common.code')}{' '}
                        <span className="font-mono font-semibold text-primary-600">{course.classCode}</span>
                      </p>
                    </div>
                    <Link
                      id={`teacher-dashboard-class-item-${course.id}`}
                      href={`/teacher/courses/${course.id}`}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      {t('common.details')}
                    </Link>
                  </li>
                ))}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'students' && (
            <StatDetailPanel
              id="teacher-dashboard-stat-detail-students"
              title={t('teacher.studentList')}
              count={allStudents.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('teacher.noStudents')}
            >
              <ul className="divide-y divide-gray-100 rounded-lg border">
                {allStudents.map((student) => (
                  <li key={`${student.classId}-${student.id}`} className="px-4 py-3 hover:bg-gray-50">
                    <Link
                      id={`teacher-dashboard-student-item-${student.id}`}
                      href={`/teacher/courses/${student.classId}/students/${student.id}`}
                      className="block"
                    >
                      <p className="font-medium text-primary-700 hover:underline">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                      <p className="mt-1 text-xs text-primary-600">{t('teacher.classPrefix', { title: student.classTitle })}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'tasks' && (
            <StatDetailPanel
              id="teacher-dashboard-stat-detail-tasks"
              title={t('teacher.taskList')}
              count={teacherTasks.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('teacher.noTasks')}
            >
              <ul className="space-y-2">
                {teacherTasks.map((task) => {
                  const classroom = classes.find((c) => c.id === task.classId)
                  const stat = getSubmissionStats(task.id)
                  return (
                    <li key={task.id}>
                      <Link
                        id={`teacher-dashboard-task-item-${task.id}`}
                        href={`/teacher/assignments/${task.id}/submissions`}
                        className="block rounded-lg border p-3 hover:border-primary-200 hover:bg-primary-50/50"
                      >
                        <div className="flex justify-between gap-2">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <span className="shrink-0 text-xs font-medium text-primary-600">
                            {t('common.submittedOf', { submitted: stat.submitted, total: stat.total })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{classroom?.title ?? '—'}</p>
                        <p className="mt-1 text-xs text-gray-400">{t('common.due')}: {formatDate(task.dueDate, locale)}</p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'codes' && (
            <StatDetailPanel
              id="teacher-dashboard-stat-detail-codes"
              title={t('teacher.codeList')}
              count={classes.length}
              onClose={() => setActiveStat(null)}
              emptyMessage={t('teacher.noCodes')}
            >
              <ul className="space-y-2">
                {classes.map((course) => (
                  <li
                    key={course.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-violet-50/50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="font-mono text-lg font-bold tracking-wider text-violet-700">
                        {course.classCode}
                      </p>
                    </div>
                    <button
                      id={`teacher-dashboard-copy-code-${course.id}`}
                      type="button"
                      onClick={() => copyClassCode(course.classCode)}
                      className="inline-flex items-center rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      {t('common.copy')}
                    </button>
                  </li>
                ))}
              </ul>
            </StatDetailPanel>
          )}

          <DashboardScheduleTable
            id="teacher-dashboard-schedule"
            classes={classes}
            tasks={teacherTasks}
            assignmentHref={(taskId) => `/teacher/assignments/${taskId}/submissions`}
            classHref={(classId) => `/teacher/courses/${classId}`}
          />

          <TeacherLearningCharts
            id="teacher-dashboard-charts"
            classes={classes}
            tasks={teacherTasks}
            getSubmissionStats={getSubmissionStats}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div id="teacher-dashboard-classes-preview" className="rounded-xl border bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
                <h2 className="font-semibold text-gray-900">{t('teacher.yourClasses')}</h2>
                <button id="teacher-dashboard-classes-view-all" type="button" onClick={() => setActiveTab('courses')} className="text-sm font-medium text-primary-600">
                  {t('common.viewAll')}
                </button>
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                {classes.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-8 text-center">
                    <Link id="teacher-dashboard-create-first" href="/teacher/classes/new" className="text-sm font-medium text-primary-600">
                      {t('teacher.createFirst')}
                    </Link>
                  </div>
                ) : (
                  classes.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                        <GraduationCap className="h-7 w-7 text-primary-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">{t('common.studentCount', { count: course.students.length })}</p>
                        <button
                          type="button"
                          onClick={() => copyClassCode(course.classCode)}
                          className="mt-1 inline-flex items-center text-xs text-primary-600"
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          <span className="font-mono font-bold">{course.classCode}</span>
                        </button>
                      </div>
                      <Link id={`teacher-dashboard-preview-class-${course.id}`} href={`/teacher/courses/${course.id}`} className="shrink-0 rounded-lg p-2 text-primary-600 hover:bg-primary-50">
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div id="teacher-dashboard-pending-preview" className="rounded-xl border bg-white shadow-sm">
              <div className="border-b px-5 py-4 sm:px-6">
                <h2 className="font-semibold text-gray-900">{t('teacher.trackSubmissions')}</h2>
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                {pendingAssignments.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('teacher.noAssignments')}</p>
                ) : (
                  pendingAssignments.slice(0, 4).map((a) => (
                    <Link key={a.id} id={`teacher-dashboard-pending-item-${a.id}`} href={`/teacher/assignments/${a.id}/submissions`} className="block rounded-lg border p-3 hover:shadow-sm">
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.class}</p>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-gray-500">{t('common.submittedOf', { submitted: a.submitted, total: a.total })}</span>
                        <span className="text-red-600">{t('common.due')}: {formatDate(a.dueDate, locale)}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div id="teacher-dashboard-courses" className="space-y-4">
          <Link id="teacher-dashboard-new-class" href="/teacher/classes/new" className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
            <Plus className="mr-2 h-4 w-4" />
            {t('common.createClass')}
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((course) => (
              <div key={course.id} id={`teacher-dashboard-course-card-${course.id}`} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="flex h-28 items-center justify-center bg-primary-50">
                  <GraduationCap className="h-12 w-12 text-primary-300" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  {course.status === 'cancelled' && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {t('common.cancelled')}
                    </span>
                  )}
                  <p className="mt-1 text-sm text-gray-500">{t('common.studentCount', { count: course.students.length })}</p>
                  <button type="button" onClick={() => copyClassCode(course.classCode)} className="mt-2 inline-flex items-center text-xs text-primary-600">
                    <Copy className="mr-1 h-3 w-3" />
                    <span className="font-mono font-bold">{course.classCode}</span>
                  </button>
                  <Link id={`teacher-dashboard-manage-class-${course.id}`} href={`/teacher/courses/${course.id}`} className="mt-4 block rounded-lg bg-primary-600 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-700">
                    {t('common.manageClass')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div id="teacher-dashboard-assignments" className="space-y-3">
          {teacherTasks.length === 0 ? (
            <p className="text-gray-500">{t('teacher.noTasks')}</p>
          ) : (
            teacherTasks.map((task) => {
              const classroom = classes.find((c) => c.id === task.classId)
              const stat = getSubmissionStats(task.id)
              return (
                <Link key={task.id} id={`teacher-dashboard-assignment-item-${task.id}`} href={`/teacher/assignments/${task.id}/submissions`} className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md sm:p-5">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-500">{classroom?.title}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-primary-600">{stat.submitted}/{stat.total}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">{t('common.due')}: {formatDate(task.dueDate, locale)}</p>
                </Link>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'chat' && <ClassChatPanel id="teacher-dashboard-chat" userId={currentUser.id} />}

      {activeTab === 'settings' && <SettingsPanel id="teacher-dashboard-settings" />}
    </DashboardShell>
  )
}
