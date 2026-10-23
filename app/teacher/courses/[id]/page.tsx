'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, FileText, Plus, Copy, Paperclip, GraduationCap, CalendarDays, Video, ClipboardList, Timer } from 'lucide-react'
import ClassHomeOverview from '@/components/class/ClassHomeOverview'
import ClassSchedulePanel from '@/components/class/ClassSchedulePanel'
import ClassSettingsActions from '@/components/class/ClassSettingsActions'
import TeachingPlanPanel from '@/components/class/TeachingPlanPanel'
import CourseEvalManagePanel from '@/components/class/CourseEvalManagePanel'
import PracticeSetPanel from '@/components/class/PracticeSetPanel'
import OnlineSessionPanel from '@/components/online/OnlineSessionPanel'
import Link from 'next/link'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText } from '@/components/i18n/useContentText'
import PageHeader from '@/components/layout/PageHeader'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate } from '@/lib/format'
import ClassStatusBadge from '@/components/class/ClassStatusBadge'

const COURSE_TABS = ['overview', 'plan', 'schedule', 'online', 'students', 'assignments', 'practice'] as const

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const currentUser = useAuthStore((s) => s.currentUser)!
  const { t, locale } = useI18n()
  const text = useContentText()
  const tabParam = searchParams.get('tab')
  const tabFromUrl = COURSE_TABS.includes(tabParam as (typeof COURSE_TABS)[number])
    ? (tabParam as (typeof COURSE_TABS)[number])
    : 'overview'
  const [activeTab, setActiveTabState] = useState(tabFromUrl)
  useEffect(() => {
    setActiveTabState(tabFromUrl)
  }, [tabFromUrl])
  const setActiveTab = (id: (typeof COURSE_TABS)[number] | string) => {
    if (COURSE_TABS.includes(id as (typeof COURSE_TABS)[number])) {
      setActiveTabState(id as (typeof COURSE_TABS)[number])
    }
    const next = new URLSearchParams(searchParams.toString())
    if (id === 'overview') next.delete('tab')
    else next.set('tab', id)
    const qs = next.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }

  const classroom = useEduStore((s) => s.classes.find((c) => c.id === courseId))
  const assignments = useEduStore((s) => s.tasks.filter((task) => task.classId === courseId))
  const getSubmissionStats = useEduStore((s) => s.getSubmissionStats)

  if (!classroom) {
    return (
      <div id="teacher-course-not-found" className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('common.notFound')}</p>
      </div>
    )
  }

  const canShareCode = classroom.status === 'published'
  const isCancelled = classroom.status === 'cancelled'

  const copyCode = async () => {
    if (!canShareCode) {
      toast.error(
        classroom.status === 'draft'
          ? t('student.uiDraftNote')
          : classroom.status === 'archived'
            ? t('student.uiArchivedNote')
            : t('student.uiCancelledNote')
      )
      return
    }
    await navigator.clipboard.writeText(classroom.classCode)
    toast.success(t('common.copiedCode', { code: classroom.classCode }))
  }

  const tabs = [
    { id: 'overview', label: t('nav.overview'), icon: GraduationCap },
    { id: 'plan', label: t('charts.planByClass'), icon: ClipboardList },
    { id: 'schedule', label: t('schedule.timetable'), icon: CalendarDays },
    { id: 'online', label: t('status.notification.online_class'), icon: Video },
    { id: 'students', label: t('role.student'), icon: Users },
    { id: 'assignments', label: t('common.assignment'), icon: FileText },
    { id: 'practice', label: t('status.notification.practice_set'), icon: Timer },
  ]

  return (
    <div id="teacher-course" className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader
        id="teacher-course-header"
        userId={currentUser.id}
        title={text(classroom.title)}
        subtitle={`${t('common.classCode')}: ${classroom.classCode}`}
        backHref="/teacher/dashboard"
        action={
          isCancelled ? (
            <ClassStatusBadge status={classroom.status} />
          ) : (
            <Link
              id="teacher-course-assign"
              href={`/teacher/classes/${courseId}/assignments/new`}
              className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.assignments')}</span>
            </Link>
          )
        }
      />

      <div id="teacher-course-content" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <button
          id="teacher-course-copy-code"
          type="button"
          onClick={copyCode}
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          <Copy className="mr-1 h-4 w-4" />
          {canShareCode ? t('common.copy') : t('common.classCode')}:{' '}
          <span className="ml-1 font-mono font-bold">{classroom.classCode}</span>
        </button>
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="meta-secondary mb-2 text-2xl font-bold text-gray-900">{text(classroom.title)}</h2>
          <p className="meta-secondary mb-4 text-gray-600">{text(classroom.description) || t('common.noData')}</p>
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {t('common.studentCount', { count: classroom.students.length })}
            </div>
            <div className="meta-secondary flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              {t('common.itemCount', { count: assignments.length })}
            </div>
            <div className="meta-secondary flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(classroom.createdAt, locale)}
            </div>
          </div>
          <ClassSettingsActions idPrefix="teacher-course-settings" classroom={classroom} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b">
            <nav id="teacher-course-tabs" className="flex gap-x-6 overflow-x-auto px-4 sm:px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`teacher-course-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div id="teacher-course-overview" className="space-y-6">
                <ClassHomeOverview
                  id="teacher-course-home"
                  classId={courseId}
                  tasks={assignments}
                  userId={currentUser.id}
                  assignmentHref={(taskId) => `/teacher/assignments/${taskId}/submissions`}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">{t('role.student')}</p>
                    <p className="text-2xl font-bold text-blue-900">{classroom.students.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">{t('common.assignment')}</p>
                    <p className="text-2xl font-bold text-green-900">{assignments.length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">{t('common.classCode')}</p>
                    <p className="text-2xl font-bold text-purple-900 font-mono">{classroom.classCode}</p>
                  </div>
                </div>
                <CourseEvalManagePanel id="teacher-course-eval-manage" classId={courseId} />
              </div>
            )}

            {activeTab === 'plan' && (
              <TeachingPlanPanel id="teacher-course-plan" classId={courseId} isTeacher={!isCancelled} />
            )}

            {activeTab === 'schedule' && (
              <ClassSchedulePanel
                id="teacher-course-schedule"
                classId={courseId}
                students={classroom.students}
                isTeacher={!isCancelled}
              />
            )}

            {activeTab === 'online' && (
              <OnlineSessionPanel id="teacher-course-online" classId={courseId} isTeacher={!isCancelled} />
            )}

            {activeTab === 'students' && (
              <div id="teacher-course-students" className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('role.student')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('common.email')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {t('common.progress')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {classroom.students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <Link
                            id={`teacher-course-student-${student.id}`}
                            href={`/teacher/courses/${courseId}/students/${student.id}`}
                            className="text-primary-700 hover:text-primary-800 hover:underline"
                          >
                            {student.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          <Link
                            id={`teacher-course-student-progress-${student.id}`}
                            href={`/teacher/courses/${courseId}/students/${student.id}`}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            {t('common.viewDetails')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {classroom.students.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-500">
                    {t('charts.noStudents')} <strong>{classroom.classCode}</strong>
                  </p>
                )}
              </div>
            )}

            {activeTab === 'assignments' && (
              <div id="teacher-course-assignments" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{t('common.assignment')}</h3>
                  {!isCancelled && (
                    <Link
                      id="teacher-course-create-assignment"
                      href={`/teacher/classes/${courseId}/assignments/new`}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('nav.assignments')}
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map((assignment, index) => {
                    const stats = getSubmissionStats(assignment.id)
                    return (
                      <motion.div
                        key={assignment.id}
                        id={`teacher-course-assignment-card-${assignment.id}`}
                        initial={false}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <h4 className="text-sm font-medium text-gray-900 mb-2">{text(assignment.title)}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{assignment.description}</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-3">
                          <div className="flex justify-between">
                            <span>{t('charts.submitted')}:</span>
                            <span>
                              {stats.submitted}/{stats.total}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('common.due')}:</span>
                            <span>{formatDate(assignment.dueDate, locale)}</span>
                          </div>
                          {assignment.attachments.length > 0 && (
                            <div className="flex items-center text-primary-600">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {t('common.attachments', { count: assignment.attachments.length })}
                            </div>
                          )}
                        </div>
                        <Link
                          id={`teacher-course-assignment-track-${assignment.id}`}
                          href={`/teacher/assignments/${assignment.id}/submissions`}
                          className="block w-full text-center bg-primary-600 text-white py-2 rounded text-sm hover:bg-primary-700"
                        >
                          {t('teacher.trackSubmissions')}
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>

                {assignments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    {t('charts.noAssigned')}{' '}
                    {!isCancelled && (
                      <Link
                        id="teacher-course-first-assignment"
                        href={`/teacher/classes/${courseId}/assignments/new`}
                        className="text-primary-600"
                      >
                        {t('nav.assignments')}
                      </Link>
                    )}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'practice' && (
              <PracticeSetPanel id="teacher-course-practice" classId={courseId} canEdit={!isCancelled} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
