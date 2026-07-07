'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle,
  Paperclip,
  FileText,
  Upload,
  X,
  MessageSquare,
  Award,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  SUBMISSION_STATUS_COLORS,
  SUBMISSION_STATUS_LABELS,
} from '@/lib/format'
export default function StudentAssignmentPage() {
  const params = useParams()
  const taskId = params.id as string
  const currentUser = useAuthStore((s) => s.currentUser)!
  const getTaskById = useEduStore((s) => s.getTaskById)
  const getClassById = useEduStore((s) => s.getClassById)
  const getStudentSubmission = useEduStore((s) => s.getStudentSubmission)
  const submitWork = useEduStore((s) => s.submitWork)

  const task = getTaskById(taskId)
  const classroom = task ? getClassById(task.classId) : undefined
  const submission = getStudentSubmission(taskId, currentUser.id)

  const [content, setContent] = useState(submission?.content ?? '')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy bài tập</p>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-gray-600 text-center">Bạn chưa tham gia lớp học này.</p>
        <Link href="/student/join" className="text-primary-600 font-medium">
          Tham gia lớp bằng mã
        </Link>
      </div>
    )
  }

  const isSubmitted = submission.status === 'submitted' || submission.status === 'late'
  const canSubmit = !isSubmitted

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected) return
    setPendingFiles((prev) => [...prev, ...Array.from(selected)])
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const result = await submitWork({ taskId, content, files: pendingFiles })
    setIsLoading(false)

    if (!result.ok) {
      toast.error(result.error || 'Nộp bài thất bại')
      return
    }
    toast.success('Nộp bài thành công!')
    setPendingFiles([])
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader
        userId={currentUser.id}
        title={task.title}
        subtitle={classroom?.title}
        backHref={classroom ? `/student/courses/${classroom.id}` : '/student/dashboard'}
        action={
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SUBMISSION_STATUS_COLORS[submission.status]}`}>
            {SUBMISSION_STATUS_LABELS[submission.status]}
          </span>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        {/* F-05: Assignment details */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Chi tiết bài tập</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{task.description || '—'}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Hạn nộp: <strong>{formatDate(task.dueDate)}</strong>
          </div>
          {task.attachments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Paperclip className="h-4 w-4" /> Tệp từ giáo viên
              </p>
              <ul className="space-y-1">
                {task.attachments.map((att) => (
                  <li key={att.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2">
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

        {/* F-06: Submission status */}
        {isSubmitted && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Trạng thái nộp bài
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Trạng thái</dt>
                <dd>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${SUBMISSION_STATUS_COLORS[submission.status]}`}>
                    {SUBMISSION_STATUS_LABELS[submission.status]}
                  </span>
                </dd>
              </div>
              {submission.submittedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Thời gian nộp</dt>
                  <dd className="text-gray-900">{formatDateTime(submission.submittedAt)}</dd>
                </div>
              )}
            </dl>
            {submission.content && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Nội dung đã nộp</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.content}</p>
              </div>
            )}
            {submission.submittedFiles && submission.submittedFiles.length > 0 && (
              <ul className="mt-3 space-y-1">
                {submission.submittedFiles.map((f) => (
                  <li key={f.id} className="text-sm text-gray-600 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
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
            )}
          </div>
        )}

        {/* F-07: Feedback & grades */}
        {submission.grade != null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6"
          >
            <h2 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Điểm & nhận xét từ giáo viên
            </h2>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-green-700">{submission.grade}</span>
              <span className="text-lg text-green-600">/ {submission.maxGrade ?? 10}</span>
            </div>
            {submission.feedback && (
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Nhận xét
                </p>
                <p className="text-gray-800 whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            )}
            {submission.gradedAt && (
              <p className="text-xs text-green-700 mt-3">Chấm lúc: {formatDateTime(submission.gradedAt)}</p>
            )}
          </motion.div>
        )}

        {isSubmitted && submission.grade == null && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            Bài đã nộp. Giáo viên chưa chấm điểm — bạn sẽ nhận thông báo khi có kết quả.
          </div>
        )}

        {/* Submit form */}
        {canSubmit && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Nộp bài tập</h2>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung bài làm
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Mô tả bài làm hoặc dán link Google Drive..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tệp đính kèm</label>
              <label className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Chọn tệp nộp bài</span>
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
              {pendingFiles.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {pendingFiles.map((f, index) => (
                    <li key={`${f.name}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                      <span>{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setPendingFiles((p) => p.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </form>
        )}

        <Link href="/student/submissions" className="block text-center text-sm text-primary-600 hover:underline">
          Xem tất cả trạng thái nộp bài
        </Link>
      </div>
    </div>
  )
}
