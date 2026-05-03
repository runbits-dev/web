"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/context/ProfileContext'
import { Check, Lock, ArrowRight, Plus } from 'lucide-react'
import { API_BASE } from '@/lib/api'

// ─── Types (mirror billing-service responses) ───────────────────────────────

type Tier = 'free' | 'starter' | 'growth' | 'business'
type Interval = 'month' | 'year'

type PlanLimits = {
  staffSeats: number
  locations: number
  aiGenerationsMonthly: number
  verifyKycMonthly: number
}

type Plan = {
  tier: Tier
  name: string
  headline: string
  description: string
  pricing: {
    monthly: { amount: number }
    yearly: { amount: number; savings_pct: number }
  }
  limits: PlanLimits
  modules: string[]
}

type PlansResponse = {
  plans: Plan[]
  perRubro: {
    essentialsByType: Record<string, string[]>
    advancedByTypeStarter: Record<string, string[]>
  }
  addons: AddonInfo[]
}

type AddonInfo = {
  id: string
  name: string
  monthlyPriceUsd: number
  description: string
  unlocksModules: string[]
}

type MyModulesResponse = {
  tier: Tier
  business_type: string
  billing_interval: Interval
  modules: string[]
  limits: PlanLimits
  addons: string[]
  restaurantId: string
}

const TIER_ORDER: Tier[] = ['free', 'starter', 'growth', 'business']

// ─── Module catalog (labels + categories) ───────────────────────────────────
//
// The backend exposes module identifiers as raw strings. We keep a small local
// dictionary so we can render friendly labels and categorize each one. The
// "category" of a module depends on context (e.g. `multi_staff_calendar` is an
// "essential" for appointment but doesn't exist for food). We therefore
// resolve the category dynamically using the matrices the backend ships in
// /billing/plans (`perRubro`).

const MODULE_LABELS: Record<string, string> = {
  // Common
  push: 'Push notifications',
  stats_basic: 'Estadísticas básicas',
  ratings: 'Ratings de clientes',
  // Food
  catalog: 'Catálogo',
  cart: 'Carrito',
  orders: 'Pedidos',
  delivery_zones_basic: 'Zonas de delivery',
  kitchen_display: 'Pantalla de cocina',
  eta_tracking: 'Tracking ETA',
  multi_kitchen: 'Multi-cocina',
  scheduled_orders: 'Pedidos programados',
  // Goods
  shipping_basic: 'Envíos básicos',
  stock_simple: 'Stock simple',
  shipping_advanced: 'Envíos avanzados',
  multi_warehouse: 'Multi-depósito',
  low_stock_alerts: 'Alertas de stock bajo',
  variants_advanced: 'Variantes avanzadas',
  // Appointment
  calendar: 'Calendario',
  booking_basic: 'Booking básico',
  reminders: 'Recordatorios',
  multi_staff_calendar: 'Multi-staff calendar',
  google_cal_sync: 'Sync Google Calendar',
  sms_reminders: 'Recordatorios SMS',
  dynamic_slots: 'Slots dinámicos',
  // Task
  quotes_basic: 'Presupuestos básicos',
  chat: 'Chat',
  milestones: 'Milestones',
  quote_versions: 'Versiones de presupuestos',
  contracts: 'Contratos',
  // Realtime
  escrow_basic: 'Escrow básico',
  ratings_bidirectional: 'Ratings bidireccionales',
  deposits: 'Depósitos',
  cancellation_policy: 'Política de cancelación',
  // Starter (transversal)
  custom_domain: 'Dominio propio',
  whatsapp_clients: 'WhatsApp para clientes',
  staff_3: '3 usuarios staff',
  reports_improved: 'Reportes mejorados',
  coupons_unlimited: 'Cupones ilimitados',
  promotions_unlimited: 'Promos ilimitadas',
  no_branding: 'Sin "Powered by Runbits"',
  // Growth (transversal)
  multi_location_5: 'Multi-sucursal (5)',
  staff_10: '10 usuarios staff',
  marketing_auto: 'Marketing automation',
  reports_pro: 'Reportes pro',
  ai_basic: 'IA básica (10/mes)',
  push_campaigns_unlimited: 'Campañas push ilimitadas',
  multi_business_type: 'Multi-rubro simultáneo',
  // Business (transversal)
  api: 'API REST',
  webhooks: 'Webhooks',
  b2b_mode: 'B2B mode',
  custom_reports: 'Reportes custom',
  multi_currency: 'Multi-moneda',
  multi_language: 'Multi-idioma',
  white_label: 'White-label completo',
  sso: 'SSO',
  audit_log: 'Audit log',
  ai_advanced: 'IA avanzada (50/mes)',
  verify_kyc_50: 'Verify KYC (50/mes)',
  staff_unlimited: 'Staff ilimitado',
  multi_location_unlimited: 'Sucursales ilimitadas',
  // Addon-unlockable
  mobile_app_branded: 'App móvil branded',
  verify_kyc: 'Verify KYC',
  pos_sync: 'POS sync',
  subscriptions_recurring: 'Suscripciones recurrentes',
  loyalty_whitelabel: 'Loyalty white-label',
  logistics_managed: 'Logística managed',
  electronic_invoicing: 'Facturación electrónica',
  whatsapp_staff: 'WhatsApp para staff',
  accounting_integrations: 'Integraciones contables',
}

