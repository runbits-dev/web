"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Users, Store, Package, DollarSign, TrendingUp, TrendingDown, UserCheck, XCircle } from 'lucide-react'

type PlanGroup = {
  plan: string
  count: number
  mrr: number
  color: string
}

function groupByPlan(subs: any[]): PlanGroup[] {
  const planColors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-600',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-indigo-50 text-indigo-700',
    business: 'bg-violet-50 text-violet-700',
    enterprise: 'bg-amber-50 text-amber-700',
  }
  const map: Record<string, PlanGroup> = {}
  for (const s of subs) {
    const plan = (s.plan ?? s.tier ?? 'free').toLowerCase()
    if (!map[plan]) {
      map[plan] = { plan, count: 0, mrr: 0, color: planColors[plan] ?? 'bg-slate-50 text-slate-600' }
    }
    map[plan].count += 1
    if (s.status === 'active') {
      map[plan].mrr += s.price_usd_cents ?? 0
    }
  }
  return Object.values(map).sort((a, b) => b.mrr - a.mrr || b.count - a.count)
}

/** Returns { current, previous } MRR comparing this calendar month vs last */
function computeMrrTrend(subs: any[]): { current: number; previous: number; pct: number } {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1)

  let current = 0
  let previous = 0

  for (const s of subs) {
    if (s.status !== 'active') continue
    const price = s.price_usd_cents ?? 0
    if (!price) continue
    const created = s.created_at ? new Date(s.created_at) : null
    if (!created) { current += price; continue }
    // Subscriptions created before this month contribute to both windows; ones created this month only to current
    const createdMonth = created.getMonth()
    const createdYear = created.getFullYear()
    const isNewThisMonth = createdYear === thisYear && createdMonth === thisMonth
    current += price
    if (!isNewThisMonth) previous += price
  }

  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
  return { current, previous, pct }
}

/** Count users registered in the last 7 days, grouped by day offset (0 = today) */
function usersPerDay(users: any[]): number[] {
  const counts = Array(7).fill(0)
  const now = new Date()
  for (const u of users) {
    if (!u.created_at) continue
    const d = new Date(u.created_at)
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays >= 0 && diffDays < 7) {
      counts[6 - diffDays] += 1
    }
  }
  return counts
}

function GrowthChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const H = 60
  const W = 200
  const barW = 20
  const gap = 8
  const totalW = data.length * (barW + gap) - gap
  const offsetX = (W - totalW) / 2

  const now = new Date()
  const labels = data.map((_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 2)
  })

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ maxHeight: 96 }}>
      {data.map((v, i) => {
        const barH = Math.max(3, (v / max) * H)
        const x = offsetX + i * (barW + gap)
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={i === 6 ? '#6366f1' : '#e0e7ff'} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">{labels[i]}</text>
            {v > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={7} fill="#6366f1">{v}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: 'bg-amber-50 text-amber-700' },
  accepted:   { label: 'Aceptado',    color: 'bg-blue-50 text-blue-700' },
  preparing:  { label: 'Preparando',  color: 'bg-indigo-50 text-indigo-700' },
  ready:      { label: 'Listo',       color: 'bg-teal-50 text-teal-700' },
  delivering: { label: 'En camino',   color: 'bg-violet-50 text-violet-700' },
  delivered:  { label: 'Entregado',   color: 'bg-green-50 text-green-700' },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-50 text-red-600' },
}

export default function AdminOverview() {
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, stores: 0, orders: 0, mrr: 0, activeSubscriptions: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [planGroups, setPlanGroups] = useState<PlanGroup[]>([])
  const [mrrTrend, setMrrTrend] = useState<{ current: number; previous: number; pct: number }>({ current: 0, previous: 0, pct: 0 })
  const [churnRate, setChurnRate] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me().then(user => {
      if (user.role !== 'superadmin') { router.push('/dashboard'); return }

      Promise.all([
        api.getAdminUsers({ limit: '1' }),
        api.getAdminRestaurants({ limit: '1' }),
        api.getAdminOrders({ limit: '1' }),
        api.getSubscriptions(),
        api.getAdminUsers({ limit: '5' }),
        api.getAdminOrders({ limit: '5' }),
        api.getAdminUsers({ limit: '200' }),
      ]).then(([usersRes, storesRes, ordersRes, subs, recentUsersRes, recentOrdersRes, allUsersRes]) => {
        const allSubs = subs as any[]
        const activeSubs = allSubs.filter((s: any) => s.status === 'active')
        const cancelledSubs = allSubs.filter((s: any) => s.status === 'cancelled')
        const mrr = activeSubs.reduce((sum: number, s: any) => sum + (s.price_usd_cents || 0), 0)

        const totalUsers: number = (usersRes as any).total || 0
        const allUsersData: any[] = (allUsersRes as any).data || []
        const ownerCount = allUsersData.filter((u: any) =>
          u.role === 'restaurant_owner' || (u.roles ?? []).includes('restaurant_owner')
        ).length

        setStats({
          users: totalUsers,
          stores: (storesRes as any).total || 0,
          orders: (ordersRes as any).total || 0,
          activeSubscriptions: activeSubs.length,
          mrr,
        })
        setRecentUsers((recentUsersRes as any).data || [])
        setAllUsers(allUsersData)
        setPlanGroups(groupByPlan(allSubs))
        setMrrTrend(computeMrrTrend(allSubs))
        setChurnRate(allSubs.length > 0 ? Math.round((cancelledSubs.length / allSubs.length) * 100) : 0)
        setConversionRate(totalUsers > 0 ? Math.round((ownerCount / totalUsers) * 100) : 0)
        setRecentOrders((recentOrdersRes as any).data || [])
      }).finally(() => setLoading(false))
    }).catch(() => router.push('/dashboard'))
  }, [])

  const growthData = usersPerDay(allUsers)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Estado general de la plataforma</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : (
        <>
          {/* Main stat cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: 'Usuarios totales', value: stats.users, Icon: Users, color: 'blue' },
              { label: 'Comercios', value: stats.stores, Icon: Store, color: 'orange' },
              { label: 'Pedidos totales', value: stats.orders, Icon: Package, color: 'violet' },
              {
                label: 'MRR',
                value: `$${(stats.mrr / 100).toFixed(2)}`,
                Icon: DollarSign,
                color: 'green',
                sub: `${stats.activeSubscriptions} suscripciones activas`,
                trend: mrrTrend,
              },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${s.color}-50 text-${s.color}-700`}>
                  <s.Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
                {(s as any).sub && <p className="text-xs text-slate-400 mt-0.5">{(s as any).sub}</p>}
                {(s as any).trend && (s as any).trend.previous > 0 && (
                  <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${(s as any).trend.pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {(s as any).trend.pct >= 0
                      ? <TrendingUp className="w-3.5 h-3.5" />
                      : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs((s as any).trend.pct)}% vs mes anterior
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Secondary stat cards: Churn + Conversion */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-red-50 text-red-600">
                <XCircle className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{churnRate}%</p>
              <p className="text-sm text-slate-500 mt-0.5">Churn rate</p>
              <p className="text-xs text-slate-400 mt-0.5">Suscripciones canceladas</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-teal-50 text-teal-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{conversionRate}%</p>
              <p className="text-sm text-slate-500 mt-0.5">Tasa de conversión</p>
              <p className="text-xs text-slate-400 mt-0.5">Cuentas con comercio activo</p>
            </div>
          </div>

          {/* Revenue by plan breakdown */}
          {planGroups.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Usuarios por plan</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {planGroups.map(g => (
                  <div key={g.plan} className={`rounded-xl p-4 ${g.color}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1 capitalize">{g.plan}</p>
                    <p className="text-2xl font-bold">{g.count}</p>
                    <p className="text-xs opacity-60 mt-0.5">
                      {g.mrr > 0 ? `$${(g.mrr / 100).toFixed(0)} MRR` : 'Sin MRR'}
                    </p>
                  </div>
                ))}
              </div>
              {planGroups.length > 1 && (() => {
                const maxCount = Math.max(...planGroups.map(g => g.count), 1)
                const barColors: Record<string, string> = {
                  free: '#94a3b8',
                  starter: '#3b82f6',
                  pro: '#6366f1',
                  business: '#8b5cf6',
                  enterprise: '#f59e0b',
                }
                return (
                  <div className="mt-4 space-y-2">
                    {planGroups.map(g => (
                      <div key={g.plan} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-20 capitalize">{g.plan}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.max(2, (g.count / maxCount) * 100)}%`,
                              backgroundColor: barColors[g.plan] ?? '#94a3b8',
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 w-6 text-right">{g.count}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Growth chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Nuevos usuarios — últimos 7 días</h2>
            {allUsers.length > 0 ? (
              <GrowthChart data={growthData} />
            ) : (
              <p className="text-xs text-slate-400">No hay datos suficientes</p>
            )}
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Usuarios recientes</h2>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-slate-400">No hay usuarios</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentUsers.map((u: any) => (
                  <li key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.name || u.email}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Últimos pedidos</h2>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-400">No hay pedidos</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentOrders.map((o: any) => {
                  const statusInfo = ORDER_STATUS_LABELS[o.status] ?? { label: o.status, color: 'bg-slate-50 text-slate-600' }
                  return (
                    <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {o.store_name || o.restaurant_name || o.restaurant_id || '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          ${((o.total ?? o.total_price ?? o.amount ?? 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
