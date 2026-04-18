"use client"

import Link from 'next/link'

type Step = { label: string; href: string; done: boolean; icon: string }

export function OnboardingBanner({ status, menuCount }: { status: string; menuCount: number }) {
  if (status === 'live') return null

  const steps: Step[] = [
    { label: 'Completar perfil', href: '/dashboard/settings', done: status !== 'pending', icon: '1' },
    { label: 'Cargar menú', href: '/dashboard/menu', done: menuCount > 0 || ['menu_added', 'live'].includes(status), icon: '2' },
    { label: 'Abrir tu tienda', href: '/dashboard/settings', done: status === 'live', icon: '3' },
  ]

  const doneCount = steps.filter(s => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">¡Bienvenido a Runbits!</h2>
          <p className="text-sm text-slate-600 mt-1">Completá estos pasos para empezar a recibir pedidos.</p>
        </div>
        <span className="text-2xl font-bold text-emerald-600">{pct}%</span>
      </div>
      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <Link key={i} href={step.href} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${step.done ? 'bg-white/60' : 'bg-white hover:bg-white/80 shadow-sm'}`}>
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {step.done ? '✓' : step.icon}
            </span>
            <span className={`text-sm font-medium ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{step.label}</span>
            {!step.done && <span className="ml-auto text-xs text-emerald-600 font-semibold">→</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
