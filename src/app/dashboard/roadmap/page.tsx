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
    id: 's1', title: 'Sprint 1 — Infraestructura ✅', dates: '18 abr', color: '#22c55e',
    tasks: [
      { id: '1.1', label: '✅ Todos los servicios deployados y UP (10/10)', repo: 'todos' },
      { id: '1.2', label: '✅ Gateway path rewriting + wrangler domains', repo: 'gateway' },
      { id: '1.3', label: '✅ runbits.app redirect 301 → runbits.io', repo: 'worker' },
      { id: '1.4', label: '✅ Fix column bugs (restaurant, menu)', repo: 'restaurant-service' },
      { id: '1.5', label: '✅ E2E tests 39/39 verde', repo: 'web' },
      { id: '1.6', label: '✅ Status page status.runbits.dev (90 días, cron 5min)', repo: 'status' },
    ],
  },
  {
    id: 's2', title: 'Sprint 2 — Pagos ✅', dates: '18 abr', color: '#22c55e',
    tasks: [
      { id: '2.1', label: '✅ Stripe keys configuradas (live)', repo: 'billing-service' },
      { id: '2.2', label: '✅ Tablas D1 (subscriptions + afip_invoices)', repo: 'D1' },
      { id: '2.3', label: '✅ Página /dashboard/subscription (3 planes + trial)', repo: 'web' },
      { id: '2.4', label: '✅ Código Stripe completo (checkout, webhooks, dunning)', repo: 'billing-service' },
      { id: '2.5', label: '⚠️ AFIP removido (empresa US/Wyoming, no aplica)', repo: 'billing-service' },
    ],
  },
  {
    id: 's3', title: 'Sprint 3 — Features Core', dates: '18–20 abr', color: '#a855f7',
    tasks: [
      { id: '3.1', label: '✅ Menu CRUD + variantes (extras, tamaños)', repo: 'web + restaurant' },
      { id: '3.2', label: '✅ Push notifications Expo (8 tipos de eventos)', repo: 'notification' },
      { id: '3.3', label: '✅ Historial de pedidos + Stats reales', repo: 'web + order' },
      { id: '3.4', label: '✅ Tienda pública /store?s=slug (menú + carrito)', repo: 'web' },
      { id: '3.5', label: '✅ Mobile APK compilado (25 pantallas, 3 roles)', repo: 'mobile' },
      { id: '3.6', label: '✅ Competitive analysis (17 plataformas)', repo: 'docs' },
      { id: '3.7', label: 'Tracking rider en tiempo real (GPS en KV, falta mapa)', repo: 'delivery + web' },
      { id: '3.8', label: '⏸️ WhatsApp notificaciones (diferido a futuro)', repo: 'gateway' },
    ],
  },
  {
    id: 's4', title: 'Sprint 4 — UX / Growth', dates: '20–24 abr', color: '#06b6d4',
    tasks: [
      { id: '4.1', label: '✅ Cupones + promociones (backend + /marketing)', repo: 'social + web' },
      { id: '4.2', label: '✅ Chat, favoritos, ratings, evidencia (backend)', repo: 'social + order' },
      { id: '4.3', label: '✅ Landing: "tus clientes son tuyos" + WhyRunbits', repo: 'web' },
      { id: '4.4', label: 'Tienda personalizable (dominio propio, colores, logo)', repo: 'web + restaurant' },
      { id: '4.5', label: 'Onboarding guiado para nuevo comercio', repo: 'web' },
      { id: '4.6', label: 'Dashboard analytics (gráficos, cohortes, tendencias)', repo: 'web' },
      { id: '4.7', label: 'Chat UI en detalle de pedido', repo: 'web' },
      { id: '4.8', label: 'Ratings UI en tienda pública', repo: 'web' },
    ],
  },
  {
    id: 's5', title: 'Sprint 5 — Publicación', dates: '25–30 abr', color: '#ec4899',
    tasks: [
      { id: '5.1', label: 'Play Store publish (Android)', repo: 'mobile' },
      { id: '5.2', label: 'iOS build + App Store', repo: 'mobile' },
      { id: '5.3', label: 'Primer comercio real onboarded', repo: 'todos' },
      { id: '5.4', label: 'Smoke test end-to-end con pedido real', repo: 'todos' },
      { id: '5.5', label: '✅ SEO: robots.txt + sitemap.xml + OG metadata', repo: 'web' },
    ],
  },
  {
    id: 's6', title: 'Sprint 6 — Competitivo (vs PedidosYa/Rappi)', dates: 'mayo', color: '#f59e0b',
    tasks: [
      { id: '6.1', label: 'Tracking con ETA dinámico para el cliente', repo: 'delivery + store' },
      { id: '6.2', label: 'Tienda con dominio propio del comercio', repo: 'web + CF Workers' },
      { id: '6.3', label: 'Integración pagos locales (MercadoPago para clientes)', repo: 'billing + order' },
      { id: '6.4', label: 'WhatsApp notificaciones para comercios', repo: 'notification' },
      { id: '6.5', label: 'Sistema de ofertas/promociones (happy hour, BOGO)', repo: 'social + store' },
      { id: '6.6', label: 'Página "Acerca de" / filosofía core', repo: 'web' },
    ],
  },
  {
    id: 's7', title: 'Sprint 7 — Diferenciación (vs Shopify/Pedix)', dates: 'mayo-junio', color: '#8b5cf6',
    tasks: [
      { id: '7.1', label: 'Generación de catálogo con IA (fotos + descripciones)', repo: 'web + restaurant' },
      { id: '7.2', label: 'Programa de lealtad white-label para comercios', repo: 'social + billing' },
      { id: '7.3', label: 'CRM: historial de clientes, segmentación', repo: 'social + web' },
      { id: '7.4', label: 'Multi-sucursal (varias ubicaciones)', repo: 'restaurant + web' },
      { id: '7.5', label: 'API pública para integraciones de terceros', repo: 'gateway' },
      { id: '7.6', label: 'Facturación automática (CFDI MX, Factura AR)', repo: 'billing' },
    ],
  },
  {
    id: 's8', title: 'Sprint 8 — Super-App (Fase 2+)', dates: 'junio+', color: '#06b6d4',
    tasks: [
      { id: '8.1', label: 'Motor de reservas/booking (citas, turnos)', repo: 'nuevo servicio' },
      { id: '8.2', label: 'Chatbot IA del negocio (FAQs automáticos)', repo: 'social + AI' },
      { id: '8.3', label: 'Ecosistema de plugins/extensiones', repo: 'gateway + web' },
      { id: '8.4', label: 'Onboarding con IA (crear tienda desde prompt)', repo: 'web + AI' },
      { id: '8.5', label: 'Campañas marketing automatizadas (email, push)', repo: 'notification' },
      { id: '8.6', label: 'Badge "Verificado por Runbits"', repo: 'restaurant + store' },
      { id: '8.7', label: 'Docs IA: asistente RAG que reemplaza documentación estática', repo: 'AI + web' },
      { id: '8.8', label: 'Verificación de identidad (niveles ARCA 0-3)', repo: 'auth + web' },
    ],
  },
  {
    id: 's9', title: 'Sprint 9 — UX & Onboarding', dates: 'activo', color: '#f97316',
    tasks: [
      { id: '9.1', label: '✅ Registro público con wizard 3 pasos + tipo de negocio', repo: 'web' },
      { id: '9.2', label: '✅ Fix landing pricing (sin comisiones, 4 planes correctos)', repo: 'web' },
      { id: '9.3', label: '✅ Fix links /register (antes iban a /dashboard/register)', repo: 'web' },
      { id: '9.4', label: 'Tutorial interactivo primera vez (guía por secciones)', repo: 'web' },
      { id: '9.5', label: 'Setup inicial por tipo de negocio (vistas personalizadas)', repo: 'web + restaurant' },
      { id: '9.6', label: 'Upload de fotos de productos (R2)', repo: 'web + restaurant' },
      { id: '9.7', label: 'Multi-negocio: 1 cuenta, múltiples tipos de comercio', repo: 'auth + restaurant' },
      { id: '9.8', label: 'Enforcement de límites por plan (gateway middleware)', repo: 'gateway + billing' },
      { id: '9.9', label: 'Admin backend: gestión de planes y comercios', repo: 'web + billing' },
      { id: '9.10', label: 'Solicitar número D-U-N-S para la LLC (dnb.com, ~30 días)', repo: 'legal' },
      { id: '9.11', label: 'Convertir Google Play a cuenta Organization con DUNS', repo: 'stores' },
      { id: '9.12', label: 'Publicar app en Google Play (cuenta Individual mientras tanto)', repo: 'mobile' },
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
  { name: 'Status Page', url: 'status.runbits.dev', up: true },
  { name: 'Mobile Web', url: 'runbits.app → runbits.io', up: true },
]

const log: { date: string; text: string }[] = [
  { date: '2026-04-18', text: 'Variantes de producto (extras, tamaños) implementadas en backend + D1. Column mismatches corregidos.' },
  { date: '2026-04-18', text: 'Tienda pública /store?s=slug — menú con carrito, "Powered by Runbits". Burger House visible.' },
  { date: '2026-04-18', text: 'Status page status.runbits.dev — diseño Anthropic, barras 90 días, cron 5min, KV persistence.' },
  { date: '2026-04-18', text: 'Mobile APK compilado exitosamente via EAS Build. 25 pantallas, 3 roles (customer/restaurant/rider).' },
  { date: '2026-04-18', text: 'E2E tests 39/39 verde — fix api.me() missing restaurant_id.' },
  { date: '2026-04-18', text: 'Marketing page /dashboard/marketing — cupones y promociones CRUD.' },
  { date: '2026-04-18', text: 'Stripe keys configuradas en billing Worker. Suscripciones operativas.' },
  { date: '2026-04-18', text: 'Landing actualizada: "Tus clientes son tuyos. Siempre." + sección WhyRunbits.' },
  { date: '2026-04-18', text: 'SPRINT 1+2 COMPLETO: 10/10 servicios UP, Stripe live, tablas D1, subscription page.' },
  { date: '2026-04-18', text: 'Roadmap dashboard creado con persistencia en Cloudflare KV.' },
  { date: '2026-04-18', text: 'Análisis competitivo: 17 plataformas → features mapeados a 4 fases.' },
  { date: '2026-03-18', text: 'Secrets regenerados en todos los CF Workers. Landing E2E tests verde.' },
  { date: '2026-03-17', text: 'Web dashboard deployado en CF Pages. Convención de dominios establecida.' },
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
