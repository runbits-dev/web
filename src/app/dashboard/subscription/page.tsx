"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Subscription = {
  id: string
  plan: string
  status: string
  current_period_start: number
  current_period_end: number
  order_count: number
  order_limit: number
  price_usd_cents: number
  trial_end: number | null
  grace_period_end: number | null
  cancel_at_period_end: number
}

const PLANS = [
  {
    name: 'starter',
    label: 'Starter',
    price: 49,
    orders: 500,
    features: ['Panel de gestión', 'Menú digital', 'QR de verificación', 'Soporte por email'],
  },
  {
    name: 'growth',
    label: 'Growth',
    price: 129,
    orders: 2500,
    features: ['Todo de Starter', 'Dominio propio', 'Analytics avanzado', 'Soporte prioritario'],
    popular: true,
  },
  {
    name: 'pro',
    label: 'Pro',
    price: 299,
    orders: 8000,
    features: ['Todo de Growth', 'Multi-sucursal', 'API acceso', 'Integraciones', 'Onboarding dedicado'],
  },
]

const statusLabel: Record<string, { text: string; color: string }> = {
  active: { text: 'Activo', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  trialing: { text: 'Período de prueba', color: 'bg-blue-50 text-blue-700 ring-blue-200' },
  past_due: { text: 'Pago pendiente', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  canceled: { text: 'Cancelado', color: 'bg-red-50 text-red-700 ring-red-200' },
  grace_period: { text: 'Período de gracia', color: 'bg-orange-50 text-orange-700 ring-orange-200' },
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    api.me().then(u => {
      if (u.restaurant_id) {
        setRestaurantId(u.restaurant_id)
        fetch(`/api/subscriptions/${u.restaurant_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(setSub)
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function handleSubscribe(plan: string) {
    if (!restaurantId) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ restaurantId, plan, trialDays: 14 }),
      })
      if (res.ok) {
        const data = await res.json()
        setSub(data)
      }
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
      if (res.ok) {
        const data = await res.json()
        setSub(data)
      }
    } catch {}
    setCanceling(false)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
    )
  }

  if (!restaurantId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm">Tu cuenta no tiene un restaurante asociado aún.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Suscripción</h1>
        <p className="text-slate-500 text-sm mt-1">Gestioná tu plan y facturación</p>
      </div>

      {/* Current subscription */}
      {sub && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Plan actual</h2>
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
              <p className="font-bold text-slate-900">
                {sub.order_count} / {sub.order_limit === -1 ? '∞' : sub.order_limit}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Próxima renovación</p>
              <p className="font-bold text-slate-900">{formatDate(sub.current_period_end)}</p>
            </div>
          </div>
          {sub.trial_end && sub.status === 'trialing' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-sm text-blue-700">
                Período de prueba hasta {formatDate(sub.trial_end)}. No se te cobrará hasta esa fecha.
              </p>
            </div>
          )}
          {/* Usage bar */}
          {sub.order_limit > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Uso de pedidos</span>
                <span>{Math.round((sub.order_count / sub.order_limit) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    sub.order_count / sub.order_limit > 0.9 ? 'bg-red-500' :
                    sub.order_count / sub.order_limit > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (sub.order_count / sub.order_limit) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {sub.status === 'active' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Plans grid */}
      <h2 className="font-semibold text-slate-900 mb-4">{sub ? 'Cambiar plan' : 'Elegí tu plan'}</h2>
      <p className="text-sm text-slate-500 mb-6">
        Tarifa fija mensual. Sin comisiones por venta. 14 días de prueba gratis.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = sub?.plan === plan.name
          return (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 p-6 relative ${
                plan.popular ? 'border-slate-900' : 'border-slate-200'
              } ${isCurrent ? 'ring-2 ring-emerald-500' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.label}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-extrabold text-slate-900">${plan.price}</span>
                <span className="text-sm text-slate-500">/mes USD</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Hasta {plan.orders.toLocaleString()} pedidos/mes</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="text-center text-sm font-semibold text-emerald-600 py-2">Plan actual</div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={upgrading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-slate-900 text-white hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
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
