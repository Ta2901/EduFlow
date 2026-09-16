'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, FileText, Plus, Copy, Paperclip, GraduationCap, CalendarDays, Video, ClipboardList, Timer } from 'lucide-react'
import ClassSchedulePanel from '@/components/class/ClassSchedulePanel'
import ClassSettingsActions from '@/components/class/ClassSettingsActions'
import TeachingPlanPanel from '@/components/class/TeachingPlanPanel'
import CourseEvalManagePanel from '@/components/class/CourseEvalManagePanel'
import PracticeSetPanel from '@/components/class/PracticeSetPanel'
import OnlineSessionPanel from '@/components/online/OnlineSessionPanel'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { useParams, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate } from '@/lib/format'

export default function CourseDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const currentUser = useAuthStore((s) => s.currentUser)!
  const initialTab = searchParams.get('tab') === 'plan' ? 'plan' : 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)

  const getClassById = useEduStore((s) => s.getClassById)
  const getTasksByClass = useEduStore((s) => s.getTasksByClass)
  const getSubmissionStats = useEduStore((s) => s.getSubmissionStats)

  const classroom = getClassById(courseId)
  const assignments = getTasksByClass(courseId)

  if (!classroom) {
    return (
      <div id="teacher-course-not-found" className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy lớp học</p>
      </div>
    )
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(classroom.classCode)
    toast.success('Đã sao chép mã lớp')
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: GraduationCap },
    { id: 'plan', label: 'Kế hoạch', icon: ClipboardList },
    { id: 'schedule', label: 'Thời khóa biểu', icon: CalendarDays },
    { id: 'online', label: 'Học online', icon: Video },
    { id: 'students', label: 'Học sinh', icon: Users },
    { id: 'assignments', label: 'Bài tập', icon: FileText },
    { id: 'practice', label: 'Luyện tập', icon: Timer },
  ]

  return (
    <div id="teacher-course" className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader
        id="teacher-course-header"
        userId={currentUser.id}
        title={classroom.title}
        subtitle={`Mã lớp: ${classroom.classCode}`}
        backHref="/teacher/dashboard"
        action={
          <Link
            id="teacher-course-assign"
            href={`/teacher/classes/${courseId}/assignments/new`}
            className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Giao bài</span>
          </Link>
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
          Sao chép mã: <span className="ml-1 font-mono font-bold">{classroom.classCode}</span>
        </button>
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{classroom.title}</h2>
          <p className="text-gray-600 mb-4">{classroom.description || 'Chưa có mô tả'}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {classroom.students.length} học sinh
            </div>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              {assignments.length} bài tập
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Tạo: {formatDate(classroom.createdAt)}
            </div>
          </div>
          <ClassSettingsActions idPrefix="teacher-course-settings" classroom={classroom} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b">
            <nav id="teacher-course-tabs" className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`teacher-course-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Học sinh</p>
                    <p className="text-2xl font-bold text-blue-900">{classroom.students.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Bài tập</p>
                    <p className="text-2xl font-bold text-green-900">{assignments.length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Mã lớp</p>
                    <p className="text-2xl font-bold text-purple-900 font-mono">{classroom.classCode}</p>
                  </div>
                </div>
                <CourseEvalManagePanel id="teacher-course-eval-manage" classId={courseId} />
              </div>
            )}

            {activeTab === 'plan' && (
              <TeachingPlanPanel id="teacher-course-plan" classId={courseId} isTeacher />
            )}

            {activeTab === 'schedule' && (
              <ClassSchedulePanel
                id="teacher-course-schedule"
                classId={courseId}
                students={classroom.students}
                isTeacher
              />
            )}

            {activeTab === 'online' && (
              <OnlineSessionPanel id="teacher-course-online" classId={courseId} isTeacher />
            )}

            {activeTab === 'students' && (
              <div id="teacher-course-students" className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Học sinh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Tiến trình
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
                            Xem →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {classroom.students.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Chưa có học sinh. Chia sẻ mã lớp <strong>{classroom.classCode}</strong> để học sinh
                    tham gia.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'assignments' && (
              <div id="teacher-course-assignments" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Bài tập và kiểm tra</h3>
                  <Link
                    id="teacher-course-create-assignment"
                    href={`/teacher/classes/${courseId}/assignments/new`}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài tập
                  </Link>
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
                        <h4 className="text-sm font-medium text-gray-900 mb-2">{assignment.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{assignment.description}</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-3">
                          <div className="flex justify-between">
                            <span>Đã nộp:</span>
                            <span>
                              {stats.submitted}/{stats.total}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Hạn nộp:</span>
                            <span>{formatDate(assignment.dueDate)}</span>
                          </div>
                          {assignment.attachments.length > 0 && (
                            <div className="flex items-center text-primary-600">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {assignment.attachments.length} tệp đính kèm
                            </div>
                          )}
                        </div>
                        <Link
                          id={`teacher-course-assignment-track-${assignment.id}`}
                          href={`/teacher/assignments/${assignment.id}/submissions`}
                          className="block w-full text-center bg-primary-600 text-white py-2 rounded text-sm hover:bg-primary-700"
                        >
                          Theo dõi nộp bài
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>

                {assignments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có bài tập.{' '}
                    <Link
                      id="teacher-course-first-assignment"
                      href={`/teacher/classes/${courseId}/assignments/new`}
                      className="text-primary-600"
                    >
                      Giao bài tập đầu tiên
                    </Link>
                  </p>
                )}
              </div>
            )}

            {activeTab === 'practice' && (
              <PracticeSetPanel id="teacher-course-practice" classId={courseId} canEdit />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
