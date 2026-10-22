'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Paperclip, X, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText } from '@/components/i18n/useContentText'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatFileSize } from '@/lib/format'

export default function CreateAssignmentPage() {
  const params = useParams()
  const classId = params.classId as string
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.currentUser)!
  const { t } = useI18n()
  const text = useContentText()
  const classroom = useEduStore((s) => s.classes.find((c) => c.id === classId))
  const createTask = useEduStore((s) => s.createTask)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)

  if (!classroom) {
    return (
      <div id="teacher-assignment-new-not-found" className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('common.notFound')}</p>
      </div>
    )
  }

  if (classroom.status === 'cancelled') {
    return (
      <div id="teacher-assignment-new-cancelled" className="flex min-h-screen items-center justify-center p-6">
        <p className="text-center text-amber-800">{t('student.uiCancelledNote')}</p>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setSelectedFiles((prev) => [...prev, ...Array.from(files)])
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài tập')
      return
    }
    if (!dueDate) {
      toast.error('Vui lòng chọn hạn nộp')
      return
    }

    setIsLoading(true)
    try {
      const task = await createTask({
        classId,
        title,
        description,
        dueDate,
        attachments: [],
        files: selectedFiles,
      })
      toast.success('Giao bài tập thành công!')
      router.push(`/teacher/assignments/${task.id}/submissions`)
    } catch {
      toast.error('Giao bài tập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div id="teacher-assignment-new" className="min-h-screen bg-gray-50">
      <div id="teacher-assignment-new-header" className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link
            id="teacher-assignment-new-back"
            href={`/teacher/courses/${classId}`}
            className="p-2 text-gray-600 hover:text-gray-900 mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Giao bài tập mới</h1>
            <p className="text-sm text-gray-500">{text(classroom.title)}</p>
          </div>
        </div>
      </div>

      <motion.form
        id="teacher-assignment-new-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-6"
      >
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div>
            <label htmlFor="teacher-assignment-new-title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.assignment')} <span className="text-red-500">*</span>
            </label>
            <input
              id="teacher-assignment-new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="VD: Bài tập chương 2"
            />
          </div>

          <div>
            <label htmlFor="teacher-assignment-new-description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.description')}
            </label>
            <textarea
              id="teacher-assignment-new-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Hướng dẫn chi tiết, yêu cầu nộp bài..."
            />
          </div>

          <div>
            <label htmlFor="teacher-assignment-new-due-date" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.due')} <span className="text-red-500">*</span>
            </label>
            <input
              id="teacher-assignment-new-due-date"
              type="date"
              value={dueDate}
              min={minDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.attachments', { count: selectedFiles.length })}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Nhấn để chọn tệp (PDF, DOC, ảnh...)</span>
              <input
                id="teacher-assignment-new-files"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx"
              />
            </label>

            {selectedFiles.length > 0 && (
              <ul className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center min-w-0">
                      <FileText className="h-5 w-5 text-primary-600 flex-shrink-0 mr-2" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      id={`teacher-assignment-new-remove-file-${index}`}
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              id="teacher-assignment-new-cancel"
              href={`/teacher/courses/${classId}`}
              className="flex-1 text-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              id="teacher-assignment-new-submit"
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang giao...' : 'Giao bài tập'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  )
}
