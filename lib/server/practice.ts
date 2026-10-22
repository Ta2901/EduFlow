import { classWritesBlocked } from '../classStatus'
import { prisma } from '../prisma'
import { assertCanWrite } from './account'
import { createNotification } from './notifications'
import type { SessionPayload } from './session'
import {
  applySpacedRepetition,
  evaluateMemoryWithAi,
  type MemoryRating,
  RATING_LABELS,
} from './srs'

export type PracticeSource = 'manual' | 'upload' | 'ai'

type DraftQuestion = {
  prompt: string
  explanation?: string
  options: { text: string; isCorrect: boolean }[]
}

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

async function assertClassMember(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: { select: { studentId: true } } },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp')
  if (session.role === 'admin') return classroom
  if (session.role === 'teacher' && classroom.teacherId === session.userId) return classroom
  const enrolled = classroom.enrollments.some((e) => e.studentId === session.userId)
  if (!enrolled) throw new Error('Bạn chưa tham gia lớp này')
  return classroom
}

async function assertTeacherOwnsClass(classId: string, session: SessionPayload) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      title: true,
      teacherId: true,
      status: true,
      enrollments: { select: { studentId: true } },
    },
  })
  if (!classroom) throw new Error('Không tìm thấy lớp')
  const writeBlocked = classWritesBlocked(classroom.status)
  if (writeBlocked) throw new Error(writeBlocked)
  if (session.role === 'admin') return classroom
  if (session.role !== 'teacher' || classroom.teacherId !== session.userId) {
    throw new Error('Không có quyền')
  }
  return classroom
}

function clampPomodoro(n: number) {
  const v = Math.round(Number(n) || 25)
  if (v < 5) return 5
  if (v > 60) return 60
  return v
}

function normalizeDraft(raw: DraftQuestion[]): DraftQuestion[] {
  const cleaned = raw
    .map((q) => ({
      prompt: q.prompt.trim(),
      explanation: (q.explanation ?? '').trim(),
      options: q.options
        .map((o) => ({ text: o.text.trim(), isCorrect: Boolean(o.isCorrect) }))
        .filter((o) => o.text),
    }))
    .filter((q) => q.prompt && q.options.length >= 2)

  for (const q of cleaned) {
    const correctCount = q.options.filter((o) => o.isCorrect).length
    if (correctCount !== 1) {
      throw new Error(`Mỗi câu cần đúng 1 đáp án: 「${q.prompt.slice(0, 40)}」`)
    }
  }
  if (cleaned.length === 0) throw new Error('Cần ít nhất một câu hỏi hợp lệ')
  return cleaned
}

async function replaceQuestions(setId: string, drafts: DraftQuestion[]) {
  const questions = normalizeDraft(drafts)
  await prisma.$transaction(async (tx) => {
    await tx.practiceQuestion.deleteMany({ where: { setId } })
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      await tx.practiceQuestion.create({
        data: {
          setId,
          prompt: q.prompt,
          explanation: q.explanation ?? '',
          sortOrder: i,
          options: {
            create: q.options.map((o, oi) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              sortOrder: oi,
            })),
          },
        },
      })
    }
  })
}

function mapSetSummary(row: {
  id: string
  classId: string
  teacherId: string
  title: string
  description: string
  source: string
  pomodoroMinutes: number
  shuffleOptions: boolean
  createdAt: Date
  _count?: { questions: number; attempts: number }
}) {
  return {
    id: row.id,
    classId: row.classId,
    teacherId: row.teacherId,
    title: row.title,
    description: row.description,
    source: row.source as PracticeSource,
    pomodoroMinutes: row.pomodoroMinutes,
    shuffleOptions: row.shuffleOptions,
    createdAt: row.createdAt.toISOString(),
    questionCount: row._count?.questions ?? 0,
    attemptCount: row._count?.attempts ?? 0,
  }
}

