"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Utensils, ShoppingBag, Calendar, Briefcase, Building2, ShieldCheck } from 'lucide-react'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { useI18n } from '@/i18n'

type SolutionItem = {
  href: string
  labelKey: string
  Icon: React.ComponentType<{ className?: string }>
}

const VERTICALS: SolutionItem[] = [
  { href: '/food', labelKey: 'verticals.food.short', Icon: Utensils },
  { href: '/goods', labelKey: 'verticals.goods.short', Icon: ShoppingBag },
  { href: '/appointment', labelKey: 'verticals.appointment.short', Icon: Calendar },
  { href: '/task', labelKey: 'verticals.task.short', Icon: Briefcase },
  { href: '/realtime', labelKey: 'verticals.realtime.short', Icon: Building2 },
]

export function LandingNavbar() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="logo-runbits logo-runbits-dark text-2xl">
            RunBits
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {/* Funcionalidades dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-700 transition-colors"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {t('nav.solutions')}
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {t('nav.solutionsHeading')}
                    </p>
                  </div>
                  {VERTICALS.map(({ href, labelKey, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 transition-colors group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                        <Icon className="w-4 h-4 text-gray-600 group-hover:text-brand-700" />
                      </span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">
                        {t(labelKey)}
                      </span>
                    </Link>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <Link
                    href="/security"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                      <ShieldCheck className="w-4 h-4 text-gray-600 group-hover:text-brand-700" />
                    </span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">
                      {t('nav.security')}
                    </span>
                  </Link>
                </div>
              )}
            </div>

            <a href="/#how-it-works" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              {t('nav.howItWorks')}
            </a>
            <a href="/#pricing" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              {t('nav.pricing')}
            </a>
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
