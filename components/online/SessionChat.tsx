'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { api, ApiError } from '@/lib/api/client'
import type { SessionMessage } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

interface SessionChatProps {
  classId: string
  sessionId: string
  userId: string
  userName: string
  disabled?: boolean
}

export default function SessionChat({
  classId,
  sessionId,
  userId,
  userName,
  disabled,
}: SessionChatProps) {
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    try {
      const { messages: data } = await api.edu.listSessionMessages(classId, sessionId)
      setMessages(data)
    } catch {
      /* ignore poll errors */
    }
  }, [classId, sessionId])

  useEffect(() => {
    loadMessages()
    const id = setInterval(loadMessages, 2500)
    return () => clearInterval(id)
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    setSending(true)
    try {
      await api.edu.postSessionMessage(classId, sessionId, {
        content: text.trim(),
        userName,
      })
      setText('')
      await loadMessages()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gửi tin nhắn thất bại')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold text-gray-900">Trao đổi trong lớp</h3>
        <p className="text-xs text-gray-500">Tin nhắn được lưu trong buổi học</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">Chưa có tin nhắn. Hãy chào lớp!</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.userId === userId
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    mine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[10px] font-medium opacity-80">
                      {msg.userName}
                      {msg.role === 'teacher' ? ' (GV)' : ''}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-primary-100' : 'text-gray-400'}`}>
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t p-3">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled || sending}
            placeholder={disabled ? 'Buổi học đã kết thúc' : 'Nhập tin nhắn...'}
            className="flex-1 rounded-lg border px-3 py-2 text-sm disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={disabled || sending || !text.trim()}
            className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