export async function listPracticeSets(classId: string, session: SessionPayload) {
  await assertClassMember(classId, session)
  const sets = await prisma.practiceSet.findMany({
    where: { classId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true, attempts: true } } },
  })

  if (session.role !== 'student') {
    return { sets: sets.map(mapSetSummary) }
  }

  const ids = sets.map((s) => s.id)
  const mine =
    ids.length === 0
      ? []
      : await prisma.practiceAttempt.findMany({
          where: { studentId: session.userId, setId: { in: ids }, status: { in: ['submitted', 'expired'] } },
          orderBy: { startedAt: 'desc' },
          select: { setId: true, score: true, total: true, startedAt: true },
        })

  const lastBySet = new Map<string, (typeof mine)[0]>()
  const countBySet = new Map<string, number>()
  for (const a of mine) {
    countBySet.set(a.setId, (countBySet.get(a.setId) ?? 0) + 1)
    if (!lastBySet.has(a.setId)) lastBySet.set(a.setId, a)
  }

  const cards =
    ids.length === 0
      ? []
      : await prisma.practiceCardState.findMany({
          where: { studentId: session.userId, setId: { in: ids } },
          select: { setId: true, box: true, nextReviewAt: true, reps: true },
        })
  const now = Date.now()
  const srsBySet = new Map<string, { due: number; newCards: number; box5: number }>()
  for (const c of cards) {
    const cur = srsBySet.get(c.setId) ?? { due: 0, newCards: 0, box5: 0 }
    if (c.nextReviewAt.getTime() <= now) cur.due += 1
    if (c.reps === 0) cur.newCards += 1
    if (c.box >= 5) cur.box5 += 1
    srsBySet.set(c.setId, cur)
  }

  return {
    sets: sets.map((s) => {
      const last = lastBySet.get(s.id)
      const srs = srsBySet.get(s.id)
      const questionCount = s._count?.questions ?? 0
      const tracked = cards.filter((c) => c.setId === s.id).length
      const untracked = Math.max(0, questionCount - tracked)
      return {
        ...mapSetSummary(s),
        myAttempts: countBySet.get(s.id) ?? 0,
        lastScore: last ? last.score : undefined,
        lastTotal: last ? last.total : undefined,
        dueCount: (srs?.due ?? 0) + untracked,
        newCount: untracked,
        masteredCount: srs?.box5 ?? 0,
      }
    }),
  }
}

export async function createPracticeSet(
  classId: string,
  session: SessionPayload,
  input: {
    title: string
    description?: string
    source?: PracticeSource
    pomodoroMinutes?: number
    questions?: DraftQuestion[]
  }
) {
  await assertCanWrite(session)
  const classroom = await assertTeacherOwnsClass(classId, session)
  const title = input.title.trim()
  if (!title) throw new Error('Nhập tên bộ bài tập')

  const set = await prisma.practiceSet.create({
    data: {
      classId,
      teacherId: classroom.teacherId,
      title,
      description: (input.description ?? '').trim(),
      source: input.source ?? 'manual',
      pomodoroMinutes: clampPomodoro(input.pomodoroMinutes ?? 25),
    },
  })

  if (input.questions?.length) {
    await replaceQuestions(set.id, input.questions)
  }

  const studentIds = classroom.enrollments.map((e) => e.studentId)
  await Promise.all(
    studentIds.map((studentId) =>
      createNotification({
        userId: studentId,
        type: 'practice_set',
        title: 'Bài luyện tập mới',
        message: `「${title}」 — ${classroom.title}`,
        href: `/student/courses/${classId}`,
        dedupeKey: `practice-${set.id}-${studentId}`,
      })
    )
  )

  return getPracticeSet(set.id, session)
}

