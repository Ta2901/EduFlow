'use client'

import Link from 'next/link'
import { useI18n } from '@/components/i18n/LanguageProvider'
import PageHeader from '@/components/layout/PageHeader'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDate, formatDateTime, SUBMISSION_STATUS_COLORS } from '@/lib/format'

export default function StudentSubmissionsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)!
  const { t, locale } = useI18n()
  const getStudentSubmissions = useEduStore((s) => s.getStudentSubmissions)
  const getTaskById = useEduStore((s) => s.getTaskById)
  const getClassById = useEduStore((s) => s.getClassById)

  const submissions = getStudentSubmissions(currentUser.id)

  return (
    <div id="student-submissions" className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader id="student-submissions-header" userId={currentUser.id} title={t('charts.submissionStatus')} backHref="/student/dashboard" />

      <div id="student-submissions-list" className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white py-12 text-center">
            <p className="text-gray-500">{t('charts.noTasks')}</p>
            <Link id="student-submissions-join" href="/student/join" className="mt-2 inline-block text-sm font-medium text-primary-600">
              {t('common.joinClass')}
            </Link>
          </div>
        ) : (
          submissions.map((sub) => {
            const task = getTaskById(sub.taskId)
            const classroom = task ? getClassById(task.classId) : undefined
            return (
              <Link
                key={sub.id}
                id={`student-submissions-item-${sub.id}`}
                href={`/student/assignments/${sub.taskId}`}
                className="block rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900">{task?.title ?? t('common.assignment')}</h3>
                    <p className="text-sm text-gray-500">{classroom?.title}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${SUBMISSION_STATUS_COLORS[sub.status]}`}>
                    {t(`status.submission.${sub.status}`)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {task && <span>{t('common.due')}: {formatDate(task.dueDate, locale)}</span>}
                  {sub.submittedAt && <span>{t('charts.submittedAt', { time: formatDateTime(sub.submittedAt, locale) })}</span>}
                  {sub.grade != null && (
                    <span className="font-medium text-green-700">
                      {t('charts.scoreLine', { grade: sub.grade, max: sub.maxGrade ?? 10 })}
                    </span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
