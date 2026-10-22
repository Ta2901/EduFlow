'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Paperclip } from 'lucide-react'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText } from '@/components/i18n/useContentText'
import PageHeader from '@/components/layout/PageHeader'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate, SUBMISSION_STATUS_COLORS } from '@/lib/format'
import ClassHomeOverview from '@/components/class/ClassHomeOverview'
import ClassSchedulePanel from '@/components/class/ClassSchedulePanel'
import OnlineSessionPanel from '@/components/online/OnlineSessionPanel'
import StudentEvalPanel from '@/components/class/StudentEvalPanel'
import StudentPracticePanel from '@/components/class/StudentPracticePanel'
import ClassStatusBadge from '@/components/class/ClassStatusBadge'

export default function StudentCoursePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const currentUser = useAuthStore((s) => s.currentUser)!
  const { t, locale } = useI18n()
  const text = useContentText()
  const classroom = useEduStore((s) => s.classes.find((c) => c.id === courseId))
  const tasks = useEduStore((s) => s.tasks.filter((task) => task.classId === courseId))
  const submissions = useEduStore((s) => s.submissions)
  const evalSession = searchParams.get('eval')
  const courseEvalParam = searchParams.get('courseEval')
  const courseEvalKind =
    courseEvalParam === 'midterm' || courseEvalParam === 'final' ? courseEvalParam : null

  if (!classroom) {
    return (
      <div id="student-course-not-found" className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        {t('common.notFound')}
      </div>
    )
  }

  return (
    <div id="student-course" className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader
        id="student-course-header"
        userId={currentUser.id}
        title={text(classroom.title)}
        subtitle={`${t('common.classCode')}: ${classroom.classCode}`}
        backHref="/student/dashboard"
        action={<ClassStatusBadge status={classroom.status} />}
      />

      <div id="student-course-content" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {classroom.status === 'cancelled' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('student.uiCancelledNote')}
          </div>
        )}

        {classroom.description && (
          <div className="meta-secondary rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-gray-600">{text(classroom.description)}</p>
          </div>
        )}

        <ClassHomeOverview
          id="student-course-home"
          classId={courseId}
          tasks={tasks}
          userId={currentUser.id}
          assignmentHref={(taskId) => `/student/assignments/${taskId}`}
        />

        <StudentEvalPanel
          id="student-course-eval"
          classId={courseId}
          highlightSessionKey={evalSession}
          highlightCourseKind={courseEvalKind}
        />

        {classroom.status !== 'cancelled' && (
          <StudentPracticePanel id="student-course-practice" classId={courseId} />
        )}

        <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <OnlineSessionPanel id="student-course-online" classId={courseId} isTeacher={false} />
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <ClassSchedulePanel
            id="student-course-schedule"
            classId={courseId}
            students={classroom.students}
            isTeacher={false}
            currentStudentId={currentUser.id}
          />
        </div>

        <div id="student-course-assignments" className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-gray-900">{t('common.assignment')} ({tasks.length})</h2>
          </div>
          {tasks.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">{t('charts.noAssigned')}</p>
          ) : (
            <div className="divide-y">
              {tasks.map((task) => {
                const sub = submissions.find((s) => s.taskId === task.id && s.studentId === currentUser.id)
                return (
                  <Link
                    key={task.id}
                    id={`student-course-assignment-${task.id}`}
                    href={`/student/assignments/${task.id}`}
                    className="block p-5 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900">{text(task.title)}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{text(task.description)}</p>
                        <p className="mt-2 text-xs text-gray-400">{t('common.due')}: {formatDate(task.dueDate, locale)}</p>
                        {task.attachments.length > 0 && (
                          <p className="mt-1 flex items-center text-xs text-primary-600">
                            <Paperclip className="mr-1 h-3 w-3" />
                            {t('common.attachments', { count: task.attachments.length })}
                          </p>
                        )}
                      </div>
                      {sub && (
                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${SUBMISSION_STATUS_COLORS[sub.status]}`}>
                          {t(`status.submission.${sub.status}`)}
                        </span>
                      )}
                    </div>
                    {sub?.grade != null && (
                      <p className="mt-2 text-sm font-medium text-green-700">
                        {t('charts.scoreLine', { grade: sub.grade, max: sub.maxGrade ?? 10 })}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
