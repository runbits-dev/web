"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/context/ProfileContext'
import { Check, Star, ArrowRight, X } from 'lucide-react'
import { API_BASE } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────────────────────────

type Tier = 'free' | 'starter' | 'growth' | 'business'
type Interval = 'month' | 'year'

type PlanPricing = {
  monthly: { amount: number; amount_cents: number; currency: string; lookup_key: string | null }
  yearly: { amount: number; amount_cents: number; currency: string; lookup_key: string | null; savings_pct: number }
}

type Plan = {
  tier: Tier
  name: string
  headline: string
  description: string
  pricing: PlanPricing
  limits: {
    staffSeats: number
    locations: number
    aiGenerationsMonthly: number
    verifyKycMonthly: number
  }
  modules: string[]
}

type PlansResponse = {
  currency: string
  intervals_available: Interval[]
  plans: Plan[]
  perRubro: {
    essentialsByType: Record<string, string[]>
    advancedByTypeStarter: Record<string, string[]>
  }
  addons: Array<{ id: string; name: string; monthlyPriceUsd: number; description: string }>
}

type MyModulesResponse = {
  tier: Tier
  business_type: string
  billing_interval: Interval
  modules: string[]
  limits: Plan['limits']
  addons: string[]
  restaurantId: string
}

const TIER_ORDER: Tier[] = ['free', 'starter', 'growth', 'business']

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatPrice(amount: number, interval: Interval): string {
  if (amount === 0) return 'Gratis'
  return interval === 'year' ? `$${amount}/año` : `$${amount}/mes`
}

// Friendly per-tier feature bullets — high-signal, NOT exhaustive. The full
// matrix lives in the comparison table at the bottom.
const TIER_HIGHLIGHTS: Record<Tier, string[]> = {
  free: [
    'MVP de tu rubro listo (catálogo, carrito, pedidos)',
    'Push notifications + estadísticas básicas',
    'Ratings de clientes',
    '1 usuario, 1 sucursal',
  ],
  starter: [
    'Todo lo de Free +',
    'Versiones avanzadas de tu rubro',
    'Dominio propio + sin "Powered by Runbits"',
    'WhatsApp para clientes',
    '3 usuarios staff, cupones y promos ilimitados',
  ],
  growth: [
    'Todo lo de Starter +',
    'Multi-sucursal (hasta 5)',
    'Marketing automation + reportes pro',
    'IA básica (10 generaciones/mes)',
    'Multi-rubro: vendé productos Y servicios',
    '10 usuarios staff',
  ],
  business: [
    'Todo lo de Growth +',
    'Sucursales y staff ilimitados',
    'API + Webhooks + SSO',
    'B2B mode + multi-moneda + multi-idioma',
    'White-label completo + audit log',
    'IA avanzada (50/mes) + KYC (50/mes)',
    'Account manager dedicado',
  ],
}

const TIER_BADGES: Partial<Record<Tier, string>> = {
  growth: 'Más popular',
}

function compareTiers(a: Tier, b: Tier): number {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b)
}

