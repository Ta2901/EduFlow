'use client'

import { useCallback, useEffect, useState } from 'react'
import { MessageCircle, Send, Users } from 'lucide-react'
import { api, ApiError } from '@/lib/api/client'
import type { ClassChatMessage, ClassChatRoom } from '@/lib/types'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { formatDateTime } from '@/lib/format'

interface ClassChatPanelProps {
  userId: string
  id?: string
}

export default function ClassChatPanel({ userId, id = 'class-chat' }: ClassChatPanelProps) {
  const { t, locale } = useI18n()
  const [chats, setChats] = useState<ClassChatRoom[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<ClassChatRoom | null>(null)
  const [messages, setMessages] = useState<ClassChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadChats = useCallback(async () => {
    try {
      const { chats: data } = await api.edu.listClassChats()
      setChats(data)
      setError('')
      setSelectedClassId((prev) => {
        if (prev && data.some((c) => c.classId === prev)) return prev
        return data[0]?.classId ?? null
      })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('chat.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadRoom = useCallback(async (classId: string) => {
    try {
      const { chat, messages: data } = await api.edu.getClassChat(classId)
      setActiveChat(chat)
      setMessages(data)
    } catch {
      /* ignore poll errors */
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  useEffect(() => {
    if (!selectedClassId) {
      setActiveChat(null)
      setMessages([])
      return
    }
    loadRoom(selectedClassId)
    const id = setInterval(() => loadRoom(selectedClassId), 8000)
    return () => clearInterval(id)
  }, [selectedClassId, loadRoom])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId || !text.trim()) return
    setSending(true)
    try {
      await api.edu.postClassChatMessage(selectedClassId, { content: text.trim() })
      setText('')
      await loadRoom(selectedClassId)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : t('chat.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div id={id} className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
        {t('chat.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div id={id} className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div id={id} className="rounded-xl border bg-white p-8 text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-600">
          {t('chat.empty')}
        </p>
      </div>
    )
  }

  return (
    <div id={id} className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside id={`${id}-rooms`} className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{t('chat.rooms')}</h3>
          <p className="text-xs text-gray-500">{t('chat.roomsHint')}</p>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          {chats.map((chat) => {
            const active = chat.classId === selectedClassId
            return (
              <button
                key={chat.id}
                id={`${id}-room-${chat.classId}`}
                type="button"
                onClick={() => setSelectedClassId(chat.classId)}
                className={`flex w-full flex-col border-b px-4 py-3 text-left transition-colors ${
                  active ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`truncate text-sm font-medium ${active ? 'text-primary-700' : 'text-gray-900'}`}>
                  {chat.name}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <Users className="h-3 w-3" />
                  {t('chat.members', { count: chat.memberCount })}
                  {chat.messageCount > 0 ? ` · ${t('chat.messages', { count: chat.messageCount })}` : ''}
                </span>
                <span className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                  ID: {chat.id}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section id={`${id}-panel`} className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border bg-white">
        {activeChat ? (
          <>
            <div className="border-b px-4 py-3">
              <h3 className="font-semibold text-gray-900">{activeChat.name}</h3>
              <p className="text-xs text-gray-500">
                {t('chat.teacherPrefix')}: {activeChat.teacherName} · Chat ID: <span className="font-mono">{activeChat.id}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeChat.members.slice(0, 8).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700"
                    title={`User ID: ${m.id}`}
                  >
                    {m.role === 'teacher' ? t('role.shortTeacher') : t('role.shortStudent')} {m.name}
                    {m.memberCode ? ` (${m.memberCode})` : ''}
                  </span>
                ))}
                {activeChat.members.length > 8 && (
                  <span className="text-[10px] text-gray-400">+{activeChat.members.length - 8}</span>
                )}
              </div>
            </div>

            <div id={`${id}-messages`} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400">{t('chat.noMessages')}</p>
              ) : (
                messages.map((msg) => {
                  const mine = msg.userId === userId
                  return (
                    <div
                      key={msg.id}
                      id={`${id}-message-${msg.id}`}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          mine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[10px] font-medium opacity-80">
                            {msg.userName}
                            {msg.role === 'teacher' ? ` (${t('role.shortTeacher')})` : ''}
                            {msg.memberCode ? ` · ${msg.memberCode}` : ''}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-primary-100' : 'text-gray-400'}`}>
                          {formatDateTime(msg.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form id={`${id}-form`} onSubmit={handleSend} className="border-t p-3">
              <div className="flex gap-2">
                <input
                  id={`${id}-input`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={sending}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm disabled:bg-gray-50"
                  maxLength={2000}
                />
                <button
                  id={`${id}-send`}
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            {t('chat.pickRoom')}
          </div>
        )}
      </section>
    </div>
  )
}
