'use client'

import { useState } from 'react'
import { Pencil, Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'
import { useEduStore } from '@/lib/stores/eduStore'
import type { ClassRoom } from '@/lib/types'

interface ClassSettingsActionsProps {
  classroom: ClassRoom
  idPrefix?: string
}

export default function ClassSettingsActions({
  classroom,
  idPrefix = 'class-settings',
}: ClassSettingsActionsProps) {
  const router = useRouter()
  const refresh = useEduStore((s) => s.refresh)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(classroom.title)
  const [description, setDescription] = useState(classroom.description)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const pid = idPrefix

  const isCancelled = classroom.status === 'cancelled'

  const save = async () => {
    setSaving(true)
    try {
      await api.edu.updateClass(classroom.id, { title, description })
      await refresh()
      toast.success('Đã cập nhật lớp học')
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const cancelClass = async () => {
    if (
      !window.confirm(
        `Huỷ lớp "${classroom.title}"? Học sinh sẽ không thể tham gia lớp này nữa.`
      )
    ) {
      return
    }
    setCancelling(true)
    try {
      await api.edu.cancelClass(classroom.id)
      await refresh()
      toast.success('Đã huỷ lớp học')
      router.push('/teacher/dashboard?tab=courses')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể huỷ lớp')
    } finally {
      setCancelling(false)
    }
  }

  if (isCancelled) {
    return (
      <div
        id={pid}
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        Lớp học này đã bị huỷ. Không thể chỉnh sửa hoặc giao bài mới.
      </div>
    )
  }

  return (
    <div id={pid} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          id={`${pid}-edit`}
          type="button"
          onClick={() => {
            setTitle(classroom.title)
            setDescription(classroom.description)
            setEditing((v) => !v)
          }}
          className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Pencil className="mr-1.5 h-4 w-4" />
          {editing ? 'Đóng' : 'Sửa thông tin lớp'}
        </button>
        <button
          id={`${pid}-cancel`}
          type="button"
          onClick={() => void cancelClass()}
          disabled={cancelling}
          className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Ban className="mr-1.5 h-4 w-4" />
          {cancelling ? 'Đang huỷ...' : 'Huỷ lớp học'}
        </button>
      </div>

      {editing && (
        <div id={`${pid}-form`} className="space-y-3 rounded-xl border bg-white p-4">
          <label className="block text-sm">
            <span className="text-gray-700">Tên lớp</span>
            <input
              id={`${pid}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Mô tả</span>
            <textarea
              id={`${pid}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <button
            id={`${pid}-save`}
            type="button"
            onClick={() => void save()}
            disabled={saving || !title.trim()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}
    </div>
  )
}
