export const LOCALE_OPTIONS = [
  { id: 'en', nativeName: 'English', htmlLang: 'en', intl: 'en-US' },
  { id: 'vi', nativeName: 'Tiếng Việt', htmlLang: 'vi', intl: 'vi-VN' },
  { id: 'ko', nativeName: '한국어', htmlLang: 'ko', intl: 'ko-KR' },
  { id: 'ja', nativeName: '日本語', htmlLang: 'ja', intl: 'ja-JP' },
  { id: 'lzh', nativeName: '文言文', htmlLang: 'lzh', intl: 'zh-CN' },
  { id: 'zh-Hans', nativeName: '中文（简体）', htmlLang: 'zh-Hans', intl: 'zh-CN' },
  { id: 'zh-Hant', nativeName: '中文（繁體）', htmlLang: 'zh-Hant', intl: 'zh-TW' },
  { id: 'mn', nativeName: 'Монгол', htmlLang: 'mn', intl: 'mn-MN' },
  { id: 'th', nativeName: 'ไทย', htmlLang: 'th', intl: 'th-TH' },
  { id: 'id', nativeName: 'Bahasa Indonesia', htmlLang: 'id', intl: 'id-ID' },
  { id: 'fr', nativeName: 'Français', htmlLang: 'fr', intl: 'fr-FR' },
  { id: 'es', nativeName: 'Español', htmlLang: 'es', intl: 'es-ES' },
  { id: 'de', nativeName: 'Deutsch', htmlLang: 'de', intl: 'de-DE' },
  { id: 'ru', nativeName: 'Русский', htmlLang: 'ru', intl: 'ru-RU' },
] as const

export type Locale = (typeof LOCALE_OPTIONS)[number]['id']
export type LocaleMode = 'device' | 'manual'

const LOCALE_SET = new Set<string>(LOCALE_OPTIONS.map((item) => item.id))

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && LOCALE_SET.has(value)
}

export function localeOption(locale: Locale) {
  return LOCALE_OPTIONS.find((item) => item.id === locale) ?? LOCALE_OPTIONS[0]
}

/** Pick the closest supported language from the device language list. */
export function matchDeviceLocale(languages: readonly string[]): Locale {
  for (const raw of languages) {
    const tag = raw.toLowerCase().replace('_', '-')
    if (tag === 'lzh' || tag.startsWith('lzh-')) return 'lzh'
    if (
      tag === 'zh-tw' ||
      tag === 'zh-hk' ||
      tag === 'zh-mo' ||
      tag.startsWith('zh-hant')
    ) {
      return 'zh-Hant'
    }
    if (tag === 'zh' || tag.startsWith('zh-')) return 'zh-Hans'
    const base = tag.split('-')[0]
    const exact = LOCALE_OPTIONS.find((item) => item.id.toLowerCase() === tag || item.id.toLowerCase() === base)
    if (exact) return exact.id
  }
  return 'en'
}

export function deviceLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return ['en']
  const list = navigator.languages?.length ? navigator.languages : [navigator.language]
  return list.filter(Boolean)
}