function actionLabelForTier(target: Tier, current: Tier | null): 'current' | 'choose' | 'upgrade' | 'downgrade' {
  if (current == null) return 'choose'
  if (target === current) return 'current'
  return compareTiers(target, current) > 0 ? 'upgrade' : 'downgrade'
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { activeProfile } = useProfile()
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [me, setMe] = useState<MyModulesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [interval, setInterval] = useState<Interval>('year')
  const [submitting, setSubmitting] = useState<Tier | null>(null)
  const [confirm, setConfirm] = useState<{ tier: Tier; action: 'upgrade' | 'downgrade' } | null>(null)
  const [showCompare, setShowCompare] = useState(false)

  const restaurantId = activeProfile?.store_id ?? null

  // ── Fetch plans (public) + my modules (auth, requires restaurantId) ─────
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const plansPromise = fetch(`${API_BASE}/api/billing/plans`).then(r => {
          if (!r.ok) throw new Error('plans')
          return r.json() as Promise<PlansResponse>
        })

        const mePromise: Promise<MyModulesResponse | null> = restaurantId
          ? fetch(`${API_BASE}/api/billing/me/modules?restaurantId=${restaurantId}`, {
              headers: { ...authHeaders() },
            }).then(r => (r.ok ? (r.json() as Promise<MyModulesResponse>) : null))
          : Promise.resolve(null)

        const [plansRes, meRes] = await Promise.all([plansPromise, mePromise])
        if (cancelled) return
        setPlans(plansRes.plans)
        setMe(meRes)
        // Sync the toggle to the user's current billing interval if known.
        if (meRes?.billing_interval) setInterval(meRes.billing_interval)
      } catch {
        if (!cancelled) setError('No pudimos cargar los planes. Reintentá en unos segundos.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [restaurantId])

  const currentTier: Tier | null = me?.tier ?? null

  // ── Subscribe / upgrade / downgrade actions ─────────────────────────────
  async function handleSubscribe(tier: Tier) {
    if (!restaurantId) {
      alert('Necesitás tener un perfil activo para suscribirte.')
      return
    }
    setSubmitting(tier)
    try {
      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ restaurantId, plan: tier, interval, trialDays: 14 }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      // Backend may return either a Stripe Checkout URL OR the created
      // subscription row directly. Handle both.
      if (data?.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        // Direct-create flow: refresh the page so the new "current plan" shows.
        window.location.reload()
      }
    } catch (e: any) {
      alert(e?.message || 'No pudimos procesar la suscripción.')
    } finally {
      setSubmitting(null)
    }
  }

  async function handleChange(tier: Tier, action: 'upgrade' | 'downgrade') {
    // We need the subscription ID to call upgrade/downgrade. The me endpoint
    // doesn't expose it, so we fetch it from /subscriptions/:restaurantId.
    if (!restaurantId) return
    setSubmitting(tier)
    try {
      const subRes = await fetch(`${API_BASE}/api/subscriptions/${restaurantId}`, {
        headers: { ...authHeaders() },
      })
      if (!subRes.ok) {
        // No active subscription on file → fall back to creating a new one.
        await handleSubscribe(tier)
        return
      }
      const sub = await subRes.json()
      const subId = sub?.id
      if (!subId) throw new Error('No encontramos tu suscripción activa.')

      const res = await fetch(`${API_BASE}/api/subscriptions/${subId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ tier, plan: tier, interval }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      window.location.reload()
    } catch (e: any) {
      alert(e?.message || 'No pudimos cambiar tu plan.')
    } finally {
      setSubmitting(null)
      setConfirm(null)
    }
  }

  function onTierClick(tier: Tier) {
    const action = actionLabelForTier(tier, currentTier)
    if (action === 'current') return
    if (action === 'choose') {
      void handleSubscribe(tier)
      return
    }
    // Upgrade or downgrade — confirm first.
    setConfirm({ tier, action })
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return <SubscriptionSkeleton />

  if (error || !plans) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm mb-3">{error ?? 'No pudimos cargar los planes.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-semibold text-amber-800 underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const businessTypeLabel = me?.business_type
    ? me.business_type.charAt(0).toUpperCase() + me.business_type.slice(1)
    : 'No definido'

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Suscripción</h1>
        <p className="text-slate-500 text-sm mt-1">
          Elegí el plan que mejor se adapte a tu negocio. Cambialo cuando quieras.
        </p>
      </div>

      {/* ── Current plan summary ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Tu plan actual</p>
            <p className="text-lg font-bold text-slate-900 capitalize">
              {currentTier ?? 'Free'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 font-semibold">
              Tipo: {businessTypeLabel}
            </div>
            <div className="text-xs text-slate-500">
              Módulos activos: <span className="font-semibold text-slate-700">{me?.modules.length ?? 0}</span>
            </div>
            <Link
              href="/dashboard/modules"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Ver módulos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Interval toggle ────────────────────────────────────────── */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center bg-white rounded-xl p-1 ring-1 ring-slate-200">
          <button
            onClick={() => setInterval('month')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              interval === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              interval === 'year' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anual
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              interval === 'year' ? 'bg-emerald-400 text-emerald-900' : 'bg-emerald-100 text-emerald-700'
            }`}>
              2 meses gratis
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {plans.map(plan => {
          const action = actionLabelForTier(plan.tier, currentTier)
          const price = interval === 'year' ? plan.pricing.yearly : plan.pricing.monthly
          const savings = interval === 'year' ? plan.pricing.yearly.savings_pct : 0
          const isCurrent = action === 'current'
          const isPopular = TIER_BADGES[plan.tier] != null

          return (
            <div
              key={plan.tier}
              className={`bg-white rounded-2xl border-2 p-6 relative flex flex-col ${
                isPopular ? 'border-slate-900' : 'border-slate-200'
              } ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {TIER_BADGES[plan.tier]}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Tu plan actual
                </span>
              )}

              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{plan.headline}</p>

              <div className="mt-4 mb-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatPrice(price.amount, interval)}
                </span>
                {interval === 'year' && plan.pricing.yearly.amount > 0 && savings > 0 && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    Ahorrás {savings}% vs. mensual
                  </p>
                )}
                {interval === 'month' && plan.pricing.monthly.amount > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    o ${plan.pricing.yearly.amount}/año (-{plan.pricing.yearly.savings_pct}%)
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">{plan.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {TIER_HIGHLIGHTS[plan.tier].map(f => (
                  <li key={f} className="text-sm text-slate-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onTierClick(plan.tier)}
                disabled={isCurrent || submitting != null}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 text-blue-700 cursor-default'
                    : isPopular
                      ? 'bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50'
                }`}
              >
                {submitting === plan.tier
                  ? 'Procesando…'
                  : isCurrent
                    ? 'Plan actual'
                    : action === 'upgrade'
                      ? 'Upgrade'
                      : action === 'downgrade'
                        ? 'Downgrade'
                        : 'Elegir plan'}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Detailed comparison table ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowCompare(v => !v)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div>
            <h2 className="font-semibold text-slate-900">Comparación detallada</h2>
            <p className="text-xs text-slate-500">Límites y módulos por tier</p>
          </div>
          <span className="text-sm font-semibold text-blue-600">
            {showCompare ? 'Ocultar' : 'Expandir'}
          </span>
        </button>

        {showCompare && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Característica</th>
                  {plans.map(p => (
                    <th key={p.tier} className="text-left px-4 py-3 font-semibold capitalize">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <ComparisonRow
                  label="Usuarios staff"
                  values={plans.map(p => (p.limits.staffSeats === -1 ? 'Ilimitados' : String(p.limits.staffSeats)))}
                />
                <ComparisonRow
                  label="Sucursales"
                  values={plans.map(p => (p.limits.locations === -1 ? 'Ilimitadas' : String(p.limits.locations)))}
                />
                <ComparisonRow
                  label="Generaciones IA / mes"
                  values={plans.map(p =>
                    p.limits.aiGenerationsMonthly === -1
                      ? 'Ilimitadas'
                      : p.limits.aiGenerationsMonthly === 0
                        ? '—'
                        : String(p.limits.aiGenerationsMonthly)
                  )}
                />
                <ComparisonRow
                  label="Verify KYC / mes"
                  values={plans.map(p => (p.limits.verifyKycMonthly === 0 ? '—' : String(p.limits.verifyKycMonthly)))}
                />
                <ComparisonRow
                  label="Módulos transversales incluidos"
                  values={plans.map(p => `${p.modules.length} módulos`)}
                />
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirm modal ──────────────────────────────────────────── */}
      {confirm && (
        <ConfirmModal
          action={confirm.action}
          tier={confirm.tier}
          interval={interval}
          onConfirm={() => handleChange(confirm.tier, confirm.action)}
          onCancel={() => setConfirm(null)}
          submitting={submitting === confirm.tier}
        />
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ComparisonRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="px-6 py-3 text-slate-700 font-medium">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-4 py-3 text-slate-600">{v}</td>
      ))}
    </tr>
  )
}

function ConfirmModal({
  action, tier, interval, onConfirm, onCancel, submitting,
}: {
  action: 'upgrade' | 'downgrade'
  tier: Tier
  interval: Interval
  onConfirm: () => void
  onCancel: () => void
  submitting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onCancel}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-slate-900 mb-2 capitalize">
          {action === 'upgrade' ? 'Upgrade' : 'Downgrade'} a {tier}
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          {action === 'upgrade'
            ? 'Vamos a actualizar tu plan ahora mismo. El cargo se prorratea automáticamente.'
            : 'Tu plan se reducirá al final del período actual. Vas a perder los módulos exclusivos del plan actual.'}
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Facturación: <span className="font-semibold text-slate-700">{interval === 'year' ? 'Anual' : 'Mensual'}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? 'Procesando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubscriptionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-40 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-72 bg-slate-200 rounded mb-8" />
      <div className="h-20 bg-slate-100 rounded-2xl mb-6" />
      <div className="h-10 w-64 bg-slate-100 rounded-xl mx-auto mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="h-5 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-8 w-24 bg-slate-200 rounded mb-4" />
            <div className="space-y-2 mb-6">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-5/6 bg-slate-100 rounded" />
              <div className="h-3 w-4/6 bg-slate-100 rounded" />
              <div className="h-3 w-5/6 bg-slate-100 rounded" />
            </div>
            <div className="h-9 w-full bg-slate-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
