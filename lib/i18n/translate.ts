import { en, vi, type Messages } from './messages'
import { isLocale, type Locale } from './catalog'
import { ko } from './locales/ko'
import { ja } from './locales/ja'
import { zhHans, zhHant } from './locales/zh'
import { lzh } from './locales/lzh'
import { mn } from './locales/mn'
import { th, id } from './locales/rest'
import { fr, es, de, ru } from './locales/western'

const dictionaries: Record<Locale, Messages> = {
  en,
  vi,
  ko,
  ja,
  lzh,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  mn,
  th,
  id,
  fr,
  es,
  de,
  ru,
}

export function translate(
  locale: Locale,
  path: string,
  vars?: Record<string, string | number>
): string {
  const parts = path.split('.')
  let current: unknown = dictionaries[locale]
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) return path
    current = (current as Record<string, unknown>)[part]
  }
  if (typeof current !== 'string') return path
  if (!vars) return current
  return current.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] == null ? `{${key}}` : String(vars[key])
  )
}

export { isLocale }
