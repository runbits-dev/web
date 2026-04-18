"use client"

import { useState, useEffect, useCallback } from 'react'

const ROADMAP_API = 'https://runbits-roadmap-api.lucas-i-carrizo.workers.dev'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function fetchState(): Promise<Record<string, boolean>> {
  const token = getToken()
  if (!token) return {}
  try {
    const res = await fetch(`${ROADMAP_API}/state`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return {}
    return await res.json()
  } catch { return {} }
}

async function saveState(state: Record<string, boolean>): Promise<void> {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`${ROADMAP_API}/state`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
  } catch {}
}

type Task = { id: string; label: string; repo: string }
type Sprint = { id: string; title: string; dates: string; color: string; tasks: Task[] }

const sprints: Sprint[] = [
  {
    id: 's1', title: 'Sprint 1 — Arreglar lo roto', dates: '18–20 abr', color: '#ef4444',
    tasks: [
      { id: '1.1', label: 'Redesployar restaurant-service', repo: 'restaurant-service' },
      { id: '1.2', label: 'Redesployar order-service', repo: 'order-service' },
      { id: '1.3', label: 'Redesployar notification-service', repo: 'notification-service' },
      { id: '1.4', label: 'Fix gateway path rewriting (strip /api)', repo: 'gateway-service' },
      { id: '1.5', label: 'Fix wrangler.toml domains (runbit→runbits)', repo: 'gateway/order/billing' },
      { id: '1.6', label: 'Alinear rol store_owner → restaurant_owner', repo: 'web' },
      { id: '1.7', label: 'Arreglar runbits.app (DNS + deploy)', repo: 'mobile' },
      { id: '1.8', label: 'Smoke test end-to-end completo', repo: 'todos' },
    ],
  },
  {
    id: 's2', title: 'Sprint 2 — Pagos', dates: '21–24 abr', color: '#3b82f6',
    tasks: [
      { id: '2.1', label: '⏳ Configurar STRIPE_SECRET_KEY + webhook secret en Worker', repo: 'billing-service' },
      { id: '2.2', label: '⏳ Configurar MP_ACCESS_TOKEN + webhook secret en Worker', repo: 'billing-service' },
      { id: '2.3', label: '✅ Página de suscripción en dashboard', repo: 'web' },
      { id: '2.4', label: '✅ Tablas subscriptions + afip_invoices en D1', repo: 'billing-service' },
      { id: '2.5', label: '✅ Código Stripe integration (checkout, webhooks, dunning)', repo: 'billing-service' },
      { id: '2.6', label: '✅ Código MercadoPago webhook handler', repo: 'billing-service' },
      { id: '2.7', label: '✅ AFIP/ARCA facturación electrónica', repo: 'billing-service' },
    ],
  },
  {
    id: 's3', title: 'Sprint 3 — Features Core', dates: '25–27 abr', color: '#a855f7',
    tasks: [
      { id: '3.1', label: '✅ Menu CRUD en dashboard (create/edit/delete/toggle)', repo: 'web + restaurant' },
      { id: '3.2', label: '⏳ Push notifications FCM', repo: 'notification-service' },
      { id: '3.3', label: '✅ Historial de pedidos (tabla con estados)', repo: 'web + order' },
      { id: '3.4', label: '✅ Stats reales (pedidos hoy/sem/mes, revenue, ticket)', repo: 'web + restaurant' },
      { id: '3.5', label: 'Tracking en tiempo real con ETA dinámico', repo: 'delivery + web' },
      { id: '3.6', label: 'Integración WhatsApp para recibir pedidos', repo: 'gateway + web' },
    ],
  },
  {
    id: 's4', title: 'Sprint 4 — UX / Growth', dates: '28–30 abr', color: '#06b6d4',
    tasks: [
      { id: '4.1', label: 'Calificaciones y reseñas post-entrega', repo: 'social-service' },
      { id: '4.2', label: 'Cupones y promociones', repo: 'billing + web' },
      { id: '4.3', label: 'Favoritos (comercios + items)', repo: 'social + web' },
      { id: '4.4', label: 'Chat comercio-usuario en orden activa', repo: 'social + web' },
      { id: '4.5', label: 'Fotos evidencia de entrega (R2)', repo: 'delivery + mobile' },
    ],
  },
]

const services = [
  { name: 'Landing', url: 'runbits.io', up: true },
  { name: 'Dashboard', url: 'runbits.io/dashboard', up: true },
  { name: 'Gateway', url: 'api.runbits.dev', up: true },
  { name: 'Auth', url: 'auth.runbits.dev', up: true },
  { name: 'Restaurant', url: 'restaurants.runbits.dev', up: true },
  { name: 'Order', url: 'orders.runbits.dev', up: true },
  { name: 'Delivery', url: 'delivery.runbits.dev', up: true },
  { name: 'Billing', url: 'billing.runbits.dev', up: true },
  { name: 'Social', url: 'social.runbits.dev', up: true },
  { name: 'Notification', url: 'queue consumer', up: true },
  { name: 'Mobile Web', url: 'runbits.app → runbits.io', up: true },
]

