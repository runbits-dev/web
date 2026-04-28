"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import es from './es.json'
import en from './en.json'

const translations: Record<string, Record<string, any>> = { es, en }

export type SupportedLocale = 'es' | 'en'

type I18nContextValue = {
  locale: SupportedLocale
  t: (key: string) => string
  setLocale: (locale: SupportedLocale) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  t: (key) => key,
  setLocale: () => {},
})

function detectInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'es'
  const stored = localStorage.getItem('locale') as SupportedLocale | null
  if (stored && (stored === 'es' || stored === 'en')) return stored
  return navigator.language.startsWith('en') ? 'en' : 'es'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(detectInitialLocale)

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') localStorage.setItem('locale', newLocale)
  }, [])

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.')
      let value: any = translations[locale]
      for (const k of keys) {
        value = value?.[k]
        if (value === undefined) {
          // Fallback to Spanish
          let fallback: any = translations['es']
          for (const fk of keys) fallback = fallback?.[fk]
          return typeof fallback === 'string' ? fallback : key
        }
      }
      return typeof value === 'string' ? value : key
    },
    [locale],
  )

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export { I18nContext }
