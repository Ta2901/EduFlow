'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Radio, Video, Plus, Film, ExternalLink, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { api, ApiError } from '@/lib/api/client'
import type { OnlineSession, SessionRecording } from '@/lib/types'
import { formatDateTime, formatFileSize, toDatetimeLocalValue } from '@/lib/format'
import { meetingProviderLabel } from '@/lib/meetingUrl'

interface OnlineSessionPanelProps {
  classId: string
  isTeacher: boolean
  id?: string
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
  const { t, locale } = useI18n()
  const statusLabel = (status: string) =>
    status === 'live' ? t('student.uiStatusLive') : status === 'ended' ? t('student.uiStatusEnded') : t('student.uiScheduled')
  const [sessions, setSessions] = useState<OnlineSession[]>([])
  const [recordings, setRecordings] = useState<(SessionRecording & { sessionTitle: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMeetingUrl, setEditMeetingUrl] = useState('')
  const [editScheduledAt, setEditScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.edu.listOnlineSessions(classId)
      setSessions(data.sessions)
      setRecordings(data.recordings)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('student.uiOnlineLoadFail'))
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
      await api.edu.createOnlineSession(classId, {
        title: title.trim(),
        meetingUrl: meetingUrl.trim() || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      })
      toast.success(t('student.uiOnlineCreated'))
      setTitle('')
      setMeetingUrl('')
      setScheduledAt('')
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('student.uiOnlineCreateFail'))
    } finally {
      setCreating(false)
    }
  }

  const handleStart = async (sessionId: string) => {
    try {
      await api.edu.updateOnlineSession(classId, sessionId, 'start')
      toast.success(t('student.uiOnlineStarted'))
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('student.uiOnlineStartFail'))
    }
  }

  const openEdit = (s: OnlineSession) => {
    setEditingId(s.id)
    setEditTitle(s.title)
    setEditMeetingUrl(s.meetingUrl ?? '')
    setEditScheduledAt(toDatetimeLocalValue(s.scheduledAt))
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !editTitle.trim()) return
    setSaving(true)
    try {
      await api.edu.updateOnlineSessionDetails(classId, editingId, {
        title: editTitle.trim(),
        meetingUrl: editMeetingUrl,
        scheduledAt: editScheduledAt ? new Date(editScheduledAt).toISOString() : '',
      })
      toast.success(t('student.uiSessionUpdated'))
      setEditingId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('student.uiSessionUpdateFail'))
    } finally {
      setSaving(false)
    }
  }

  const liveSession = sessions.find((s) => s.status === 'live')

  if (loading) {
    return (
      <p id={id} className="py-6 text-center text-sm text-gray-500">
        {t('student.uiOnlineLoading')}
      </p>
    )
  }

  return (
    <div id={id} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{t('student.uiOnlineTitle')}</h3>
        <p className="text-sm text-gray-500">
          {t('student.uiOnlineBody')}
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
                <p className="font-semibold text-green-900">{t('student.uiOnlineLive')}</p>
                <p className="text-sm text-green-700">{liveSession.title}</p>
              </div>
            </div>
            {liveSession.meetingUrl ? (
              <a
                id={`${id}-join-live`}
                href={liveSession.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                {t('student.uiJoinMeeting', { provider: meetingProviderLabel(liveSession.meetingUrl) })}
              </a>
            ) : (
              <Link
                id={`${id}-join-live`}
                href={`/online/${liveSession.id}`}
                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Video className="mr-1.5 h-4 w-4" />
                {t('student.uiJoinLive')}
              </Link>
            )}
          </div>
        </div>
      )}

      {isTeacher && (
        <form
          id={`${id}-create-form`}
          onSubmit={handleCreate}
          className="rounded-lg border bg-primary-50/40 p-4"
        >
          <p className="mb-2 text-sm font-medium text-gray-900">{t('student.uiNewOnline')}</p>
          <div className="space-y-2">
            <input
              id={`${id}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('student.uiOnlinePlaceholder')}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">{t('student.uiMeetingLink')}</span>
              <input
                id={`${id}-meeting-url`}
                type="text"
                inputMode="url"
                autoComplete="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder={t('student.uiMeetingLinkPh')}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">{t('student.uiScheduledStart')}</span>
              <input
                id={`${id}-scheduled-at`}
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <p className="text-xs text-gray-500">{t('student.uiMeetingLinkHint')}</p>
            <button
              id={`${id}-create-submit`}
              type="submit"
              disabled={creating}
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('student.uiCreateEnter')}
            </button>
          </div>
        </form>
      )}

      <div id={`${id}-list`}>
        <h4 className="mb-2 font-medium text-gray-900">{t('student.uiSessionList')}</h4>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-gray-500">
            {isTeacher ? t('student.uiOnlineEmptyTeacher') : t('student.uiOnlineEmptyStudent')}
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                id={`${id}-item-${s.id}`}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                    <li>{t('student.uiCreatedAt', { time: formatDateTime(s.createdAt, locale) })}</li>
                    {s.scheduledAt && (
                      <li>{t('student.uiScheduledAt', { time: formatDateTime(s.scheduledAt, locale) })}</li>
                    )}
                    <li>
                      {s.startedAt
                        ? t('student.uiStartedAt', { time: formatDateTime(s.startedAt, locale) })
                        : t('student.uiStartedAt', { time: t('student.uiNotStartedYet') })}
                    </li>
                    {s.endedAt && (
                      <li>{t('student.uiEndedAt', { time: formatDateTime(s.endedAt, locale) })}</li>
                    )}
                    {s.meetingUrl && <li>{meetingProviderLabel(s.meetingUrl)}</li>}
                  </ul>
                  {isTeacher && editingId === s.id && (
                    <form
                      id={`${id}-edit-form-${s.id}`}
                      onSubmit={(e) => void handleSaveEdit(e)}
                      className="mt-3 space-y-2 rounded-lg border bg-slate-50 p-3"
                    >
                      <input
                        id={`${id}-edit-title-${s.id}`}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        required
                      />
                      <input
                        id={`${id}-edit-meeting-${s.id}`}
                        value={editMeetingUrl}
                        onChange={(e) => setEditMeetingUrl(e.target.value)}
                        placeholder={t('student.uiMeetingLinkPh')}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                      <label className="block">
                        <span className="mb-1 block text-xs text-gray-600">{t('student.uiScheduledStart')}</span>
                        <input
                          id={`${id}-edit-scheduled-${s.id}`}
                          type="datetime-local"
                          value={editScheduledAt}
                          onChange={(e) => setEditScheduledAt(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          id={`${id}-edit-save-${s.id}`}
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {t('student.uiSaveChanges')}
                        </button>
                        <button
                          id={`${id}-edit-cancel-${s.id}`}
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700"
                        >
                          {t('student.uiClose')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                    {statusLabel(s.status)}
                  </span>
                  {isTeacher && (
                    <button
                      id={`${id}-edit-${s.id}`}
                      type="button"
                      onClick={() => (editingId === s.id ? setEditingId(null) : openEdit(s))}
                      className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      {t('student.uiEditSession')}
                    </button>
                  )}
                  {isTeacher && s.status === 'scheduled' && (
                    <button
                      id={`${id}-start-${s.id}`}
                      type="button"
                      onClick={() => handleStart(s.id)}
                      className="inline-flex items-center rounded-lg border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {t('student.uiStart')}
                    </button>
                  )}
                  {s.meetingUrl && s.status !== 'ended' && (
                    <a
                      id={`${id}-open-meeting-${s.id}`}
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      {t('student.uiOpenMeeting', { provider: meetingProviderLabel(s.meetingUrl) })}
                    </a>
                  )}
                  <Link
                    id={`${id}-enter-${s.id}`}
                    href={`/online/${s.id}`}
                    className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    <Video className="mr-1 h-3.5 w-3.5" />
                    {s.status === 'ended' ? t('student.uiReview') : t('student.uiEnterRoom')}
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
            {t('student.uiRecordings')}
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
                    {r.duration ? ` · ${t('student.uiMinutes', { count: Math.floor(r.duration / 60) })}` : ''}
                  </p>
                </div>
                <a
                  id={`${id}-recording-${r.id}-link`}
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-violet-700 hover:underline"
                >
                  {t('student.uiWatch')}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