export async function getPracticeSet(setId: string, session: SessionPayload) {
  const set = await prisma.practiceSet.findUnique({
    where: { id: setId },
    include: {
      questions: { include: { options: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { questions: true, attempts: true } },
    },
  })
  if (!set) throw new Error('Không tìm thấy bộ bài tập')
  await assertClassMember(set.classId, session)

  const teacherView = session.role === 'teacher' || session.role === 'admin'
  return {
    set: {
      ...mapSetSummary(set),
      questions: set.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        explanation: teacherView ? q.explanation : undefined,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: teacherView ? o.isCorrect : undefined,
        })),
      })),
    },
  }
}

export async function updatePracticeSet(
  setId: string,
  session: SessionPayload,
  input: {
    title?: string
    description?: string
    pomodoroMinutes?: number
    questions?: DraftQuestion[]
  }
) {
  await assertCanWrite(session)
  const existing = await prisma.practiceSet.findUnique({ where: { id: setId } })
  if (!existing) throw new Error('Không tìm thấy bộ bài tập')
  await assertTeacherOwnsClass(existing.classId, session)

  await prisma.practiceSet.update({
    where: { id: setId },
    data: {
      title: input.title?.trim() || undefined,
      description: input.description !== undefined ? input.description.trim() : undefined,
      pomodoroMinutes:
        input.pomodoroMinutes !== undefined ? clampPomodoro(input.pomodoroMinutes) : undefined,
    },
  })
  if (input.questions) await replaceQuestions(setId, input.questions)
  return getPracticeSet(setId, session)
}

export async function deletePracticeSet(setId: string, session: SessionPayload) {
  await assertCanWrite(session)
  const existing = await prisma.practiceSet.findUnique({ where: { id: setId } })
  if (!existing) throw new Error('Không tìm thấy bộ bài tập')
  await assertTeacherOwnsClass(existing.classId, session)
  await prisma.practiceSet.delete({ where: { id: setId } })
  return { ok: true as const }
}

