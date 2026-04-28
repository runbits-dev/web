"use client"

import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { Store, ExternalLink, X, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'

const PLAN_COLORS: Record<string, string> = {
  free:       'bg-slate-100 text-slate-600',
  starter:    'bg-blue-50 text-blue-700',
  pro:        'bg-indigo-50 text-indigo-700',
  business:   'bg-violet-50 text-violet-700',
  enterprise: 'bg-amber-50 text-amber-700',
}

const PLAN_OPTIONS = ['', 'free', 'starter', 'pro', 'business', 'enterprise']

function PlanBadge({ plan }: { plan?: string }) {
  const key = (plan ?? 'free').toLowerCase()
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${PLAN_COLORS[key] ?? 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
      {key || 'free'}
    </span>
  )
}

function StatusBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
      isOpen ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-600 ring-red-200'
    }`}>
      {isOpen ? 'Abierto' : 'Cerrado'}
    </span>
  )
}

type DetailState = {
  id: string
  data: any | null
  loading: boolean
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'open' | 'closed'>('')
  const [planFilter, setPlanFilter] = useState('')
  const [detail, setDetail] = useState<DetailState | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    api.getAdminRestaurants({ limit: '200' })
      .then(r => { setRestaurants(r.data || []); setTotal(r.total || 0) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      if (search && !r.name?.toLowerCase().includes(search.toLowerCase()) && !r.slug?.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter === 'open' && !r.is_open) return false
      if (statusFilter === 'closed' && r.is_open) return false
      if (planFilter) {
        const plan = (r.subscription_plan ?? r.plan ?? 'free').toLowerCase()
        if (plan !== planFilter) return false
      }
      return true
    })
  }, [restaurants, search, statusFilter, planFilter])

  function openDetail(r: any) {
    setDetail({ id: r.id, data: r, loading: true })
    api.getAdminRestaurant(r.id)
      .then(full => setDetail(prev => prev?.id === r.id ? { id: r.id, data: full, loading: false } : prev))
      .catch(() => setDetail(prev => prev?.id === r.id ? { id: r.id, data: prev?.data ?? null, loading: false } : prev))
  }

  function closeDetail() {
    setDetail(null)
  }

  async function toggleOpen() {
    if (!detail?.data) return
    setToggling(true)
    try {
      const newVal = !detail.data.is_open
      await api.updateRestaurant(detail.data.id, { is_open: newVal })
      // Update local list
      setRestaurants(prev => prev.map(r => r.id === detail.data.id ? { ...r, is_open: newVal } : r))
      setDetail(prev => prev ? { ...prev, data: { ...prev.data, is_open: newVal } } : prev)
    } catch {}
    setToggling(false)
  }

  const d = detail?.data

  return (
    <div className="flex gap-6 min-h-0">
      {/* List column */}
      <div className={`flex-1 min-w-0 ${detail ? 'hidden sm:block' : ''}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Restaurantes</h1>
          <p className="text-slate-500 text-sm mt-1">{total} registrados · {filtered.length} mostrados</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700"
          >
            <option value="">Estado: todos</option>
            <option value="open">Abierto</option>
            <option value="closed">Cerrado</option>
          </select>
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700"
          >
            <option value="">Plan: todos</option>
            {PLAN_OPTIONS.filter(Boolean).map(p => (
              <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <p className="text-slate-400 text-sm">No hay restaurantes</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(r => {
              const isSelected = detail?.id === r.id
              const plan = (r.subscription_plan ?? r.plan ?? 'free').toLowerCase()
              const productCount = r.product_count ?? r.menu_count ?? null
              return (
                <button
                  key={r.id}
                  onClick={() => openDetail(r)}
                  className={`w-full text-left bg-white rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all ${
                    isSelected ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-orange-700 shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                      <p className="text-xs text-slate-400 truncate">{r.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge isOpen={!!r.is_open} />
                    <PlanBadge plan={plan} />
                    {productCount !== null && (
                      <span className="text-xs text-slate-400">{productCount} prod.</span>
                    )}
                    <a
                      href={`https://runbits.app/store?s=${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Ver tienda pública"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detail && (
        <div className="w-full sm:w-96 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 sticky top-4">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-bold text-slate-900 truncate">{d?.name ?? '—'}</p>
                <p className="text-xs text-slate-400 truncate">{d?.slug}</p>
              </div>
              <button onClick={closeDetail} className="text-slate-400 hover:text-slate-700 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detail.loading && !d ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
            ) : d ? (
              <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
                {/* Status + Plan badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge isOpen={!!d.is_open} />
                  <PlanBadge plan={d.subscription_plan ?? d.plan} />
                  {d.subscription_status && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {d.subscription_status}
                    </span>
                  )}
                </div>

                {/* Store info */}
                <div className="space-y-2 text-sm">
                  {d.address && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dirección</span>
                      <p className="text-slate-700 mt-0.5">{d.address}</p>
                    </div>
                  )}
                  {d.phone && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Teléfono</span>
                      <p className="text-slate-700 mt-0.5">{d.phone}</p>
                    </div>
                  )}
                  {d.description && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Descripción</span>
                      <p className="text-slate-700 mt-0.5 text-xs leading-relaxed">{d.description}</p>
                    </div>
                  )}
                  {d.email && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</span>
                      <p className="text-slate-700 mt-0.5">{d.email}</p>
                    </div>
                  )}
                  {d.business_type && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tipo</span>
                      <p className="text-slate-700 mt-0.5 capitalize">{d.business_type}</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {(d.orders_count != null || d.products_count != null || d.total_revenue != null || d.menu_count != null) && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-2">Estadísticas</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Productos', value: d.products_count ?? d.menu_count ?? '—' },
                        { label: 'Pedidos', value: d.orders_count ?? '—' },
                        { label: 'Revenue', value: d.total_revenue != null ? `$${(d.total_revenue / 100).toFixed(0)}` : '—' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center">
                          <p className="text-base font-bold text-slate-800">{stat.value}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active modules */}
                {Array.isArray(d.modules) && d.modules.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-2">Módulos activos</span>
                    <div className="flex flex-wrap gap-1.5">
                      {d.modules.map((m: any) => (
                        <span key={m.id ?? m.module_id ?? m} className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 font-medium">
                          {m.name ?? m.module_id ?? m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Public store link */}
                <a
                  href={`https://runbits.app/store?s=${d.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver tienda pública
                </a>

                {/* Toggle open/close */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={toggleOpen}
                    disabled={toggling}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      d.is_open
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    } disabled:opacity-50`}
                  >
                    {d.is_open
                      ? <><ToggleLeft className="w-4 h-4" /> Cerrar tienda</>
                      : <><ToggleRight className="w-4 h-4" /> Abrir tienda</>
                    }
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">No se pudo cargar</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
