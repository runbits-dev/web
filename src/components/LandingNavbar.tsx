"use client"

import Link from 'next/link'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { useI18n } from '@/i18n'

export function LandingNavbar() {
  const { t } = useI18n()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="logo-runbits logo-runbits-dark text-2xl">
            RunBits
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              {t('nav.features')}
            </a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              {t('nav.howItWorks')}
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              {t('nav.pricing')}
            </a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              {t('nav.contact')}
            </a>
            <Link href="/about" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              {t('nav.about')}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-brand-700 transition-colors"
            >
              {t('nav.login')}
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