export function parseQuestionFile(content: string, filename = ''): DraftQuestion[] {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('File trống')

  if (trimmed.startsWith('[') || trimmed.startsWith('{') || filename.endsWith('.json')) {
    const data = JSON.parse(trimmed) as unknown
    const list = Array.isArray(data) ? data : (data as { questions?: unknown[] }).questions
    if (!Array.isArray(list)) throw new Error('JSON phải là mảng câu hỏi')
    return list.map((item) => {
      const row = item as {
        prompt?: string
        question?: string
        explanation?: string
        answer?: string
        correctIndex?: number
        options?: unknown
      }
      const prompt = String(row.prompt ?? row.question ?? '').trim()
      let options: { text: string; isCorrect: boolean }[] = []
      if (Array.isArray(row.options)) {
        options = row.options.map((o, i) => {
          if (typeof o === 'string') {
            return { text: o, isCorrect: row.correctIndex === i || row.answer === o }
          }
          const obj = o as { text?: string; isCorrect?: boolean }
          return { text: String(obj.text ?? ''), isCorrect: Boolean(obj.isCorrect) }
        })
      }
      return { prompt, explanation: row.explanation, options }
    })
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'))
  const rows = lines.map((line) => splitCsvLine(line))
  const header = rows[0]?.map((c) => c.toLowerCase()) ?? []
  const hasHeader =
    header[0]?.includes('question') || header[0]?.includes('câu') || header[0] === 'prompt'
  const body = hasHeader ? rows.slice(1) : rows

  return body.map((cols) => {
    const prompt = cols[0] ?? ''
    const answerKey = (cols[cols.length - 1] ?? '').trim()
    const optionTexts = cols.slice(1, -1).filter(Boolean)
    const options = optionTexts.map((text, i) => {
      const letter = String.fromCharCode(65 + i)
      const isCorrect =
        answerKey === letter ||
        answerKey === String(i + 1) ||
        answerKey.toLowerCase() === text.toLowerCase()
      return { text, isCorrect }
    })
    return { prompt, options }
  })
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      quoted = !quoted
      continue
    }
    if ((ch === ',' || ch === '\t' || ch === ';') && !quoted) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

export async function importPracticeQuestions(
  setId: string,
  session: SessionPayload,
  content: string,
  filename: string
) {
  await assertCanWrite(session)
  const existing = await prisma.practiceSet.findUnique({ where: { id: setId } })
  if (!existing) throw new Error('Không tìm thấy bộ bài tập')
  await assertTeacherOwnsClass(existing.classId, session)
  const drafts = parseQuestionFile(content, filename)
  await prisma.practiceSet.update({ where: { id: setId }, data: { source: 'upload' } })
  await replaceQuestions(setId, drafts)
  return getPracticeSet(setId, session)
}

type GeneratedMcq = {
  prompt: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export async function generatePracticeQuestions(
  setId: string,
  session: SessionPayload,
  input: { topic: string; count?: number }
) {
  await assertCanWrite(session)
  const existing = await prisma.practiceSet.findUnique({ where: { id: setId } })
  if (!existing) throw new Error('Không tìm thấy bộ bài tập')
  await assertTeacherOwnsClass(existing.classId, session)

  const count = Math.min(20, Math.max(3, Math.round(input.count ?? 5)))
  const topic = input.topic.trim()
  if (!topic) throw new Error('Nhập chủ đề hoặc đoạn kiến thức để AI tạo câu')

  const generated = await generateMcqWithAi(topic, count)
  const drafts: DraftQuestion[] = generated.map((g) => ({
    prompt: g.prompt,
    explanation: g.explanation,
    options: g.options.map((text, i) => ({ text, isCorrect: i === g.correctIndex })),
  }))

  await prisma.practiceSet.update({ where: { id: setId }, data: { source: 'ai' } })
  await replaceQuestions(setId, drafts)
  return getPracticeSet(setId, session)
}

async function generateMcqWithAi(topic: string, count: number): Promise<GeneratedMcq[]> {
  const key = process.env.OPENAI_API_KEY?.trim()
  const base = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'

  if (key) {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Tạo câu trắc nghiệm tiếng Việt. Trả JSON {"questions":[{"prompt":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}. Mỗi câu đúng 1 đáp án, 4 lựa chọn.',
          },
          {
            role: 'user',
            content: `Tạo ${count} câu về:\n${topic}`,
          },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`AI lỗi (${res.status}): ${err.slice(0, 180) || 'không tạo được câu hỏi'}`)
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = json.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content) as { questions?: GeneratedMcq[] }
    if (!parsed.questions?.length) throw new Error('AI không trả về câu hỏi')
    return parsed.questions
  }

  return fallbackGenerate(topic, count)
}

function fallbackGenerate(topic: string, count: number): GeneratedMcq[] {
  const lines = topic
    .split(/\n+/)
    .map((l) => l.replace(/^[-*\d.\s]+/, '').trim())
    .filter((l) => l.length > 8)
  const facts = lines.length > 0 ? lines : [topic]
  const out: GeneratedMcq[] = []
  for (let i = 0; i < count; i++) {
    const fact = facts[i % facts.length]
    const decoys = facts.filter((_, idx) => idx !== i % facts.length).slice(0, 3)
    while (decoys.length < 3) decoys.push(`Phát biểu không đúng về: ${fact.slice(0, 40)}`)
    const options = shuffle([fact, ...decoys.slice(0, 3)])
    out.push({
      prompt: `Chọn phát biểu đúng liên quan đến chủ đề (câu ${i + 1})?`,
      options,
      correctIndex: options.indexOf(fact),
      explanation: `Dựa trên nội dung đã nhập: ${fact}`,
    })
  }
  return out
}

export async function startPracticeAttempt(setId: string, session: SessionPayload) {
  await assertCanWrite(session)
  if (session.role !== 'student') throw new Error('Chỉ học sinh luyện tập')

  const set = await prisma.practiceSet.findUnique({
    where: { id: setId },
    include: {
      questions: { include: { options: true }, orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!set) throw new Error('Không tìm thấy bộ bài tập')
  const classroom = await assertClassMember(set.classId, session)
  const writeBlocked = classWritesBlocked(classroom.status)
  if (writeBlocked) throw new Error(writeBlocked)
  if (set.questions.length === 0) throw new Error('Giáo viên chưa thêm câu hỏi')

  const existing = await prisma.practiceAttempt.findFirst({
    where: { setId, studentId: session.userId, status: 'in_progress' },
    orderBy: { startedAt: 'desc' },
  })
  if (existing) return loadAttemptForStudent(existing.id)

  await ensureCardStates(setId, session.userId, set.questions.map((q) => q.id))

  const now = new Date()
  const states = await prisma.practiceCardState.findMany({
    where: { setId, studentId: session.userId },
  })
  const stateByQ = new Map(states.map((s) => [s.questionId, s]))
  const due = set.questions
    .filter((q) => {
      const st = stateByQ.get(q.id)
      return !st || st.nextReviewAt.getTime() <= now.getTime()
    })
    .sort((a, b) => (stateByQ.get(a.id)?.box ?? 1) - (stateByQ.get(b.id)?.box ?? 1))
    .slice(0, 15)

  if (due.length === 0) {
    const next = states
      .map((s) => s.nextReviewAt)
      .sort((a, b) => a.getTime() - b.getTime())[0]
    const when = next
      ? next.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : 'sau'
    throw new Error(`Chưa đến lịch ôn ngắt quãng. Thẻ gần nhất: ${when}`)
  }

  const options: Record<string, string[]> = {}
  for (const q of due) {
    const ids = q.options.map((o) => o.id)
    options[q.id] = set.shuffleOptions ? shuffle(ids) : ids
  }

  const attempt = await prisma.practiceAttempt.create({
    data: {
      setId,
      studentId: session.userId,
      status: 'in_progress',
      optionOrder: JSON.stringify({ queue: due.map((q) => q.id), options }),
      total: due.length,
      pomodoroMinutes: set.pomodoroMinutes,
    },
  })
  return loadAttemptForStudent(attempt.id)
}

async function ensureCardStates(setId: string, studentId: string, questionIds: string[]) {
  const existing = await prisma.practiceCardState.findMany({
    where: { studentId, questionId: { in: questionIds } },
    select: { questionId: true },
  })
  const have = new Set(existing.map((e) => e.questionId))
  const missing = questionIds.filter((id) => !have.has(id))
  if (missing.length === 0) return
  await prisma.practiceCardState.createMany({
    data: missing.map((questionId) => ({
      setId,
      questionId,
      studentId,
      box: 1,
      reps: 0,
      nextReviewAt: new Date(),
    })),
    skipDuplicates: true,
  })
}

type OrderPayload = { queue: string[]; options: Record<string, string[]> }

function parseOrder(raw: string): OrderPayload {
  const parsed = JSON.parse(raw || '{}') as Record<string, unknown>
  if (Array.isArray(parsed.queue) && parsed.options && typeof parsed.options === 'object') {
    return {
      queue: parsed.queue as string[],
      options: parsed.options as Record<string, string[]>,
    }
  }
  const queue = Array.isArray(parsed.__queue) ? (parsed.__queue as string[]) : Object.keys(parsed)
  const options = { ...parsed } as Record<string, string[]>
  delete (options as { __queue?: unknown }).__queue
  delete (options as { queue?: unknown }).queue
  return { queue, options }
}

async function loadAttemptForStudent(attemptId: string) {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      set: {
        include: {
          questions: { include: { options: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
      answers: true,
    },
  })
  if (!attempt) throw new Error('Không tìm thấy lượt làm')

  const { queue, options: order } = parseOrder(attempt.optionOrder || '{}')
  const qset = new Set(queue)
  const questions = attempt.set.questions.filter((q) => qset.size === 0 || qset.has(q.id))
  const ordered = queue.length
    ? queue.map((id) => questions.find((q) => q.id === id)).filter(Boolean)
    : questions
  const answerByQ = new Map(attempt.answers.map((a) => [a.questionId, a]))
  const revealAll = attempt.status !== 'in_progress'

  return {
    attempt: {
      id: attempt.id,
      setId: attempt.setId,
      status: attempt.status,
      score: revealAll ? attempt.score : undefined,
      total: attempt.total || ordered.length,
      pomodoroMinutes: attempt.pomodoroMinutes,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString(),
      title: attempt.set.title,
      srs: true,
      questions: ordered.map((q) => {
        const ids = order[q!.id] ?? q!.options.map((o) => o.id)
        const byId = new Map(q!.options.map((o) => [o.id, o]))
        const chosen = answerByQ.get(q!.id)
        const reveal = revealAll || Boolean(chosen?.optionId) || chosen?.rating
        return {
          id: q!.id,
          prompt: q!.prompt,
          explanation: reveal ? q!.explanation : undefined,
          selectedOptionId: chosen?.optionId ?? undefined,
          isCorrect: reveal ? chosen?.isCorrect : undefined,
          rating: chosen?.rating ?? undefined,
          options: ids
            .map((id) => byId.get(id))
            .filter(Boolean)
            .map((o) => ({
              id: o!.id,
              text: o!.text,
              isCorrect: reveal ? o!.isCorrect : undefined,
            })),
        }
      }),
    },
  }
}

export async function savePracticeAnswers(
  attemptId: string,
  session: SessionPayload,
  answers: { questionId: string; optionId: string | null }[]
) {
  if (session.role !== 'student') throw new Error('Chỉ học sinh luyện tập')
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: { set: { include: { questions: { include: { options: true } } } } },
  })
  if (!attempt || attempt.studentId !== session.userId) throw new Error('Không có quyền')
  if (attempt.status !== 'in_progress') throw new Error('Lượt làm đã kết thúc')

  const optionById = new Map(
    attempt.set.questions.flatMap((q) => q.options.map((o) => [o.id, { ...o, questionId: q.id }]))
  )

  await prisma.$transaction(
    answers.map((a) => {
      const opt = a.optionId ? optionById.get(a.optionId) : undefined
      const isCorrect = Boolean(opt && opt.questionId === a.questionId && opt.isCorrect)
      return prisma.practiceAttemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: a.questionId } },
        create: {
          attemptId,
          questionId: a.questionId,
          optionId: a.optionId,
          isCorrect,
        },
        update: { optionId: a.optionId, isCorrect },
      })
    })
  )

  return {
    ok: true as const,
    revealed: answers.map((a) => {
      const q = attempt.set.questions.find((qq) => qq.id === a.questionId)
      const opt = a.optionId ? optionById.get(a.optionId) : undefined
      const isCorrect = Boolean(opt && opt.questionId === a.questionId && opt.isCorrect)
      return {
        questionId: a.questionId,
        isCorrect,
        explanation: q?.explanation,
        correctOptionId: q?.options.find((o) => o.isCorrect)?.id,
      }
    }),
  }
}

