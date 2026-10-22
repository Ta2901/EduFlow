'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'

export default function CreateClassPage() {
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.currentUser)!
  const { t } = useI18n()
  const createClass = useEduStore((s) => s.createClass)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên lớp')
      return
    }

    setIsLoading(true)
    try {
      const newClass = await createClass({ title, description })
      setCreatedCode(newClass.classCode)
      toast.success('Tạo lớp học thành công!')
    } catch {
      toast.error('Tạo lớp thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const copyCode = async () => {
    if (!createdCode) return
    await navigator.clipboard.writeText(createdCode)
    setCopied(true)
    toast.success(t('common.copiedCode', { code: createdCode }))
    setTimeout(() => setCopied(false), 2000)
  }

  if (createdCode) {
    return (
      <div id="teacher-class-created" className="min-h-screen bg-gray-50 text-gray-900">
        <PageHeader id="teacher-class-created-header" userId={currentUser.id} title={t('admin.classCreated')} backHref="/teacher/dashboard" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl p-4 sm:p-6"
        >
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo lớp thành công!</h2>
            <p className="text-gray-600 mb-6">
              Chia sẻ mã lớp bên dưới để học sinh tham gia
            </p>

            <div className="bg-primary-50 border-2 border-dashed border-primary-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-primary-700 mb-2 font-medium">{t('common.classCode')}</p>
              <p className="text-4xl font-bold tracking-widest text-primary-600 font-mono">
                {createdCode}
              </p>
              <button
                id="teacher-class-created-copy"
                onClick={copyCode}
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> {t('common.copy')}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" /> {t('common.copy')}
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                id="teacher-class-created-home"
                onClick={() => router.push('/teacher/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Về trang chủ
              </button>
              <button
                id="teacher-class-created-another"
                onClick={() => {
                  setCreatedCode(null)
                  setTitle('')
                  setDescription('')
                }}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Tạo lớp khác
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div id="teacher-class-new" className="min-h-screen bg-gray-50 text-gray-900">
      <PageHeader id="teacher-class-new-header" userId={currentUser.id} title={t('common.createClass')} backHref="/teacher/dashboard" />
      <motion.form
        id="teacher-class-new-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl p-4 sm:p-6"
      >
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <BookOpen className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Sau khi tạo, hệ thống sẽ tự động sinh <strong>mã lớp duy nhất</strong> (6 ký tự) để học sinh tham gia.
            </p>
          </div>

          <div>
            <label htmlFor="teacher-class-new-title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.className')} <span className="text-red-500">*</span>
            </label>
            <input
              id="teacher-class-new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="VD: Toán học lớp 10A1"
            />
          </div>

          <div>
            <label htmlFor="teacher-class-new-description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.description')}
            </label>
            <textarea
              id="teacher-class-new-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Mô tả ngắn về lớp học..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              id="teacher-class-new-cancel"
              href="/teacher/dashboard"
              className="flex-1 text-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              id="teacher-class-new-submit"
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang tạo...' : 'Tạo lớp & sinh mã'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  )
}