const log: { date: string; text: string }[] = [
  { date: '2026-04-18', text: 'Página de suscripción para comercios creada (/dashboard/subscription) con 3 planes y trial gratis.' },
  { date: '2026-04-18', text: 'Tablas subscriptions + afip_invoices creadas en D1 production. Billing-service listo para Stripe/MP.' },
  { date: '2026-04-18', text: 'Análisis competitivo: 17 plataformas analizadas, features consolidados en 4 fases del roadmap.' },
  { date: '2026-04-18', text: 'Roadmap persistido en Cloudflare KV (no más localStorage).' },
  { date: '2026-04-18', text: 'SPRINT 1 COMPLETO: 10/10 servicios UP. restaurant-service fix column bug. runbits.app redirect 301. Gateway redeployado.' },
  { date: '2026-04-18', text: 'Roadmap dashboard creado y deployado dentro de runbits.io/dashboard/roadmap.' },
  { date: '2026-03-18', text: 'Secrets regenerados en todos los CF Workers. Landing E2E tests verde.' },
  { date: '2026-03-17', text: 'Migración app mobile a repo independiente. EAS Build configurado.' },
  { date: '2026-03-17', text: 'Web dashboard deployado en CF Pages (runbits.io). Convención de dominios establecida.' },
]

export default function RoadmapPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchState().then(state => {
      setChecked(state)
      setLoaded(true)
    })
  }, [])

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      saveState(next)
      return next
    })
  }, [])

  const totalTasks = sprints.reduce((s, sp) => s + sp.tasks.length, 0)
  const doneTasks = sprints.reduce((s, sp) => s + sp.tasks.filter(t => checked[t.id]).length, 0)
  const upServices = services.filter(s => s.up).length
  const downServices = services.filter(s => !s.up).length

  const deadline = new Date('2026-04-30')
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roadmap</h1>
        <p className="text-sm text-slate-500 mt-1">Target: primer nivel productivo — 30 de abril 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-emerald-600 tabular-nums">{upServices}</div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Servicios OK</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-red-500 tabular-nums">{downServices}</div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Servicios caídos</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-blue-600 tabular-nums">{doneTasks}/{totalTasks}</div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Tasks completadas</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-amber-500 tabular-nums">{daysLeft}</div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Días restantes</div>
        </div>
      </div>

      {/* Services */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Estado de servicios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {services.map(s => (
            <div key={s.name} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.up ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{s.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{s.url}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline bar */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Timeline — Abril 2026</h2>
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          {sprints.map(sp => {
            const done = sp.tasks.filter(t => checked[t.id]).length
            const pct = Math.round((done / sp.tasks.length) * 100)
            return (
              <div key={sp.id} className="flex-1 bg-white border-r border-slate-200 last:border-r-0 px-3 py-3 text-center relative">
                <div className="text-[11px] font-bold" style={{ color: sp.color }}>
                  {sp.title.split('—')[0]?.trim()}
                </div>
                <div className="text-[10px] text-slate-400">{sp.dates}</div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: sp.color }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sprint cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sprints.map(sp => {
          const done = sp.tasks.filter(t => checked[t.id]).length
          const pct = Math.round((done / sp.tasks.length) * 100)
          return (
            <div key={sp.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: sp.color }}>{sp.title}</h3>
                <span className="text-xs text-slate-400">{sp.dates}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: sp.color }} />
              </div>
              <div className="space-y-1">
                {sp.tasks.map(t => (
                  <label key={t.id} className={`flex items-start gap-2.5 py-1.5 cursor-pointer group ${checked[t.id] ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!checked[t.id]}
                      onChange={() => toggle(t.id)}
                      className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <span className={`text-sm leading-snug ${checked[t.id] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {t.label}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded flex-shrink-0">
                      {t.repo}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bitácora */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Bitácora</h2>
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {log.map((entry, i) => (
            <div key={i} className="flex gap-4 px-5 py-3">
              <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap pt-0.5">{entry.date}</span>
              <span className="text-sm text-slate-600">{entry.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fases futuras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-pink-500 mb-3">Fase 2 — Marketplace</h3>
          <ul className="space-y-1.5 text-sm text-slate-500">
            <li>○ Modelo &quot;seller&quot; (extiende restaurant)</li>
            <li>○ Catálogo de productos con categorías</li>
            <li>○ Carrito multi-vendedor</li>
            <li>○ Envío con múltiples couriers</li>
            <li>○ Tracking de paquete con QR</li>
            <li>○ Reviews de vendedores y productos</li>
            <li>○ Búsqueda full-text</li>
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-amber-500 mb-3">Fase 3 — Verticales</h3>
          <ul className="space-y-1.5 text-sm text-slate-500">
            <li>○ Inmuebles (listings, zonas, visitas QR)</li>
            <li>○ Servicios profesionales (turnos, booking)</li>
            <li>○ White-label / B2B</li>
            <li>○ Migración a Kubernetes</li>
            <li>○ App Store + Play Store</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
