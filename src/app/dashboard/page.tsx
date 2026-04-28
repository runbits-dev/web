"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { OnboardingBanner } from '@/components/Onboarding'
import { Package, CalendarDays, DollarSign, type LucideIcon } from 'lucide-react'

function BarChart({ data, height = 120 }: { data: Array<{ label: string; value: number }>; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${data.length * 40} ${height}`} className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 20)
          return (
            <g key={i}>
              <rect x={i * 40 + 8} y={height - 20 - barH} width={24} height={barH} rx={4} fill="#4f46e5" opacity={0.8} />
              <text x={i * 40 + 20} y={height - 4} textAnchor="middle" fill="#94a3b8" fontSize="10">{d.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function generateRevenueData(orders: any[]): Array<{ label: string; value: number }> {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const result: Array<{ label: string; value: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === dateStr)
    const revenue = dayOrders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0)
    result.push({ label: days[d.getDay()], value: revenue / 100 })
  }
  return result
}

export default function StoreDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [menu, setMenu] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onboardingStatus, setOnboardingStatus] = useState('live')
  const [menuCount, setMenuCount] = useState(0)
  const [hasPhone, setHasPhone] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
    api.me().then(u => {
      if (u.restaurant_id) {
        setRestaurantId(u.restaurant_id)
        api.getRestaurantStats(u.restaurant_id).then((s: any) => {
          setOnboardingStatus(s.onboarding_status ?? 'live')
          setMenuCount(s.menu?.total_items ?? 0)
          setIsOpen(!!s.is_open)
        }).catch(() => {})
        api.getRestaurant(u.restaurant_id).then((r: any) => {
          setHasPhone(!!r.phone)
          setHasAddress(!!r.address)
        }).catch(() => {})
        api.getMenu(u.restaurant_id).then(setMenu).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const pending = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status))
  const today = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  const todayRevenue = today.reduce((sum, o) => sum + (o.subtotal || 0), 0)
  const revenueData = generateRevenueData(orders)

  // Top products by order count — count how many times each menu item appears
  const itemCounts: Record<string, { name: string; count: number }> = {}
  for (const order of orders) {
    const items: any[] = order.items ?? []
    for (const item of items) {
      const key = item.menu_item_id ?? item.id ?? item.name
      if (!key) continue
      if (!itemCounts[key]) itemCounts[key] = { name: item.name ?? item.menu_item_id, count: 0 }
      itemCounts[key].count += item.quantity ?? 1
    }
  }
  const topProducts = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Inicio</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de tu comercio</p>
      </div>
      <OnboardingBanner status={onboardingStatus} menuCount={menuCount} hasPhone={hasPhone} hasAddress={hasAddress} isOpen={isOpen} />
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Pedidos activos" value={pending.length} Icon={Package} color="blue" />
        <StatCard label="Pedidos hoy" value={today.length} Icon={CalendarDays} color="indigo" />
        <StatCard label="Ingresos hoy" value={`$${(todayRevenue / 100).toFixed(2)}`} Icon={DollarSign} color="amber" />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Ingresos — últimos 7 días</h2>
        <BarChart data={revenueData} height={130} />
        <div className="flex justify-between mt-1 px-1">
          {revenueData.map((d, i) => (
            <span key={i} className="text-xs text-slate-400 w-10 text-center">${d.value.toFixed(0)}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Top productos</h2>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Sin datos aún</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topProducts.map((p, i) => (
                <li key={i} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-800">{p.name}</span>
                  </div>
                  <span className="text-sm text-slate-500">{p.count} pedidos</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent active orders */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Pedidos activos</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No hay pedidos activos</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pending.map(o => {
                const itemCount = (o.items ?? []).reduce((sum: number, it: any) => sum + (it.quantity ?? 1), 0)
                return (
                  <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">#{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {itemCount > 0 ? `${itemCount} ítem${itemCount !== 1 ? 's' : ''} · ` : ''}
                        {timeAgo(o.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">${((o.total ?? 0) / 100).toFixed(2)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    CONFIRMED: 'bg-blue-50 text-blue-700',
    PREPARING: 'bg-indigo-50 text-indigo-700',
    READY: 'bg-green-50 text-green-700',
    DELIVERED: 'bg-slate-50 text-slate-500',
    CANCELLED: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${map[status] ?? 'bg-slate-50 text-slate-500'}`}>
      {status}
    </span>
  )
}

function StatCard({ label, value, Icon, color }: { label: string; value: string | number; Icon: LucideIcon; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