function moduleLabel(id: string): string {
  return MODULE_LABELS[id] ?? id
}

type Category =
  | { kind: 'essential' }
  | { kind: 'advanced'; tier: Tier }
  | { kind: 'transversal'; tier: Tier }
  | { kind: 'addon' }

function categoryLabel(cat: Category): string {
  switch (cat.kind) {
    case 'essential':   return 'esencial'
    case 'advanced':    return `avanzado ${cat.tier.charAt(0).toUpperCase() + cat.tier.slice(1)}`
    case 'transversal': return cat.tier === 'free' ? 'transversal' : `transversal ${cat.tier.charAt(0).toUpperCase() + cat.tier.slice(1)}`
    case 'addon':       return 'addon'
  }
}

/**
 * Given the plans response and a business_type, build a function that maps a
 * module ID to its categorization for THIS user. We do this dynamically rather
 * than hardcoding because the matrices are owned by the backend.
 */
function buildCategorizer(plans: PlansResponse | null, businessType: string): (id: string) => Category {
  if (!plans) return () => ({ kind: 'addon' })

  const essentials = new Set(plans.perRubro.essentialsByType[businessType] ?? [])
  const advancedStarter = new Set(plans.perRubro.advancedByTypeStarter[businessType] ?? [])

  // Map each transversal module to the tier that introduces it (the first one).
  const transversalTier = new Map<string, Tier>()
  for (const plan of plans.plans) {
    for (const m of plan.modules) {
      if (!transversalTier.has(m)) transversalTier.set(m, plan.tier)
    }
  }

  // Modules unlocked only by addons.
  const addonModules = new Set<string>()
  for (const a of plans.addons) {
    for (const m of a.unlocksModules) addonModules.add(m)
  }

  return (id: string): Category => {
    if (essentials.has(id))      return { kind: 'essential' }
    if (advancedStarter.has(id)) return { kind: 'advanced', tier: 'starter' }
    const t = transversalTier.get(id)
    if (t) return { kind: 'transversal', tier: t }
    if (addonModules.has(id))    return { kind: 'addon' }
    return { kind: 'addon' }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function tierIndex(t: Tier): number {
  return TIER_ORDER.indexOf(t)
}

/**
 * For a given target tier (above the current), compute which modules the user
 * would gain by upgrading. We approximate this as:
 *   (essentials + advancedStarter + transversal modules of all tiers <= target)
 *   minus the user's currently active modules.
 *
 * Note: rubro-essentials and rubro-advanced are independent of tier order
 * (essentials live in Free, advanced unlock at Starter), so we always include
 * them when the target tier is >= the tier they unlock at.
 */
function modulesUnlockedByTier(
  targetTier: Tier,
  plans: PlansResponse,
  businessType: string,
  activeModules: Set<string>
): string[] {
  const targetIdx = tierIndex(targetTier)
  const result = new Set<string>()

  // Essentials are always present from Free; if the user is on Free they
  // already have them — no point listing.
  for (const m of plans.perRubro.essentialsByType[businessType] ?? []) result.add(m)

  // Advanced rubro modules unlock at Starter and are inherited upward.
  if (targetIdx >= tierIndex('starter')) {
    for (const m of plans.perRubro.advancedByTypeStarter[businessType] ?? []) result.add(m)
  }

  // Transversal modules: union of all tiers <= target.
  for (const plan of plans.plans) {
    if (tierIndex(plan.tier) <= targetIdx) {
      for (const m of plan.modules) result.add(m)
    }
  }

  // Subtract what the user already has.
  for (const m of activeModules) result.delete(m)
  return Array.from(result)
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ModulesPage() {
  const { activeProfile } = useProfile()
  const [plans, setPlans] = useState<PlansResponse | null>(null)
  const [me, setMe] = useState<MyModulesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const restaurantId = activeProfile?.store_id ?? null

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
        setPlans(plansRes)
        setMe(meRes)
      } catch {
        if (!cancelled) setError('No pudimos cargar tu plan, reintentá en unos segundos.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [restaurantId])

  const businessType = me?.business_type ?? activeProfile?.business_type ?? 'goods'
  const currentTier: Tier = me?.tier ?? 'free'
  const activeModules = useMemo(() => new Set(me?.modules ?? []), [me])
  const categorize = useMemo(() => buildCategorizer(plans, businessType), [plans, businessType])

  // Tiers strictly above the user's current one (sorted in tier order).
  const upgradeTiers: Tier[] = useMemo(() => {
    const idx = tierIndex(currentTier)
    return TIER_ORDER.slice(idx + 1)
  }, [currentTier])

  if (loading) return <ModulesSkeleton />

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-semibold text-amber-800 underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!plans) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-slate-500 text-sm">No hay datos de planes disponibles.</p>
      </div>
    )
  }

  const businessTypeLabel = businessType.charAt(0).toUpperCase() + businessType.slice(1)
  const planLabel = currentTier.charAt(0).toUpperCase() + currentTier.slice(1)

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Módulos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tu plan: <span className="font-semibold text-slate-700">{planLabel}</span>
          {' • '}
          Tipo de negocio: <span className="font-semibold text-slate-700">{businessTypeLabel}</span>
        </p>
      </div>

      {/* ── Active modules ─────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">
          Módulos activos <span className="text-slate-400 font-normal">({activeModules.size})</span>
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Todo lo que tu negocio puede hacer hoy con el plan {planLabel}.
        </p>
        {activeModules.size === 0 ? (
          <p className="text-sm text-slate-400">No tenés módulos activos todavía.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            {Array.from(activeModules).map(id => {
              const cat = categorize(id)
              return (
                <li key={id} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{moduleLabel(id)}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold whitespace-nowrap">
                    {categoryLabel(cat)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Upgrade-unlockable modules ─────────────────────────────── */}
      {upgradeTiers.map(t => {
        const plan = plans.plans.find(p => p.tier === t)
        if (!plan) return null
        const newModules = modulesUnlockedByTier(t, plans, businessType, activeModules)
        if (newModules.length === 0) return null
        return (
          <section key={t} className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Desbloqueá con <span className="capitalize">{plan.name}</span>{' '}
                  <span className="text-slate-400 font-normal text-sm">
                    (${plan.pricing.monthly.amount}/mes)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{plan.headline}</p>
              </div>
              <Link
                href="/dashboard/subscription"
                className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 inline-flex items-center gap-1 whitespace-nowrap"
              >
                Upgrade <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mt-3">
              {newModules.map(id => (
                <li key={id} className="flex items-center gap-2 py-1.5">
                  <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-sm text-slate-600">{moduleLabel(id)}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {/* ── Addons ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Addons opcionales</h2>
        <p className="text-xs text-slate-500 mb-4">
          Funcionalidades opt-in disponibles en cualquier tier.
        </p>
        <ul className="space-y-3">
          {plans.addons.map(a => {
            const isActive = me?.addons.includes(a.id) ?? false
            return (
              <li key={a.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-start gap-3 min-w-0">
                  <Plus className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                    ${a.monthlyPriceUsd}/mo
                  </span>
                  {isActive ? (
                    <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Activo
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/subscription#addons"
                      className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700"
                    >
                      Activar
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ModulesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-72 bg-slate-200 rounded mb-6" />
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="h-5 w-44 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-64 bg-slate-100 rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            {[0, 1, 2, 3, 4, 5].map(j => (
              <div key={j} className="h-4 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
