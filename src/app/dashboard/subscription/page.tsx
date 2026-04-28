"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'
import { Check, Receipt } from 'lucide-react'

type Subscription = {
  id: string
  plan: string
  status: string
  restaurant_id: string
  current_period_start: number
  current_period_end: number
  order_count: number
  order_limit: number
  price_usd_cents: number
  trial_end: number | null
}

const PLANS = [
  {
    name: 'free', label: 'Free', price: 0,
    description: 'Operá tu negocio sin costo',
    features: ['Catálogo ilimitado', 'Pedidos ilimitados', 'Tienda online', 'Chat con clientes', '3 cupones', '1 promo activa', 'Estadísticas básicas'],
  },
  {
    name: 'pro', label: 'Pro', price: 29,
    description: 'Herramientas para crecer',
    features: ['Todo de Free', 'Cupones y promos ilimitados', 'Dominio propio', 'Marca personalizada', 'Analytics con gráficos', '5 campañas push/mes', 'Perfiles ilimitados'],
    popular: true,
  },
  {
    name: 'business', label: 'Business', price: 99,
    description: 'Para escalar tu operación',
    features: ['Todo de Pro', 'White-label', 'Multi-sucursal (5)', '5 usuarios staff', 'Webhooks', 'Email marketing', 'Verificación de clientes'],
  },
  {
    name: 'enterprise', label: 'Enterprise', price: 249,
    description: 'Todo ilimitado + IA',
    features: ['Todo de Business', 'Asistente IA 24/7', 'WhatsApp bot', 'GPS tracking', 'API REST', 'Sucursales ilimitadas', 'Soporte dedicado'],
  },
]

const statusLabel: Record<string, { text: string; color: string }> = {
  active: { text: 'Activo', color: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  trialing: { text: 'Prueba', color: 'bg-blue-50 text-blue-700 ring-blue-200' },
  past_due: { text: 'Pago pendiente', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  canceled: { text: 'Cancelado', color: 'bg-red-50 text-red-700 ring-red-200' },
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SubscriptionPage() {
  const { activeProfile, profiles } = useProfile()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [consolidated, setConsolidated] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const storeId = activeProfile?.store_id

  useEffect(() => {
    if (!activeProfile) { setLoading(false); return }

    const loadData = async () => {
      try {
        const user = await api.me()
        // Load current profile's subscription
        if (storeId) {
          try {
            const s = await api.getSubscriptionLimits(storeId)
            if (s.active) {
              const fullSub = await fetch(`/api/subscriptions/${storeId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              }).then(r => r.ok ? r.json() : null)
              setSub(fullSub)
            }
          } catch {}
        }

        // Load consolidated billing for all profiles
        if (profiles.length > 0 && user.id) {
          const storeIds = profiles.map(p => p.store_id).filter(Boolean) as string[]
          if (storeIds.length > 0) {
            try {
              const c = await api.getConsolidatedBilling(user.id, storeIds)
              setConsolidated(c)
            } catch {}
          }
        }
      } catch {}
      setLoading(false)
    }
    loadData()
  }, [activeProfile, profiles, storeId])

  async function handleSubscribe(plan: string) {
    if (!storeId) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ restaurantId: storeId, plan, trialDays: 14 }),
      })
      if (res.ok) setSub(await res.json())
    } catch {}
    setUpgrading(false)
  }

  async function handleCancel() {
    if (!sub) return
    setCanceling(true)
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (res.ok) setSub(await res.json())
    } catch {}
    setCanceling(false)
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>

  if (!activeProfile) {
    return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"><p className="text-amber-700 text-sm">No hay perfil activo.</p></div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Suscripción</h1>
        <p className="text-slate-500 text-sm mt-1">Plan de <span className="font-medium text-slate-700">{activeProfile.display_name}</span></p>
      </div>

      {/* Current profile subscription */}
      {sub && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Plan actual — {activeProfile.display_name}</h2>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${statusLabel[sub.status]?.color || 'bg-slate-100 text-slate-600'}`}>
              {statusLabel[sub.status]?.text || sub.status}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500">Plan</p>
              <p className="font-bold text-slate-900 capitalize">{sub.plan}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Precio</p>
              <p className="font-bold text-slate-900">USD ${sub.price_usd_cents / 100}/mes</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pedidos usados</p>
              <p className="font-bold text-slate-900">{sub.order_count} / {sub.order_limit === -1 ? 'Ilimitados' : sub.order_limit}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Próxima renovación</p>
              <p className="font-bold text-slate-900">{formatDate(sub.current_period_end)}</p>
            </div>
          </div>
          {sub.trial_end && sub.status === 'trialing' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-sm text-blue-700">Período de prueba hasta {formatDate(sub.trial_end)}.</p>
            </div>
          )}
          {sub.status === 'active' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button onClick={handleCancel} disabled={canceling} className="text-sm text-red-500 hover:text-red-700 font-medium">
                {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Consolidated billing */}
      {profiles.length > 1 && consolidated && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Factura consolidada</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Total mensual por todos tus perfiles y módulos activos.</p>
          {consolidated.invoiceLines?.length > 0 ? (
            <div className="space-y-2 mb-4">
              {consolidated.invoiceLines.map((line: any, i: number) => {
                const profile = profiles.find(p => p.store_id === line.profileId)
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm text-slate-900">{line.name}</p>
                      <p className="text-xs text-slate-400">{profile?.display_name || line.profileId}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">USD ${(line.amountUsdCents / 100).toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-4">No hay suscripciones activas.</p>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <p className="text-sm font-bold text-slate-900">Total mensual</p>
            <p className="text-lg font-extrabold text-slate-900">USD ${consolidated.totalMonthlyUsd}</p>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <h2 className="font-semibold text-slate-900 mb-4">{sub ? 'Cambiar plan' : 'Elegí tu plan'}</h2>
      <p className="text-sm text-slate-500 mb-6">
        Cada perfil tiene su propio plan. 14 días de prueba gratis. Sin tarjeta.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrent = sub?.plan === plan.name
          return (
            <div key={plan.name} className={`bg-white rounded-2xl border-2 p-6 relative ${(plan as any).popular ? 'border-slate-900' : 'border-slate-200'} ${isCurrent ? 'ring-2 ring-indigo-500' : ''}`}>
              {(plan as any).popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full">Popular</span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.label}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-extrabold text-slate-900">{plan.price === 0 ? 'Gratis' : `$${plan.price}`}</span>
                {plan.price > 0 && <span className="text-sm text-slate-500">/mes USD</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-slate-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="text-center text-sm font-semibold text-indigo-600 py-2">Plan actual</div>
              ) : (
                <button onClick={() => handleSubscribe(plan.name)} disabled={upgrading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${(plan as any).popular ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                  {upgrading ? 'Procesando...' : sub ? 'Cambiar plan' : 'Comenzar prueba gratis'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
