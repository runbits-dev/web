"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
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

export function I18nProvider({ children }: { children: ReactNode }) {
  // Initial state MUST match the SSR / pre-render output ('es') to avoid React
  // #418 hydration mismatch. We adjust to the user's preferred locale in
  // useEffect after the first paint — the client-only read of
  // localStorage/navigator.language happens AFTER hydration completes.
  const [locale, setLocaleState] = useState<SupportedLocale>('es')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('locale') as SupportedLocale | null
    if (stored === 'es' || stored === 'en') {
      if (stored !== 'es') setLocaleState(stored)
      return
    }
    if (navigator.language && navigator.language.startsWith('en')) {
      setLocaleState('en')
    }
  }, [])

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
