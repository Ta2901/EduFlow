'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Radio, Video, Plus, Film } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'
import type { OnlineSession, SessionRecording } from '@/lib/types'
import { formatDateTime, formatFileSize } from '@/lib/format'

interface OnlineSessionPanelProps {
  classId: string
  isTeacher: boolean
  id?: string
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Chưa bắt đầu',
  live: 'Đang diễn ra',
  ended: 'Đã kết thúc',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  live: 'bg-green-100 text-green-800 animate-pulse',
  ended: 'bg-slate-100 text-slate-600',
}

export default function OnlineSessionPanel({
  classId,
  isTeacher,
  id = 'online-sessions',
}: OnlineSessionPanelProps) {
  const [sessions, setSessions] = useState<OnlineSession[]>([])
  const [recordings, setRecordings] = useState<(SessionRecording & { sessionTitle: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.edu.listOnlineSessions(classId)
      setSessions(data.sessions)
      setRecordings(data.recordings)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    try {
      const { session } = await api.edu.createOnlineSession(classId, { title: title.trim() })
      toast.success('Đã tạo buổi học online')
      setTitle('')
      await load()
      window.location.href = `/online/${session.id}`
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Tạo buổi học thất bại')
    } finally {
      setCreating(false)
    }
  }

  const handleStart = async (sessionId: string) => {
    try {
      await api.edu.updateOnlineSession(classId, sessionId, 'start')
      toast.success('Đã bắt đầu buổi học — học sinh được thông báo')
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể bắt đầu')
    }
  }

  const liveSession = sessions.find((s) => s.status === 'live')

  if (loading) {
    return (
      <p id={id} className="py-6 text-center text-sm text-gray-500">
        Đang tải...
      </p>
    )
  }

  return (
    <div id={id} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Lớp học online</h3>
        <p className="text-sm text-gray-500">
          Video call, chia sẻ màn hình, chat và ghi hình bài giảng trong từng buổi học.
        </p>
      </div>

      {!isTeacher && liveSession && (
        <div
          id={`${id}-live-banner`}
          className="rounded-xl border-2 border-green-400 bg-green-50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Đang có buổi học trực tuyến</p>
                <p className="text-sm text-green-700">{liveSession.title}</p>
              </div>
            </div>
            <Link
              id={`${id}-join-live`}
              href={`/online/${liveSession.id}`}
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Video className="mr-1.5 h-4 w-4" />
              Vào lớp ngay
            </Link>
          </div>
        </div>
      )}

      {isTeacher && (
        <form
          id={`${id}-create-form`}
          onSubmit={handleCreate}
          className="rounded-lg border bg-primary-50/40 p-4"
        >
          <p className="mb-2 text-sm font-medium text-gray-900">Tạo buổi học online mới</p>
          <div className="flex flex-wrap gap-2">
            <input
              id={`${id}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Tiết 3 — Phương trình bậc hai"
              className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm"
              required
            />
            <button
              id={`${id}-create-submit`}
              type="submit"
              disabled={creating}
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tạo & vào phòng
            </button>
          </div>
        </form>
      )}

      <div id={`${id}-list`}>
        <h4 className="mb-2 font-medium text-gray-900">Danh sách buổi học</h4>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-gray-500">
            {isTeacher ? 'Chưa có buổi học online.' : 'Giáo viên chưa mở buổi học online.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                id={`${id}-item-${s.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500">
                    {s.startedAt ? `Bắt đầu: ${formatDateTime(s.startedAt)}` : `Tạo: ${formatDateTime(s.createdAt)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                  {isTeacher && s.status === 'scheduled' && (
                    <button
                      id={`${id}-start-${s.id}`}
                      type="button"
                      onClick={() => handleStart(s.id)}
                      className="inline-flex items-center rounded-lg border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Bắt đầu
                    </button>
                  )}
                  <Link
                    id={`${id}-enter-${s.id}`}
                    href={`/online/${s.id}`}
                    className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    <Video className="mr-1 h-3.5 w-3.5" />
                    {s.status === 'ended' ? 'Xem lại' : 'Vào phòng'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recordings.length > 0 && (
        <div id={`${id}-recordings`}>
          <h4 className="mb-2 flex items-center font-medium text-gray-900">
            <Film className="mr-1.5 h-4 w-4" />
            Bản ghi bài giảng
          </h4>
          <ul className="space-y-2">
            {recordings.map((r) => (
              <li
                key={r.id}
                id={`${id}-recording-${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-violet-50/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.sessionTitle} · {formatFileSize(r.fileSize)}
                    {r.duration ? ` · ${Math.floor(r.duration / 60)} phút` : ''}
                  </p>
                </div>
                <a
                  id={`${id}-recording-${r.id}-link`}
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-violet-700 hover:underline"
                >
                  Xem / Tải về
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
