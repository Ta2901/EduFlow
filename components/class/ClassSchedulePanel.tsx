'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, MapPin, Plus, Trash2, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { useContentText } from '@/components/i18n/useContentText'
import { api, ApiError } from '@/lib/api/client'
import type { AttendanceStatus, ClassStudent, ScheduleSlot } from '@/lib/types'
import {
  ATTENDANCE_STATUS_COLORS,
  toSchoolDayOfWeek,
  todayDateInputValue,
} from '@/lib/format'

interface ClassSchedulePanelProps {
  classId: string
  students: ClassStudent[]
  isTeacher: boolean
  currentStudentId?: string
  id?: string
}

const PERIOD_PRESETS = [
  { period: 1, startTime: '07:00', endTime: '07:45' },
  { period: 2, startTime: '07:50', endTime: '08:35' },
  { period: 3, startTime: '08:40', endTime: '09:25' },
  { period: 4, startTime: '09:30', endTime: '10:15' },
  { period: 5, startTime: '10:20', endTime: '11:05' },
]

export default function ClassSchedulePanel({
  classId,
  students,
  isTeacher,
  currentStudentId,
  id = 'class-schedule',
}: ClassSchedulePanelProps) {
  const { t } = useI18n()
  const text = useContentText()
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [sessionDate, setSessionDate] = useState(todayDateInputValue())
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const [form, setForm] = useState({
    dayOfWeek: toSchoolDayOfWeek(new Date()),
    period: 1,
    subject: '',
    startTime: '07:00',
    endTime: '07:45',
    room: '',
  })

  const [studentHistory, setStudentHistory] = useState<
    {
      id: string
      sessionDate: string
      status: AttendanceStatus
      period: number
      subject: string
      dayOfWeek: number
      startTime: string
      endTime: string
    }[]
  >([])

  const loadSlots = useCallback(async () => {
    setLoading(true)
    try {
      const { slots: data } = await api.edu.listSchedule(classId)
      setSlots(data)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('charts.loadStatsFailed'))
    } finally {
      setLoading(false)
    }
  }, [classId, t])

  const loadAttendance = useCallback(
    async (slotId: string, date: string) => {
      try {
        const { records } = await api.edu.getAttendance(classId, slotId, date)
        const map: Record<string, AttendanceStatus> = {}
        for (const r of records) map[r.studentId] = r.status
        setAttendanceMap(map)
      } catch {
        setAttendanceMap({})
      }
    },
    [classId]
  )

  const loadStudentHistory = useCallback(async () => {
    if (!currentStudentId) return
    try {
      const { history } = await api.edu.getAttendanceHistory(classId)
      setStudentHistory(history)
    } catch {
      setStudentHistory([])
    }
  }, [classId, currentStudentId])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  useEffect(() => {
    if (!isTeacher && currentStudentId) loadStudentHistory()
  }, [isTeacher, currentStudentId, loadStudentHistory])

  useEffect(() => {
    if (selectedSlotId) loadAttendance(selectedSlotId, sessionDate)
  }, [selectedSlotId, sessionDate, loadAttendance])

  const slotsByDay = useMemo(() => {
    const map: Record<number, ScheduleSlot[]> = {}
    for (let d = 1; d <= 7; d++) map[d] = []
    for (const s of slots) {
      map[s.dayOfWeek]?.push(s)
    }
    for (const d of Object.keys(map)) {
      map[Number(d)].sort((a, b) => a.period - b.period)
    }
    return map
  }, [slots])

  const selectedSlot = slots.find((s) => s.id === selectedSlotId)

  const todaySlots = useMemo(() => {
    const dow = toSchoolDayOfWeek(new Date(sessionDate + 'T12:00:00'))
    return slots.filter((s) => s.dayOfWeek === dow).sort((a, b) => a.period - b.period)
  }, [slots, sessionDate])

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.edu.createScheduleSlot(classId, form)
      toast.success(t('student.uiSlotAdded'))
      setShowAddForm(false)
      setForm((f) => ({ ...f, subject: '', room: '' }))
      await loadSlots()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('student.uiSlotAddFail'))
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm(t('student.uiSlotDeleteAsk'))) return
    try {
      await api.edu.deleteScheduleSlot(classId, slotId)
      if (selectedSlotId === slotId) setSelectedSlotId(null)
      toast.success(t('student.uiSlotDeleted'))
      await loadSlots()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('student.uiSlotDeleteFail'))
    }
  }

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    for (const s of students) next[s.id] = status
    setAttendanceMap(next)
  }

  const handleSaveAttendance = async () => {
    if (!selectedSlotId) return
    setSaving(true)
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id] ?? ('absent' as AttendanceStatus),
      }))
      await api.edu.saveAttendance(classId, {
        scheduleSlotId: selectedSlotId,
        sessionDate,
        records,
      })
      toast.success(t('student.uiAttendanceSaved'))
      await loadAttendance(selectedSlotId, sessionDate)
      if (!isTeacher) await loadStudentHistory()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('student.uiSaveFail'))
    } finally {
      setSaving(false)
    }
  }

  const applyPeriodPreset = (period: number) => {
    const preset = PERIOD_PRESETS.find((p) => p.period === period) ?? PERIOD_PRESETS[0]
    setForm((f) => ({
      ...f,
      period,
      startTime: preset.startTime,
      endTime: preset.endTime,
    }))
  }

  if (loading) {
    return (
      <p id={id} className="py-8 text-center text-sm text-gray-500">
        {t('schedule.loading')}
      </p>
    )
  }

  return (
    <div id={id} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('schedule.timetable')}</h3>
          <p className="text-sm text-gray-500">{t('schedule.subtitle')}</p>
        </div>
        {isTeacher && (
          <button
            id={`${id}-add-toggle`}
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t('common.period')}
          </button>
        )}
      </div>

      {isTeacher && showAddForm && (
        <form
          id={`${id}-add-form`}
          onSubmit={handleAddSlot}
          className="rounded-lg border border-primary-100 bg-primary-50/40 p-4"
        >
          <p className="mb-3 text-sm font-medium text-gray-900">{t('common.period')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="text-gray-600">{t('common.day')}</span>
              <select
                id={`${id}-day`}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {t(`weekday.${d}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">{t('common.period')}</span>
              <select
                id={`${id}-period`}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.period}
                onChange={(e) => applyPeriodPreset(Number(e.target.value))}
              >
                {PERIOD_PRESETS.map((p) => (
                  <option key={p.period} value={p.period}>
                    {t('common.periodN', { n: p.period })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2 lg:col-span-1">
              <span className="text-gray-600">{t('common.subject')}</span>
              <input
                id={`${id}-subject`}
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder={t('student.uiSubjectPh')}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">{t('student.uiStartTime')}</span>
              <input
                id={`${id}-start-time`}
                type="time"
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">{t('student.uiEndTime')}</span>
              <input
                id={`${id}-end-time`}
                type="time"
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-gray-600">{t('student.uiRoomOptional')}</span>
              <input
                id={`${id}-room`}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                placeholder="A101"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              id={`${id}-add-submit`}
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
            >
              {t('student.uiSaveSlot')}
            </button>
            <button
              id={`${id}-add-cancel`}
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('student.uiCancel')}
            </button>
          </div>
        </form>
      )}

      {slots.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-gray-500">
          {t('schedule.empty')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-2 text-left font-medium text-gray-600">{t('common.day')}</th>
                <th className="border px-2 py-2 text-left font-medium text-gray-600">{t('common.period')}</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <tr key={day}>
                  <td className="border px-2 py-2 align-top font-medium text-gray-800 whitespace-nowrap">
                    {t(`weekday.${day}`)}
                  </td>
                  <td className="border px-2 py-2">
                    {slotsByDay[day].length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slotsByDay[day].map((slot) => (
                          <div
                            key={slot.id}
                            id={`${id}-slot-${slot.id}`}
                            className={`min-w-[140px] rounded-lg border p-2 ${
                              selectedSlotId === slot.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <p className="font-medium text-gray-900">
                              {t('common.periodN', { n: slot.period })}: {text(slot.subject)}
                            </p>
                            <p className="mt-0.5 flex items-center text-xs text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              {slot.startTime} – {slot.endTime}
                            </p>
                            {slot.room && (
                              <p className="flex items-center text-xs text-gray-500">
                                <MapPin className="mr-1 h-3 w-3" />
                                {slot.room}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {isTeacher && (
                                <>
                                  <button
                                    id={`${id}-slot-${slot.id}-attendance`}
                                    type="button"
                                    onClick={() => setSelectedSlotId(slot.id)}
                                    className="rounded bg-primary-600 px-2 py-0.5 text-xs text-white hover:bg-primary-700"
                                  >
                                    {t('charts.attendanceTitle')}
                                  </button>
                                  <button
                                    id={`${id}-slot-${slot.id}-delete`}
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50"
                                    aria-label={t('student.uiDeleteSlot')}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isTeacher && slots.length > 0 && (
        <div id={`${id}-attendance`} className="rounded-xl border bg-gray-50 p-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="font-medium text-gray-700">{t('student.uiAttendanceDate')}</span>
              <input
                id={`${id}-session-date`}
                type="date"
                className="mt-1 block rounded-lg border px-3 py-2"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </label>
            <div className="text-sm text-gray-600">
              <Calendar className="mb-1 inline h-4 w-4" /> {t('common.today')}:{' '}
              {todaySlots.length > 0
                ? todaySlots.map((s) => t('common.periodN', { n: s.period })).join(', ')
                : t('schedule.empty')}
            </div>
          </div>

          {todaySlots.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {todaySlots.map((s) => (
                <button
                  key={s.id}
                  id={`${id}-today-slot-${s.id}`}
                  type="button"
                  onClick={() => setSelectedSlotId(s.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    selectedSlotId === s.id
                      ? 'border-primary-500 bg-primary-100 text-primary-800'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {t('common.periodN', { n: s.period })} — {text(s.subject)}
                </button>
              ))}
            </div>
          )}

          {selectedSlot && (
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary-600" />
                    {t('charts.attendanceTitle')}: {text(selectedSlot.subject)} ({t('common.periodN', { n: selectedSlot.period })})
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t(`weekday.${selectedSlot.dayOfWeek}`)} · {sessionDate} · {selectedSlot.startTime}–
                    {selectedSlot.endTime}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    id={`${id}-mark-all-present`}
                    type="button"
                    onClick={() => markAll('present')}
                    className="rounded border border-green-300 bg-green-50 px-2 py-1 text-xs text-green-800"
                  >
                    {t('status.attendance.present')}
                  </button>
                  <button
                    id={`${id}-mark-all-absent`}
                    type="button"
                    onClick={() => markAll('absent')}
                    className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-800"
                  >
                    {t('status.attendance.absent')}
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <p className="text-sm text-gray-500">{t('charts.noStudents')}</p>
              ) : (
                <ul className="space-y-2">
                  {students.map((student) => {
                    const status = attendanceMap[student.id]
                    return (
                      <li
                        key={student.id}
                        id={`${id}-student-${student.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {(['present', 'late', 'absent'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              id={`${id}-student-${student.id}-${st}`}
                              type="button"
                              onClick={() => setStudentStatus(student.id, st)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                status === st
                                  ? ATTENDANCE_STATUS_COLORS[st]
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {t(`status.attendance.${st}`)}
                            </button>
                          ))}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              <button
                id={`${id}-save-attendance`}
                type="button"
                disabled={saving || students.length === 0}
                onClick={handleSaveAttendance}
                className="mt-4 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 sm:w-auto sm:px-8"
              >
                {saving ? t('common.saving') : t('charts.attendanceTitle')}
              </button>
            </div>
          )}

          {!selectedSlot && (
            <p className="text-sm text-gray-500">{t('student.uiPickSlot')}</p>
          )}
        </div>
      )}

      {!isTeacher && studentHistory.length > 0 && (
        <div id={`${id}-history`} className="rounded-xl border bg-white p-4">
          <h4 className="mb-3 font-semibold text-gray-900">{t('charts.attendanceTitle')}</h4>
          <ul className="divide-y">
            {studentHistory.slice(0, 20).map((h) => (
              <li
                key={h.id}
                id={`${id}-history-item-${h.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {text(h.subject)} — {t('common.periodN', { n: h.period })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(`weekday.${h.dayOfWeek}`)} · {h.sessionDate} · {h.startTime}–{h.endTime}
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${ATTENDANCE_STATUS_COLORS[h.status]}`}>
                  {t(`status.attendance.${h.status}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
