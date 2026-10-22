'use client'

import { Fragment, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Paperclip,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText } from '@/components/i18n/useContentText'
import PageHeader from '@/components/layout/PageHeader'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  SUBMISSION_STATUS_COLORS,
} from '@/lib/format'

export default function SubmissionTrackingPage() {
  const params = useParams()
  const taskId = params.taskId as string
  const currentUser = useAuthStore((s) => s.currentUser)!
  const { t, locale } = useI18n()
  const text = useContentText()

  const getTaskById = useEduStore((s) => s.getTaskById)
  const getClassById = useEduStore((s) => s.getClassById)
  const getSubmissionsByTask = useEduStore((s) => s.getSubmissionsByTask)
  const getSubmissionStats = useEduStore((s) => s.getSubmissionStats)
  const gradeSubmission = useEduStore((s) => s.gradeSubmission)

  const [gradingId, setGradingId] = useState<string | null>(null)
  const [gradeForm, setGradeForm] = useState({ grade: '', maxGrade: '10', feedback: '' })

  const task = getTaskById(taskId)
  const classroom = task ? getClassById(task.classId) : undefined
  const submissions = getSubmissionsByTask(taskId)
  const stats = getSubmissionStats(taskId)

  const sortedSubmissions = useMemo(() => {
    const order = { not_submitted: 0, late: 1, submitted: 2 }
    return [...submissions].sort((a, b) => order[a.status] - order[b.status])
  }, [submissions])

  if (!task) {
    return (
      <div id="teacher-submissions-not-found" className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('common.notFound')}</p>
      </div>
    )
  }

  const notSubmitted = submissions.filter((s) => s.status === 'not_submitted').length

  return (
    <div id="teacher-submissions" className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader
        id="teacher-submissions-header"
        userId={currentUser.id}
        title={text(task.title)}
        subtitle={`${classroom ? text(classroom.title) : ''} · ${t('common.due')}: ${formatDate(task.dueDate, locale)}`}
        backHref={`/teacher/courses/${task.classId}`}
      />

      <div id="teacher-submissions-content" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Stats */}
        <div id="teacher-submissions-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Users className="h-4 w-4" /> {t('charts.students')}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
              <CheckCircle className="h-4 w-4" /> {t('status.submission.submitted')}
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.submitted}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 text-sm mb-1">
              <Clock className="h-4 w-4" /> {t('status.submission.late')}
            </div>
            <p className="text-2xl font-bold text-orange-700">{stats.late}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <AlertCircle className="h-4 w-4" /> {t('status.submission.not_submitted')}
            </div>
            <p className="text-2xl font-bold text-gray-700">{notSubmitted}</p>
          </div>
        </div>

        {/* Task details */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('common.details')}</h2>
          <p className="text-gray-600 text-sm whitespace-pre-wrap">{text(task.description) || '—'}</p>
          {task.attachments.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Paperclip className="h-4 w-4" /> {t('common.attachments', { count: task.attachments.length })}
              </p>
              <ul className="space-y-2">
                {task.attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg"
                  >
                    <FileText className="h-4 w-4 text-primary-600" />
                    {att.url ? (
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {att.name} ({formatFileSize(att.size)})
                      </a>
                    ) : (
                      <span>{att.name} ({formatFileSize(att.size)})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Submissions table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{t('charts.submissionStatus')}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('common.submittedOf', { submitted: stats.submitted, total: stats.total })}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('role.student')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('charts.submitted')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('common.grade')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedSubmissions.map((sub, index) => (
                  <Fragment key={sub.id}>
                    <motion.tr
                        id={`teacher-submissions-row-${sub.id}`}
                        initial={false}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{sub.studentName}</p>
                        <p className="text-xs text-gray-500">{sub.studentEmail}</p>
                        {sub.content && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{sub.content}</p>
                        )}
                        {sub.submittedFiles && sub.submittedFiles.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {sub.submittedFiles.map((f) => (
                              <li
                                key={f.id}
                                className="flex items-center gap-1 text-xs text-gray-500"
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                {f.name} ({formatFileSize(f.size)})
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            SUBMISSION_STATUS_COLORS[sub.status]
                          }`}
                        >
                          {t(`status.submission.${sub.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {sub.submittedAt ? formatDateTime(sub.submittedAt, locale) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {sub.grade != null ? (
                          <div>
                            <p className="font-medium text-green-700">
                              {sub.grade}/{sub.maxGrade ?? 10}
                            </p>
                            {sub.feedback && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sub.feedback}</p>
                            )}
                          </div>
                        ) : sub.status !== 'not_submitted' ? (
                          <button
                            id={`teacher-submissions-grade-open-${sub.id}`}
                            type="button"
                            onClick={() => {
                              setGradingId(sub.id)
                              setGradeForm({ grade: '8', maxGrade: '10', feedback: '' })
                            }}
                            className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                          >
                            {t('charts.gradeAction')}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </motion.tr>
                    {gradingId === sub.id && (
                      <tr key={`${sub.id}-grade`}>
                        <td id={`teacher-submissions-grade-panel-${sub.id}`} colSpan={4} className="px-6 py-4 bg-gray-50">
                          {sub.content && (
                            <p className="mb-2 text-sm text-gray-700 whitespace-pre-wrap rounded-lg bg-white border p-3">
                              <span className="font-medium">Nội dung:</span> {sub.content}
                            </p>
                          )}
                          {sub.submittedFiles && sub.submittedFiles.length > 0 && (
                            <div className="mb-3 rounded-lg border bg-white p-3">
                              <p className="text-xs font-medium text-gray-600 mb-2">Tệp học sinh nộp</p>
                              <ul className="space-y-1">
                                {sub.submittedFiles.map((f) => (
                                  <li key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <FileText className="h-4 w-4 text-primary-600" />
                                    {f.url ? (
                                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                        {f.name} ({formatFileSize(f.size)})
                                      </a>
                                    ) : (
                                      <span>{f.name} ({formatFileSize(f.size)})</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                            <div>
                              <label className="text-xs text-gray-500">Điểm</label>
                              <input
                                id={`teacher-submissions-grade-${sub.id}`}
                                type="number"
                                min={0}
                                max={10}
                                value={gradeForm.grade}
                                onChange={(e) => setGradeForm((f) => ({ ...f, grade: e.target.value }))}
                                className="w-16 px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Thang</label>
                              <input
                                id={`teacher-submissions-max-grade-${sub.id}`}
                                type="number"
                                value={gradeForm.maxGrade}
                                onChange={(e) => setGradeForm((f) => ({ ...f, maxGrade: e.target.value }))}
                                className="w-16 px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                              <label className="text-xs text-gray-500">Nhận xét</label>
                              <input
                                id={`teacher-submissions-feedback-${sub.id}`}
                                value={gradeForm.feedback}
                                onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Nhận xét cho học sinh..."
                              />
                            </div>
                            <button
                              id={`teacher-submissions-grade-save-${sub.id}`}
                              type="button"
                              onClick={async () => {
                                const g = parseFloat(gradeForm.grade)
                                const max = parseFloat(gradeForm.maxGrade) || 10
                                if (isNaN(g)) {
                                  toast.error('Nhập điểm hợp lệ')
                                  return
                                }
                                try {
                                  await gradeSubmission(sub.id, g, max, gradeForm.feedback)
                                  setGradingId(null)
                                  toast.success('Đã gửi điểm và nhận xét')
                                } catch {
                                  toast.error('Chấm điểm thất bại')
                                }
                              }}
                              className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
                            >
                              Lưu
                            </button>
                            <button
                              id={`teacher-submissions-grade-cancel-${sub.id}`}
                              type="button"
                              onClick={() => setGradingId(null)}
                              className="px-3 py-1 border rounded text-sm"
                            >
                              Hủy
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>

            {sortedSubmissions.length === 0 && (
              <p className="p-8 text-center text-gray-500 text-sm">
                {t('charts.noStudents')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
