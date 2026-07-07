'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, PhoneOff, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEduStore } from '@/lib/stores/eduStore'
import { api, ApiError } from '@/lib/api/client'
import type { OnlineSession } from '@/lib/types'
import JitsiMeeting from '@/components/online/JitsiMeeting'
import SessionChat from '@/components/online/SessionChat'
import LessonRecorder from '@/components/online/LessonRecorder'

export default function OnlineClassPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const currentUser = useAuthStore((s) => s.currentUser)!
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
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        Đang tải phòng học...
      </div>
    )
  }

  if (!onlineSession || !classroom) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-600">Không tìm thấy buổi học online</p>
        <Link href="/" className="text-primary-600 hover:underline">
          Về trang chủ
        </Link>
      </div>
    )
  }

  if (!isTeacher && !isLive && onlineSession.status === 'scheduled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <Radio className="h-12 w-12 text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900">{onlineSession.title}</h1>
        <p className="text-gray-500">Giáo viên chưa bắt đầu buổi học. Vui lòng chờ thông báo.</p>
        <Link href={backHref} className="text-primary-600 hover:underline">
          Quay lại lớp
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">{onlineSession.title}</h1>
            <p className="text-xs text-gray-500">
              {classroom.title}
              {isLive && <span className="ml-2 text-green-600">● Đang live</span>}
              {isEnded && <span className="ml-2 text-gray-400">Đã kết thúc</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isTeacher && onlineSession.status === 'scheduled' && (
            <button
              type="button"
              onClick={handleStart}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Bắt đầu buổi học
            </button>
          )}
          {isTeacher && isLive && (
            <button
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

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:w-[68%]">
          {!isEnded ? (
            <JitsiMeeting
              roomCode={onlineSession.roomCode}
              displayName={currentUser.fullName}
              isTeacher={isTeacher}
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border bg-gray-200 text-gray-500">
              Buổi học đã kết thúc. Xem bản ghi bài giảng bên dưới hoặc trong trang lớp.
            </div>
          )}
          {isTeacher && isLive && (
            <LessonRecorder
              classId={onlineSession.classId}
              sessionId={onlineSession.id}
            />
          )}
        </div>

        <div className="lg:w-[32%]">
          <SessionChat
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
