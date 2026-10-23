'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, PhoneOff, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import { useContentText } from '@/components/i18n/useContentText'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { formatDateTime } from '@/lib/format'
import { api, ApiError } from '@/lib/api/client'
import { meetingProviderLabel } from '@/lib/meetingUrl'
import type { OnlineSession } from '@/lib/types'
import JitsiMeeting from '@/components/online/JitsiMeeting'
import SessionChat from '@/components/online/SessionChat'
import LessonRecorder from '@/components/online/LessonRecorder'

export default function OnlineClassPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const currentUser = useAuthStore((s) => s.currentUser)!
  const text = useContentText()
  const getClassById = useEduStore((s) => s.getClassById)

  const [onlineSession, setOnlineSession] = useState<OnlineSession | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    try {
      const { session } = await api.edu.getOnlineSession(sessionId)
      setOnlineSession(session)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được buổi học')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadSession()
    const id = setInterval(loadSession, 10000)
    return () => clearInterval(id)
  }, [loadSession])

  const classroom = onlineSession ? getClassById(onlineSession.classId) : undefined
  const isTeacher =
    currentUser.role === 'teacher' && onlineSession?.teacherId === currentUser.id
  const isLive = onlineSession?.status === 'live'
  const isEnded = onlineSession?.status === 'ended'

  const backHref =
    currentUser.role === 'teacher'
      ? `/teacher/courses/${onlineSession?.classId}`
      : `/student/courses/${onlineSession?.classId}`

  const handleStart = async () => {
    if (!onlineSession) return
    try {
      const { session } = await api.edu.updateOnlineSession(
        onlineSession.classId,
        onlineSession.id,
        'start'
      )
      setOnlineSession(session)
      toast.success('Buổi học đã bắt đầu — học sinh nhận thông báo')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể bắt đầu')
    }
  }

  const handleEnd = async () => {
    if (!onlineSession || !confirm('Kết thúc buổi học online?')) return
    try {
      const { session } = await api.edu.updateOnlineSession(
        onlineSession.classId,
        onlineSession.id,
        'end'
      )
      setOnlineSession(session)
      toast.success('Đã kết thúc buổi học')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể kết thúc')
    }
  }

  if (loading) {
    return (
      <div id="online-session-loading" className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        Đang tải phòng học...
      </div>
    )
  }

  if (!onlineSession || !classroom) {
    return (
      <div id="online-session-not-found" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-600">Không tìm thấy buổi học online</p>
        <Link id="online-session-home" href="/" className="text-primary-600 hover:underline">
          Về trang chủ
        </Link>
      </div>
    )
  }

  if (!isTeacher && !isLive && onlineSession.status === 'scheduled') {
    return (
      <div id="online-session-waiting" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <Radio className="h-12 w-12 text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900">{onlineSession.title}</h1>
        <p className="text-gray-500">Giáo viên chưa bắt đầu buổi học. Vui lòng chờ thông báo.</p>
        {onlineSession.meetingUrl && (
          <a
            id="online-session-waiting-meeting"
            href={onlineSession.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Tham gia {meetingProviderLabel(onlineSession.meetingUrl)}
          </a>
        )}
        <Link id="online-session-waiting-back" href={backHref} className="text-primary-600 hover:underline">
          Quay lại lớp
        </Link>
      </div>
    )
  }

  return (
    <div id="online-session" className="flex min-h-screen flex-col bg-gray-100">
      <header id="online-session-header" className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link id="online-session-back" href={backHref} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">{onlineSession.title}</h1>
            <p className="text-xs text-gray-500">
              {text(classroom.title)}
              {isLive && <span className="ml-2 text-green-600">● Đang live</span>}
              {isEnded && <span className="ml-2 text-gray-400">Đã kết thúc</span>}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Tạo: {formatDateTime(onlineSession.createdAt)}
              {onlineSession.scheduledAt ? ` · Giờ tiết: ${formatDateTime(onlineSession.scheduledAt)}` : ''}
              {onlineSession.startedAt
                ? ` · Bắt đầu: ${formatDateTime(onlineSession.startedAt)}`
                : ' · Chưa bắt đầu'}
              {onlineSession.endedAt ? ` · Kết thúc: ${formatDateTime(onlineSession.endedAt)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isTeacher && onlineSession.status === 'scheduled' && (
            <button
              id="online-session-start"
              type="button"
              onClick={handleStart}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Bắt đầu buổi học
            </button>
          )}
          {isTeacher && isLive && (
            <button
              id="online-session-end"
              type="button"
              onClick={handleEnd}
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <PhoneOff className="mr-1.5 h-4 w-4" />
              Kết thúc
            </button>
          )}
        </div>
      </header>

      <main id="online-session-main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:w-[68%]">
          {!isEnded && onlineSession.meetingUrl ? (
            <div
              id="online-session-external"
              className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-lg border bg-white p-8 text-center"
            >
              <p className="text-sm text-gray-600">
                Giáo viên dùng {meetingProviderLabel(onlineSession.meetingUrl)} cho buổi này.
              </p>
              <a
                id="online-session-open-meeting"
                href={onlineSession.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Tham gia {meetingProviderLabel(onlineSession.meetingUrl)}
              </a>
              <p className="break-all text-xs text-gray-400">{onlineSession.meetingUrl}</p>
            </div>
          ) : !isEnded ? (
            <JitsiMeeting
              id="online-session-jitsi"
              roomCode={onlineSession.roomCode}
              displayName={currentUser.fullName}
              isTeacher={isTeacher}
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border bg-gray-200 text-gray-500">
              Buổi học đã kết thúc. Xem bản ghi bài giảng bên dưới hoặc trong trang lớp.
            </div>
          )}
          {isTeacher && isLive && !onlineSession.meetingUrl && (
            <LessonRecorder
              id="online-session-recorder"
              classId={onlineSession.classId}
              sessionId={onlineSession.id}
            />
          )}
        </div>

        <div className="lg:w-[32%]">
          <SessionChat
            id="online-session-chat"
            classId={onlineSession.classId}
            sessionId={onlineSession.id}
            userId={currentUser.id}
            userName={currentUser.fullName}
            disabled={isEnded}
          />
        </div>
      </main>
    </div>
  )
}
