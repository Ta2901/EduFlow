export type MemoryRating = 'easy' | 'good' | 'hard' | 'forgot'

/** Thang ôn khi trả lời Tốt — độ dốc trí nhớ dài hạn */
export const GOOD_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const
/** Quá dễ: đẩy xa hơn (4 → 8 → 16…) */
export const EASY_INTERVAL_DAYS = [4, 8, 16, 32, 60] as const
/** Khó: tăng rất nhẹ */
export const HARD_INTERVAL_DAYS = [1, 2, 3, 4, 5] as const

const FORGOT_MS = 10 * 60 * 1000

export function isMemoryRating(v: unknown): v is MemoryRating {
  return v === 'easy' || v === 'good' || v === 'hard' || v === 'forgot'
}

function clampBox(n: number) {
  return Math.min(5, Math.max(1, Math.round(n)))
}

export function applySpacedRepetition(
  current: { box: number; reps: number },
  rating: MemoryRating,
  now = new Date()
) {
  let box = clampBox(current.box || 1)
  let reps = current.reps || 0
  let nextReviewAt: Date
  let intervalDays: number

  if (rating === 'forgot') {
    box = 1
    reps = 0
    intervalDays = 10 / (24 * 60)
    nextReviewAt = new Date(now.getTime() + FORGOT_MS)
  } else if (rating === 'hard') {
    box = clampBox(box)
    intervalDays = HARD_INTERVAL_DAYS[Math.min(box, HARD_INTERVAL_DAYS.length) - 1]
    nextReviewAt = addDays(now, intervalDays)
  } else if (rating === 'good') {
    box = clampBox(box + 1)
    reps += 1
    intervalDays = GOOD_INTERVAL_DAYS[box - 1]
    nextReviewAt = addDays(now, intervalDays)
  } else {
    box = clampBox(box + 2)
    reps += 1
    intervalDays = EASY_INTERVAL_DAYS[box - 1]
    nextReviewAt = addDays(now, intervalDays)
  }

  return {
    box,
    reps,
    intervalDays,
    nextReviewAt,
    nextLabel: formatReviewGap(now, nextReviewAt),
  }
}

function addDays(from: Date, days: number) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
}

export function formatReviewGap(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 90) return `${Math.max(1, mins)} phút`
  const hours = Math.round(mins / 60)
  if (hours < 36) return `${hours} giờ`
  const days = Math.round(hours / 24)
  return `${days} ngày`
}

export const RATING_LABELS: Record<MemoryRating, string> = {
  easy: 'Quá dễ',
  good: 'Tốt',
  hard: 'Khó',
  forgot: 'Quên',
}

export type MemorySignals = {
  isCorrect: boolean
  timeSpentMs: number
  box: number
  reps: number
  lastRating?: string | null
  prompt: string
}

export async function evaluateMemoryWithAi(signals: MemorySignals): Promise<{
  rating: MemoryRating
  reason: string
}> {
  const fallback = heuristicMemory(signals)
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return fallback

  const base = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Bạn là bộ đánh giá ghi nhớ Spaced Repetition. Chỉ trả JSON {"rating":"easy|good|hard|forgot","reason":"1-2 câu tiếng Việt cho học sinh"}. easy=nhớ ngay, good=nhớ chắc sau suy nghĩ, hard=nhớ khó/lưỡng lự, forgot=sai hoặc không nhớ. Nếu isCorrect=false thì rating chỉ được hard hoặc forgot.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              câu_hỏi: signals.prompt.slice(0, 300),
              trả_lời_đúng: signals.isCorrect,
              thời_gian_ms: signals.timeSpentMs,
              hộp_leitner: signals.box,
              số_lần_ôn: signals.reps,
              đánh_giá_trước: signals.lastRating ?? null,
            }),
          },
        ],
      }),
    })
    if (!res.ok) return fallback
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const parsed = JSON.parse(json.choices?.[0]?.message?.content || '{}') as {
      rating?: string
      reason?: string
    }
    let rating = isMemoryRating(parsed.rating) ? parsed.rating : fallback.rating
    if (!signals.isCorrect && (rating === 'easy' || rating === 'good')) rating = 'forgot'
    return {
      rating,
      reason: (parsed.reason || fallback.reason).trim().slice(0, 400),
    }
  } catch {
    return fallback
  }
}

function heuristicMemory(signals: MemorySignals): { rating: MemoryRating; reason: string } {
  const sec = signals.timeSpentMs / 1000
  if (!signals.isCorrect) {
    return {
      rating: sec < 4 ? 'forgot' : 'forgot',
      reason:
        sec < 4
          ? 'Bạn chọn khá nhanh nhưng sai — AI nhận là chưa nhớ khái niệm này.'
          : 'Đáp án chưa đúng. AI xếp thẻ về hộp 1 để ôn lại sớm.',
    }
  }
  if (sec <= 5 && signals.box >= 3) {
    return {
      rating: 'easy',
      reason: 'Trả lời đúng và nhanh — kiến thức đã chắc, sẽ gặp lại sau khoảng thời gian dài hơn.',
    }
  }
  if (sec <= 8) {
    return {
      rating: 'good',
      reason: 'Trả lời đúng sau thời gian suy nghĩ hợp lý — chu kỳ ôn sẽ tăng dần.',
    }
  }
  return {
    rating: 'hard',
    reason: 'Đúng nhưng mất nhiều thời gian. AI giữ nhịp ôn dày hơn để củng cố.',
  }
}
