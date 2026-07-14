'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'

interface CourseEvalManagePanelProps {
  classId: string
  id?: string
}

export default function CourseEvalManagePanel({
  classId,
  id = 'course-eval-manage',
}: CourseEvalManagePanelProps) {
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState(0)
  const [evaluations, setEvaluations] = useState<
    Awaited<ReturnType<typeof api.edu.listCourseEvals>>['evaluations']
  >([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.edu.listCourseEvals(classId)
      setEnrollments(data.enrollments)
      setEvaluations(data.evaluations)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được đánh giá khoá')
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    void load()
  }, [load])

  const setStatus = async (kind: 'midterm' | 'final', status: 'open' | 'closed' | 'draft') => {
    try {
      await api.edu.setCourseEvalStatus(classId, { kind, status })
      toast.success(
        status === 'open'
          ? 'Đã mở đánh giá — học sinh sẽ nhận thông báo'
          : status === 'closed'
            ? 'Đã đóng đánh giá'
            : 'Đã đặt lại bản nháp'
      )
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Thao tác thất bại')
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải đánh giá định kỳ…</p>
  }

  return (
    <div id={id} className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Đánh giá định kỳ (2 lần / khoá)</h3>
        <p className="mt-1 text-sm text-gray-500">
          Mở giữa kỳ và cuối kỳ để học sinh đánh giá — mỗi đợt mỗi HS một lần
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {evaluations.map((ev) => (
          <div key={ev.id} className="rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-gray-900">
                {ev.kind === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  ev.status === 'open'
                    ? 'bg-green-100 text-green-800'
                    : ev.status === 'closed'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                {ev.status === 'open' ? 'Đang mở' : ev.status === 'closed' ? 'Đã đóng' : 'Nháp'}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Phản hồi: {ev.responseCount}/{enrollments}
              {ev.averageTeachingQuality != null && ev.responseCount > 0
                ? ` · TB giảng dạy ${ev.averageTeachingQuality}/5`
                : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ev.status !== 'open' && (
                <button
                  type="button"
                  onClick={() => void setStatus(ev.kind, 'open')}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white"
                >
                  Mở đánh giá
                </button>
              )}
              {ev.status === 'open' && (
                <button
                  type="button"
                  onClick={() => void setStatus(ev.kind, 'closed')}
                  className="rounded-md border px-3 py-1.5 text-xs"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