export async function evaluateAndScheduleCard(
  attemptId: string,
  session: SessionPayload,
  input: { questionId: string; optionId?: string | null; timeSpentMs?: number }
) {
  await assertCanWrite(session)
  if (input.optionId !== undefined) {
    await savePracticeAnswers(attemptId, session, [
      { questionId: input.questionId, optionId: input.optionId },
    ])
  }

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      set: {
        include: {
          questions: { where: { id: input.questionId }, select: { prompt: true } },
        },
      },
    },
  })
  if (!attempt || attempt.studentId !== session.userId) throw new Error('Không có quyền')
  if (attempt.status !== 'in_progress') throw new Error('Lượt làm đã kết thúc')

  const answer = attempt.answers.find((a) => a.questionId === input.questionId)
  if (!answer) throw new Error('Hãy chọn đáp án trước')

  const card = await prisma.practiceCardState.findUnique({
    where: { studentId_questionId: { studentId: session.userId, questionId: input.questionId } },
  })

  const judged = await evaluateMemoryWithAi({
    isCorrect: answer.isCorrect,
    timeSpentMs: Math.max(0, Number(input.timeSpentMs) || 0),
    box: card?.box ?? 1,
    reps: card?.reps ?? 0,
    lastRating: card?.lastRating,
    prompt: attempt.set.questions[0]?.prompt ?? '',
  })

  const next = applySpacedRepetition({ box: card?.box ?? 1, reps: card?.reps ?? 0 }, judged.rating)

  await prisma.$transaction([
    prisma.practiceAttemptAnswer.update({
      where: { id: answer.id },
      data: { rating: judged.rating },
    }),
    prisma.practiceCardState.upsert({
      where: { studentId_questionId: { studentId: session.userId, questionId: input.questionId } },
      create: {
        setId: attempt.setId,
        questionId: input.questionId,
        studentId: session.userId,
        box: next.box,
        reps: next.reps,
        intervalDays: next.intervalDays,
        nextReviewAt: next.nextReviewAt,
        lastRating: judged.rating,
        lastReviewedAt: new Date(),
      },
      update: {
        box: next.box,
        reps: next.reps,
        intervalDays: next.intervalDays,
        nextReviewAt: next.nextReviewAt,
        lastRating: judged.rating,
        lastReviewedAt: new Date(),
      },
    }),
  ])

  const { queue } = parseOrder(attempt.optionOrder)
  const rated = new Set(
    attempt.answers.filter((a) => a.questionId === input.questionId || a.rating).map((a) => a.questionId)
  )
  rated.add(input.questionId)
  const allRated = queue.length > 0 && queue.every((id) => rated.has(id))

  let finished = null as Awaited<ReturnType<typeof loadAttemptForStudent>> | null
  if (allRated) {
    finished = await submitPracticeAttempt(attemptId, session)
  }

  return {
    rating: judged.rating,
    ratingLabel: RATING_LABELS[judged.rating],
    reason: judged.reason,
    box: next.box,
    nextLabel: next.nextLabel,
    nextReviewAt: next.nextReviewAt.toISOString(),
    isCorrect: answer.isCorrect,
    attempt: finished?.attempt ?? (await loadAttemptForStudent(attemptId)).attempt,
    sessionComplete: Boolean(finished),
  }
}

