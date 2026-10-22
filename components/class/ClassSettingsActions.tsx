'use client'

import { useState } from 'react'
import { Pencil, Ban, Megaphone, Archive, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'
import { useEduStore } from '@/lib/stores/eduStore'
import type { ClassRoom } from '@/lib/types'
import ClassStatusBadge from './ClassStatusBadge'

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
  const [busy, setBusy] = useState<'publish' | 'archive' | 'reopen' | 'cancel' | null>(null)
  const pid = idPrefix
  const status = classroom.status
  const isCancelled = status === 'cancelled'

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

  const runLifecycle = async (action: 'publish' | 'archive' | 'reopen') => {
    const confirmMsg =
      action === 'publish'
        ? `Phát hành lớp "${classroom.title}"? Học sinh có thể tham gia bằng mã lớp.`
        : action === 'archive'
          ? `Lưu trữ lớp "${classroom.title}"? Học sinh không thể tham gia mới.`
          : `Mở lại lớp "${classroom.title}" để học sinh có thể tham gia?`
    if (!window.confirm(confirmMsg)) return
    setBusy(action)
    try {
      await api.edu.setClassLifecycle(classroom.id, action)
      await refresh()
      toast.success(
        action === 'publish' ? 'Đã phát hành lớp' : action === 'archive' ? 'Đã lưu trữ lớp' : 'Đã mở lại lớp'
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể đổi trạng thái')
    } finally {
      setBusy(null)
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
    setBusy('cancel')
    try {
      await api.edu.cancelClass(classroom.id)
      await refresh()
      toast.success('Đã huỷ lớp học')
      router.push('/teacher/dashboard?tab=courses')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể huỷ lớp')
    } finally {
      setBusy(null)
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
      <ClassStatusBadge status={status} />
      {status === 'draft' && (
        <p className="text-sm text-slate-600">
          Lớp đang ở chế độ nháp. Chuẩn bị xong thì phát hành để học sinh tham gia.
        </p>
      )}
      {status === 'archived' && (
        <p className="text-sm text-violet-800">
          Lớp đã lưu trữ. Học sinh đã tham gia vẫn vào được; không ai tự tham gia mới.
        </p>
      )}
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
        {status === 'draft' && (
          <button
            id={`${pid}-publish`}
            type="button"
            onClick={() => void runLifecycle('publish')}
            disabled={busy !== null}
            className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Megaphone className="mr-1.5 h-4 w-4" />
            {busy === 'publish' ? 'Đang phát hành...' : 'Phát hành lớp'}
          </button>
        )}
        {status === 'published' && (
          <button
            id={`${pid}-archive`}
            type="button"
            onClick={() => void runLifecycle('archive')}
            disabled={busy !== null}
            className="inline-flex items-center rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
          >
            <Archive className="mr-1.5 h-4 w-4" />
            {busy === 'archive' ? 'Đang lưu trữ...' : 'Lưu trữ lớp'}
          </button>
        )}
        {status === 'archived' && (
          <button
            id={`${pid}-reopen`}
            type="button"
            onClick={() => void runLifecycle('reopen')}
            disabled={busy !== null}
            className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            {busy === 'reopen' ? 'Đang mở lại...' : 'Mở lại lớp'}
          </button>
        )}
        <button
          id={`${pid}-cancel`}
          type="button"
          onClick={() => void cancelClass()}
          disabled={busy !== null}
          className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Ban className="mr-1.5 h-4 w-4" />
          {busy === 'cancel' ? 'Đang huỷ...' : 'Huỷ lớp học'}
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
