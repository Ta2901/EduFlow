'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Upload, Sparkles, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'

type DraftOption = { text: string; isCorrect: boolean }
type DraftQuestion = { prompt: string; explanation: string; options: DraftOption[] }

const emptyQuestion = (): DraftQuestion => ({
  prompt: '',
  explanation: '',
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
})

interface PracticeSetPanelProps {
  classId: string
  canEdit: boolean
  id?: string
}

export default function PracticeSetPanel({
  classId,
  canEdit,
  id = 'practice-sets',
}: PracticeSetPanelProps) {
  const [loading, setLoading] = useState(true)
  const [sets, setSets] = useState<Awaited<ReturnType<typeof api.edu.listPracticeSets>>['sets']>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pomodoro, setPomodoro] = useState(25)
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()])
  const [topic, setTopic] = useState('')
  const [aiCount, setAiCount] = useState(5)
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.edu.getPracticeStats>>['stats'] | null>(null)
  const [statsFor, setStatsFor] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { sets: rows } = await api.edu.listPracticeSets(classId)
      setSets(rows)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được bài luyện tập')
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    void load()
  }, [load])

  const openEdit = async (setId: string) => {
    try {
      const { set } = await api.edu.getPracticeSet(setId)
      setEditingId(set.id)
      setTitle(set.title)
      setDescription(set.description)
      setPomodoro(set.pomodoroMinutes)
      setQuestions(
        set.questions.map((q) => ({
          prompt: q.prompt,
          explanation: q.explanation ?? '',
          options:
            q.options.length >= 2
              ? q.options.map((o) => ({ text: o.text, isCorrect: Boolean(o.isCorrect) }))
              : emptyQuestion().options,
        }))
      )
      setStats(null)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không mở được bộ câu hỏi')
    }
  }

  const save = async () => {
    const payload = {
      title,
      description,
      pomodoroMinutes: pomodoro,
      questions: questions.map((q) => ({
        prompt: q.prompt,
        explanation: q.explanation,
        options: q.options,
      })),
    }
    try {
      if (editingId) await api.edu.updatePracticeSet(editingId, payload)
      else await api.edu.createPracticeSet(classId, { ...payload, source: 'manual' })
      toast.success('Đã lưu bài luyện tập')
      setEditingId(null)
      setTitle('')
      setQuestions([emptyQuestion()])
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không lưu được')
    }
  }

  const importFile = async (file: File) => {
    try {
      let setId = editingId
      if (!setId) {
        const created = (await api.edu.createPracticeSet(classId, {
          title: title || file.name.replace(/\.[^.]+$/, ''),
          pomodoroMinutes: pomodoro,
          source: 'upload',
        })) as { set: { id: string } }
        setId = created.set.id
        setEditingId(setId)
      }
      await api.edu.importPracticeFile(setId, file)
      toast.success('Đã nhập câu hỏi từ file')
      await openEdit(setId)
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'File không hợp lệ')
    }
  }

  const generate = async () => {
    try {
      let setId = editingId
      if (!setId) {
        const created = (await api.edu.createPracticeSet(classId, {
          title: title || `AI · ${topic.slice(0, 40)}`,
          pomodoroMinutes: pomodoro,
          source: 'ai',
        })) as { set: { id: string } }
        setId = created.set.id
        setEditingId(setId)
      }
      await api.edu.generatePractice(setId, { topic, count: aiCount })
      toast.success('AI đã tạo câu hỏi (đáp án sẽ xáo khi HS làm)')
      await openEdit(setId)
      await load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tạo được bằng AI')
    }
  }

  const showStats = async (setId: string) => {
    try {
      const { stats: data } = await api.edu.getPracticeStats(setId)
      setStatsFor(setId)
      setStats(data)
      setEditingId(null)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được thống kê')
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải bài luyện tập…</p>
  }

  return (
    <div id={id} className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Bài tập · Spaced Repetition</h3>
        <p className="mt-1 text-sm text-gray-500">
          Trắc nghiệm (tạo tay, file, hoặc AI). Học sinh chỉ chọn đáp án; AI tự đánh giá mức nhớ
          (Quá dễ / Tốt / Khó / Quên) rồi giãn cách lần gặp tiếp (Leitner 5 hộp). Đáp án xáo mỗi lượt.
        </p>
      </div>

      <ul className="divide-y rounded-lg border bg-white">
        {sets.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-400">Chưa có bộ bài luyện tập</li>
        )}
        {sets.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500">
                {s.questionCount} câu · {s.attemptCount} lượt · nguồn {s.source}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void showStats(s.id)}
                className="inline-flex items-center rounded-md border px-2 py-1 text-xs"
              >
                <BarChart3 className="mr-1 h-3.5 w-3.5" />
                Thống kê
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => void openEdit(s.id)}
                  className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
                >
                  Sửa câu hỏi
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {stats && statsFor && (
        <div id={`${id}-stats`} className="rounded-lg border bg-white p-4">
          <h4 className="font-medium text-gray-900">Thống kê · {stats.title}</h4>
          <p className="mt-1 text-sm text-gray-600">
            {stats.attemptCount} lượt hoàn thành · điểm TB {stats.averageScore}/{stats.questionCount}
            {stats.dueNow != null ? ` · ${stats.dueNow} thẻ đang đến hạn` : ''}
          </p>
          {stats.boxes && (
            <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
              {([1, 2, 3, 4, 5] as const).map((b) => (
                <div key={b} className="rounded-lg border bg-gray-50 py-2">
                  <p className="text-gray-500">Hộp {b}</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.boxes?.[b] ?? 0}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-3">Học sinh</th>
                  <th className="py-2 pr-3">Số lần</th>
                  <th className="py-2 pr-3">Cao nhất</th>
                  <th className="py-2">Gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.students.map((st) => (
                  <tr key={st.studentId}>
                    <td className="py-2 pr-3">
                      {st.fullName}
                      <span className="block text-xs text-gray-400">{st.email}</span>
                    </td>
                    <td className="py-2 pr-3">{st.attempts}</td>
                    <td className="py-2 pr-3">
                      {st.best}/{st.total}
                    </td>
                    <td className="py-2">
                      {st.last}/{st.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-gray-600">
            {stats.questions.map((q, i) => (
              <li key={q.id}>
                Câu {i + 1}: đúng {q.accuracy}% ({q.correct}/{q.timesAnswered}) — {q.prompt.slice(0, 80)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canEdit && (
        <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{editingId ? 'Chỉnh sửa bộ câu hỏi' : 'Tạo bộ bài tập mới'}</h4>
            {editingId && (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => {
                  if (!editingId) return
                  void api.edu
                    .deletePracticeSet(editingId)
                    .then(() => {
                      toast.success('Đã xóa')
                      setEditingId(null)
                      return load()
                    })
                    .catch((e) => toast.error(e instanceof ApiError ? e.message : 'Không xóa được'))
                }}
              >
                Xóa bộ này
              </button>
            )}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên bài luyện tập"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả (không bắt buộc)"
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <label className="text-sm text-gray-600">
            Pomodoro (phút)
            <select
              value={pomodoro}
              onChange={(e) => setPomodoro(Number(e.target.value))}
              className="ml-2 rounded-lg border px-2 py-1"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div className="rounded-lg border bg-white p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">Upload file câu hỏi + đáp án (CSV/JSON)</p>
            <p className="text-xs text-gray-500">
              CSV: `câu hỏi,A,B,C,D,đáp án` — đáp án là A/B/C/D hoặc nội dung. JSON: mảng prompt/options/correctIndex.
            </p>
            <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-xs">
              <Upload className="mr-1 h-3.5 w-3.5" />
              Chọn file
              <input
                type="file"
                accept=".csv,.json,.txt,.tsv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void importFile(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          <div className="rounded-lg border bg-white p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">Tạo bằng AI</p>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Chủ đề hoặc dán đoạn kiến thức…"
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={3}
                max={20}
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-20 rounded-lg border px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => void generate()}
                className="inline-flex items-center rounded-md bg-violet-600 px-3 py-1.5 text-xs text-white"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Tạo câu hỏi AI
              </button>
            </div>
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="rounded-lg border bg-white p-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Câu {qi + 1}</span>
                <button type="button" onClick={() => setQuestions((p) => p.filter((_, i) => i !== qi))}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
              <textarea
                value={q.prompt}
                onChange={(e) =>
                  setQuestions((p) => p.map((row, i) => (i === qi ? { ...row, prompt: e.target.value } : row)))
                }
                placeholder="Nội dung câu hỏi"
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={o.isCorrect}
                    onChange={() =>
                      setQuestions((p) =>
                        p.map((row, i) =>
                          i === qi
                            ? {
                                ...row,
                                options: row.options.map((opt, j) => ({ ...opt, isCorrect: j === oi })),
                              }
                            : row
                        )
                      )
                    }
                  />
                  <input
                    value={o.text}
                    onChange={(e) =>
                      setQuestions((p) =>
                        p.map((row, i) =>
                          i === qi
                            ? {
                                ...row,
                                options: row.options.map((opt, j) =>
                                  j === oi ? { ...opt, text: e.target.value } : opt
                                ),
                              }
                            : row
                        )
                      )
                    }
                    placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                    className="flex-1 rounded-lg border px-2 py-1"
                  />
                </label>
              ))}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setQuestions((p) => [...p, emptyQuestion()])}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              Thêm câu
            </button>
            <button
              type="button"
              onClick={() => void save()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white"
            >
              Lưu bộ bài tập
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