/** @deprecated dùng evaluateAndScheduleCard — giữ alias cho API cũ */
export async function ratePracticeCard(
  attemptId: string,
  session: SessionPayload,
  input: { questionId: string; optionId?: string | null; rating?: MemoryRating; timeSpentMs?: number }
) {
  return evaluateAndScheduleCard(attemptId, session, input)
}

export async function submitPracticeAttempt(
  attemptId: string,
  session: SessionPayload,
  input?: { answers?: { questionId: string; optionId: string | null }[]; expired?: boolean }
) {
  await assertCanWrite(session)
  if (input?.answers?.length) {
    await savePracticeAnswers(attemptId, session, input.answers)
  }

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      set: { include: { questions: { include: { options: true } } } },
      answers: true,
    },
  })
  if (!attempt || attempt.studentId !== session.userId) throw new Error('Không có quyền')
  if (attempt.status !== 'in_progress') return loadAttemptForStudent(attemptId)

  const total = Math.max(attempt.total, attempt.answers.length, 1)
  const score = attempt.answers.filter((a) => a.isCorrect).length
  const durationSec = Math.max(
    0,
    Math.round((Date.now() - attempt.startedAt.getTime()) / 1000)
  )

  await prisma.practiceAttempt.update({
    where: { id: attemptId },
    data: {
      status: input?.expired ? 'expired' : 'submitted',
      score,
      total,
      durationSec,
      submittedAt: new Date(),
    },
  })
  return loadAttemptForStudent(attemptId)
}

