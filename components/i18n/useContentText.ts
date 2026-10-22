'use client'

import { useCallback } from 'react'
import { useI18n } from '@/components/i18n/LanguageProvider'
import { localizeNotice, localizeText } from '@/lib/i18n/contentText'

export function useContentText() {
  const { locale } = useI18n()
  return useCallback((value: string | null | undefined) => localizeText(value, locale), [locale])
}

export function useLocalizedNotice() {
  const { locale } = useI18n()
  return useCallback(
    (notice: { type: string; title: string; message: string }) => localizeNotice(notice, locale),
    [locale]
  )
}
