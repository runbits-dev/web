"use client"

import { useI18n, type SupportedLocale } from '@/i18n'
import { Globe } from 'lucide-react'

interface LocaleSwitcherProps {
  className?: string
}

export function LocaleSwitcher({ className = '' }: LocaleSwitcherProps) {
  const { locale, setLocale } = useI18n()

  function toggle() {
    const next: SupportedLocale = locale === 'es' ? 'en' : 'es'
    setLocale(next)
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors ${className}`}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase font-medium">{locale}</span>
    </button>
  )
}
