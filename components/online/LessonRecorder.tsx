'use client'

import { useRef, useState } from 'react'
import { Circle, Square, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'
import { formatFileSize } from '@/lib/format'

interface LessonRecorderProps {
  classId: string
  sessionId: string
  disabled?: boolean
}

export default function LessonRecorder({ classId, sessionId, disabled }: LessonRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const stopStreams = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      let combinedStream = displayStream
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const tracks = [...displayStream.getTracks(), ...micStream.getAudioTracks()]
        combinedStream = new MediaStream(tracks)
      } catch {
        /* mic optional */
      }

      streamRef.current = combinedStream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const recorder = new MediaRecorder(combinedStream, { mimeType })
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopStreams()
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size === 0) {
          toast.error('Không có dữ liệu ghi hình')
          return
        }
        await uploadRecording(blob)
      }

      displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorderRef.current?.state === 'recording') {
          recorderRef.current.stop()
        }
      })

      recorder.start(1000)
      setRecording(true)
      startTimeRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
      toast.success('Đang ghi hình màn hình bài giảng')
    } catch {
      toast.error('Không thể ghi hình. Hãy cho phép chia sẻ màn hình.')
      stopStreams()
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  const uploadRecording = async (blob: Blob) => {
    setUploading(true)
    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const form = new FormData()
      form.append('file', blob, `bai-giang-${sessionId}.webm`)
      form.append('title', `Bản ghi ${new Date().toLocaleString('vi-VN')}`)
      form.append('duration', String(duration))
      await api.edu.uploadSessionRecording(classId, sessionId, form)
      toast.success(`Đã lưu bản ghi (${formatFileSize(blob.size)})`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Tải bản ghi lên thất bại')
    } finally {
      setUploading(false)
      setElapsed(0)
    }
  }

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="font-semibold text-gray-900">Ghi hình bài giảng</h3>
      <p className="mt-1 text-xs text-gray-500">
        Ghi lại màn hình + giọng giảng. File được lưu để học sinh xem lại sau buổi học.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!recording ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={startRecording}
            className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Circle className="mr-1.5 h-4 w-4 fill-current" />
            Bắt đầu ghi
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            <Square className="mr-1.5 h-4 w-4 fill-current" />
            Dừng ghi ({formatElapsed(elapsed)})
          </button>
        )}
        {uploading && (
          <span className="inline-flex items-center text-sm text-gray-500">
            <Upload className="mr-1 h-4 w-4 animate-pulse" />
            Đang tải lên...
          </span>
        )}
      </div>
    </div>
  )
}
