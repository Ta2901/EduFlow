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
import DashboardShell from '@/components/layout/DashboardShell'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate } from '@/lib/format'
import StatDetailPanel from '@/components/dashboard/StatDetailPanel'

type TeacherStatKey = 'classes' | 'students' | 'tasks' | 'codes'

const sidebarItems = [
  { id: 'overview', label: 'Tổng quan', icon: TrendingUp },
  { id: 'courses', label: 'Lớp học', icon: GraduationCap },
  { id: 'chat', label: 'Chat lớp', icon: MessageCircle },
  { id: 'assignments', label: 'Bài tập', icon: CheckCircle },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
]

export default function TeacherDashboard() {
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
      title: 'Lớp đang dạy',
      value: String(classes.length),
      icon: BookOpen,
      color: 'bg-blue-500',
      change: `${classes.length} lớp`,
    },
    {
      key: 'students',
      title: 'Học sinh',
      value: String(totalStudents),
      icon: Users,
      color: 'bg-green-500',
      change: 'Tổng HS',
    },
    {
      key: 'tasks',
      title: 'Bài tập đã giao',
      value: String(teacherTasks.length),
      icon: CheckCircle,
      color: 'bg-amber-500',
      change: `${pendingAssignments.filter((a) => a.submitted < a.total).length} chờ nộp`,
    },
    {
      key: 'codes',
      title: 'Mã lớp',
      value: String(classes.length),
      icon: ClipboardList,
      color: 'bg-violet-500',
      change: 'Nhấn để xem & sao chép',
    },
  ]

  const tabTitles: Record<string, string> = {
    overview: 'Tổng quan',
    courses: 'Lớp học',
    chat: 'Chat lớp',
    assignments: 'Bài tập',
    settings: 'Cài đặt',
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Đã đăng xuất')
    router.push('/login')
  }

  const copyClassCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    toast.success(`Đã sao chép mã: ${code}`)
  }

  const createClassBtn = (
    <Link
      id="teacher-dashboard-create-class"
      href="/teacher/classes/new"
      className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
    >
      <Plus className="mr-1.5 h-4 w-4" />
      <span className="hidden sm:inline">Tạo lớp mới</span>
      <span className="sm:hidden">Tạo lớp</span>
    </Link>
  )

  return (
    <DashboardShell
      idPrefix="teacher-dashboard"
      userId={currentUser.id}
      roleShort="GV"
      roleLabel="Giáo viên"
      userName={currentUser.fullName}
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      headerTitle={tabTitles[activeTab]}
      headerSubtitle="Quản lý lớp học và học sinh"
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
                    {selected ? 'Đang hiển thị danh sách ▲' : 'Nhấn để xem danh sách'}
                  </p>
                </button>
              )
            })}
          </div>

          {activeStat === 'classes' && (
            <StatDetailPanel
              id="teacher-dashboard-stat-detail-classes"
              title="Danh sách lớp đang dạy"
              count={classes.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Chưa có lớp nào. Tạo lớp mới để bắt đầu."
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
                        {course.students.length} học sinh · Mã{' '}
                        <span className="font-mono font-semibold text-primary-600">{course.classCode}</span>
                      </p>
                    </div>
                    <Link
                      id={`teacher-dashboard-class-item-${course.id}`}
                      href={`/teacher/courses/${course.id}`}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      Chi tiết
                    </Link>
                  </li>
                ))}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'students' && (
            <StatDetailPanel
              id="teacher-dashboard-stat-detail-students"
              title="Danh sách học sinh"
              count={allStudents.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Chưa có học sinh trong các lớp."
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
                      <p className="mt-1 text-xs text-primary-600">Lớp: {student.classTitle}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </StatDetailPanel>
          )}

          {activeStat === 'tasks' && (
            <StatDetailPanel
              id="teacher-dashboard-stat-detail-tasks"
              title="Danh sách bài tập đã giao"
              count={teacherTasks.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Chưa có bài tập. Vào lớp để giao bài."
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
                            {stat.submitted}/{stat.total} đã nộp
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{classroom?.title ?? '—'}</p>
                        <p className="mt-1 text-xs text-gray-400">Hạn: {formatDate(task.dueDate)}</p>
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
              title="Mã lớp học"
              count={classes.length}
              onClose={() => setActiveStat(null)}
              emptyMessage="Chưa có mã lớp."
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
                      Sao chép
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
                <h2 className="font-semibold text-gray-900">Lớp học của bạn</h2>
                <button id="teacher-dashboard-classes-view-all" type="button" onClick={() => setActiveTab('courses')} className="text-sm font-medium text-primary-600">
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                {classes.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-8 text-center">
                    <Link id="teacher-dashboard-create-first" href="/teacher/classes/new" className="text-sm font-medium text-primary-600">
                      Tạo lớp đầu tiên
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
                        <p className="text-sm text-gray-500">{course.students.length} học sinh</p>
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
                <h2 className="font-semibold text-gray-900">Theo dõi nộp bài</h2>
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                {pendingAssignments.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có bài tập</p>
                ) : (
                  pendingAssignments.slice(0, 4).map((a) => (
                    <Link key={a.id} id={`teacher-dashboard-pending-item-${a.id}`} href={`/teacher/assignments/${a.id}/submissions`} className="block rounded-lg border p-3 hover:shadow-sm">
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.class}</p>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-gray-500">{a.submitted}/{a.total} đã nộp</span>
                        <span className="text-red-600">Hạn: {formatDate(a.dueDate)}</span>
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
            Tạo lớp mới
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
                      Đã huỷ
                    </span>
                  )}
                  <p className="mt-1 text-sm text-gray-500">{course.students.length} học sinh</p>
                  <button type="button" onClick={() => copyClassCode(course.classCode)} className="mt-2 inline-flex items-center text-xs text-primary-600">
                    <Copy className="mr-1 h-3 w-3" />
                    <span className="font-mono font-bold">{course.classCode}</span>
                  </button>
                  <Link id={`teacher-dashboard-manage-class-${course.id}`} href={`/teacher/courses/${course.id}`} className="mt-4 block rounded-lg bg-primary-600 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-700">
                    Quản lý lớp
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
            <p className="text-gray-500">Chưa có bài tập. Vào lớp để giao bài.</p>
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
                  <p className="mt-2 text-xs text-gray-400">Hạn: {formatDate(task.dueDate)}</p>
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
