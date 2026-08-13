"use client"

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'

type Step = { label: string; href: string; done: boolean }

function getStepsForType(businessType: string, profileDone: boolean, menuCount: number, isOpen: boolean): Step[] {
  const profile: Step = { label: 'Completar perfil', href: '/dashboard/settings', done: profileDone }
  const openStore: Step = { label: 'Abrir tu tienda', href: '/dashboard/settings', done: isOpen }

  switch (businessType) {
    case 'food':
      return [profile, { label: 'Cargar tu menú', href: '/dashboard/menu', done: menuCount > 0 }, openStore]
    case 'appointment':
      return [profile, { label: 'Cargar tus servicios', href: '/dashboard/menu', done: menuCount > 0 }, openStore]
    case 'task':
      return [profile, { label: 'Cargar tus servicios', href: '/dashboard/menu', done: menuCount > 0 }, openStore]
    case 'realtime':
      return [profile, { label: 'Configurar tu servicio', href: '/dashboard/settings', done: menuCount > 0 || isOpen }, openStore]
    default:
      return [profile, { label: 'Cargar tu catálogo', href: '/dashboard/menu', done: menuCount > 0 }, openStore]
  }
}

export function OnboardingBanner({ status, menuCount, hasPhone, hasAddress, isOpen }: { status: string; menuCount: number; hasPhone?: boolean; hasAddress?: boolean; isOpen?: boolean }) {
  const profileDone = !!(hasPhone || hasAddress) || status !== 'pending'
  const menuDone = menuCount > 0
  const storeDone = !!isOpen || status === 'live'

  const { activeProfile } = useProfile()
  const businessType = activeProfile?.business_type ?? 'food'
  const steps = getStepsForType(businessType, profileDone, menuCount, storeDone)

  if (steps.every(s => s.done)) return null

  const doneCount = steps.filter(s => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-200 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Completá tu configuración</h2>
          <p className="text-sm text-slate-600 mt-1">Seguí estos pasos para empezar a operar.</p>
        </div>
        <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
      </div>
      <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <Link key={i} href={step.href} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${step.done ? 'bg-white/60' : 'bg-white hover:bg-white/80 shadow-sm'}`}>
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${step.done ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {step.done ? <Check className="w-4 h-4" /> : i + 1}
            </span>
            <span className={`text-sm font-medium ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{step.label}</span>
            {!step.done && <span className="ml-auto text-xs text-indigo-600 font-semibold">Completar</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