export async function listMyAttempts(setId: string, session: SessionPayload) {
  const set = await prisma.practiceSet.findUnique({ where: { id: setId } })
  if (!set) throw new Error('Không tìm thấy bộ bài tập')
  await assertClassMember(set.classId, session)

  const where =
    session.role === 'student'
      ? { setId, studentId: session.userId }
      : { setId }

  const rows = await prisma.practiceAttempt.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 100,
    include: { student: { select: { fullName: true, email: true } } },
  })
  return {
    attempts: rows.map((r) => ({
      id: r.id,
      studentName: r.student.fullName,
      studentEmail: r.student.email,
      status: r.status,
      score: r.score,
      total: r.total,
      durationSec: r.durationSec,
      startedAt: r.startedAt.toISOString(),
      submittedAt: r.submittedAt?.toISOString(),
    })),
  }
}

export async function getPracticeStats(setId: string, session: SessionPayload) {
  const set = await prisma.practiceSet.findUnique({
    where: { id: setId },
    include: {
      questions: { include: { options: true, answers: true }, orderBy: { sortOrder: 'asc' } },
      attempts: {
        where: { status: { in: ['submitted', 'expired'] } },
        include: { student: { select: { id: true, fullName: true, email: true } } },
      },
    },
  })
  if (!set) throw new Error('Không tìm thấy bộ bài tập')
  await assertTeacherOwnsClass(set.classId, session)

  const done = set.attempts
  const avg =
    done.length === 0 ? 0 : Math.round((done.reduce((s, a) => s + a.score, 0) / done.length) * 10) / 10

  const byStudent = new Map<
    string,
    { studentId: string; fullName: string; email: string; attempts: number; best: number; last: number; total: number }
  >()
  for (const a of done.slice().sort((x, y) => x.startedAt.getTime() - y.startedAt.getTime())) {
    const cur = byStudent.get(a.studentId) ?? {
      studentId: a.studentId,
      fullName: a.student.fullName,
      email: a.student.email,
      attempts: 0,
      best: 0,
      last: 0,
      total: a.total,
    }
    cur.attempts += 1
    cur.last = a.score
    cur.best = Math.max(cur.best, a.score)
    cur.total = a.total
    byStudent.set(a.studentId, cur)
  }

  const doneIds = new Set(done.map((d) => d.id))
  const questions = set.questions.map((q) => {
    const answered = q.answers.filter((a) => doneIds.has(a.attemptId))
    const correct = answered.filter((a) => a.isCorrect).length
    return {
      id: q.id,
      prompt: q.prompt,
      timesAnswered: answered.length,
      correct,
      accuracy: answered.length === 0 ? 0 : Math.round((correct / answered.length) * 100),
    }
  })

  const cards = await prisma.practiceCardState.findMany({
    where: { setId },
    select: { box: true, studentId: true, nextReviewAt: true },
  })
  const boxes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const c of cards) {
    const b = Math.min(5, Math.max(1, c.box)) as 1 | 2 | 3 | 4 | 5
    boxes[b] += 1
  }
  const dueNow = cards.filter((c) => c.nextReviewAt.getTime() <= Date.now()).length

  return {
    stats: {
      title: set.title,
      questionCount: set.questions.length,
      attemptCount: done.length,
      averageScore: avg,
      boxes,
      dueNow,
      students: Array.from(byStudent.values()),
      questions,
      recent: done
        .slice()
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, 30)
        .map((a) => ({
          id: a.id,
          studentName: a.student.fullName,
          score: a.score,
          total: a.total,
          durationSec: a.durationSec,
          status: a.status,
          startedAt: a.startedAt.toISOString(),
        })),
    },
  }
}
