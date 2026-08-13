"use client"

import { type LucideIcon, Package, CalendarDays, DollarSign, ChefHat, Calendar, Clock, FileText, ClipboardList, MapPin } from 'lucide-react'

export type DashboardData = {
  orders: any[]
  menu: any[]
  isOpen: boolean
}

function StatCard({ label, value, Icon, color }: { label: string; value: string | number; Icon: LucideIcon; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color] ?? colors.indigo}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function todayOrders(orders: any[]): any[] {
  const today = new Date().toDateString()
  return orders.filter(o => new Date(o.created_at).toDateString() === today)
}

function pendingOrders(orders: any[]): any[] {
  return orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT'].includes(o.status))
}

function activeOrders(orders: any[]): any[] {
  return orders.filter(o => !['CANCELLED', 'COMPLETED', 'DELIVERED'].includes(o.status))
}

function topItems(orders: any[], limit = 5): Array<{ name: string; count: number }> {
  const counts: Record<string, { name: string; count: number }> = {}
  for (const order of orders) {
    const items: any[] = order.items ?? []
    for (const item of items) {
      const key = item.menu_item_id ?? item.id ?? item.name
      if (!key) continue
      if (!counts[key]) counts[key] = { name: item.name ?? item.menu_item_id, count: 0 }
      counts[key].count += item.quantity ?? 1
    }
  }
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, limit)
}

function todayRevenue(orders: any[]): number {
  return todayOrders(orders).reduce((sum, o) => sum + (o.subtotal || 0), 0)
}

function ListCard({ title, items, empty }: { title: string; items: Array<{ primary: string; secondary?: string; trailing?: string }>; empty: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">{empty}</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((it, i) => (
            <li key={i} className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{it.primary}</p>
                  {it.secondary && <p className="text-xs text-slate-400 truncate">{it.secondary}</p>}
                </div>
              </div>
              {it.trailing && <span className="text-sm text-slate-500 ml-3 shrink-0">{it.trailing}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Per-business-type widget grids ───────────────────────────────────────────

export function FoodWidgets({ data }: { data: DashboardData }) {
  const today = todayOrders(data.orders)
  const pending = pendingOrders(data.orders)
  const inKitchen = data.orders.filter(o => o.status === 'PREPARING')
  const tops = topItems(data.orders, 5)
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pedidos hoy" value={today.length} Icon={Package} color="indigo" />
        <StatCard label="En cocina" value={inKitchen.length} Icon={ChefHat} color="amber" />
        <StatCard label="Pendientes" value={pending.length} Icon={Clock} color="blue" />
        <StatCard label="Ingresos hoy" value={`$${(todayRevenue(data.orders) / 100).toFixed(2)}`} Icon={DollarSign} color="green" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ListCard title="Top platos" empty="Sin datos aún"
          items={tops.map(t => ({ primary: t.name, trailing: `${t.count} pedidos` }))} />
        <ListCard title="Pedidos en preparación" empty="Sin pedidos en cocina"
          items={inKitchen.slice(0, 5).map(o => ({ primary: `#${o.id.slice(0, 8)}`, secondary: `${(o.items ?? []).length} ítems`, trailing: `$${((o.total ?? 0) / 100).toFixed(2)}` }))} />
      </div>
    </>
  )
}

export function AppointmentWidgets({ data }: { data: DashboardData }) {
  const today = todayOrders(data.orders)
  const pending = pendingOrders(data.orders)
  const upcoming = data.orders
    .filter(o => o.scheduled_at && new Date(o.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)
  const tops = topItems(data.orders, 5)
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Turnos hoy" value={today.length} Icon={CalendarDays} color="indigo" />
        <StatCard label="Pendientes" value={pending.length} Icon={Clock} color="blue" />
        <StatCard label="Próximos turnos" value={upcoming.length} Icon={Calendar} color="violet" />
        <StatCard label="Ingresos hoy" value={`$${(todayRevenue(data.orders) / 100).toFixed(2)}`} Icon={DollarSign} color="green" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ListCard title="Próximos turnos" empty="Sin turnos próximos"
          items={upcoming.map(o => ({
            primary: `#${o.id.slice(0, 8)}`,
            secondary: o.scheduled_at ? new Date(o.scheduled_at).toLocaleString() : undefined,
            trailing: `$${((o.total ?? 0) / 100).toFixed(2)}`,
          }))} />
        <ListCard title="Servicios más reservados" empty="Sin reservas todavía"
          items={tops.map(t => ({ primary: t.name, trailing: `${t.count} turnos` }))} />
      </div>
    </>
  )
}

export function TaskWidgets({ data }: { data: DashboardData }) {
  const today = todayOrders(data.orders)
  const open = activeOrders(data.orders)
  const inReview = data.orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED')
  const tops = topItems(data.orders, 5)
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Cotizaciones hoy" value={today.length} Icon={FileText} color="indigo" />
        <StatCard label="En revisión" value={inReview.length} Icon={ClipboardList} color="blue" />
        <StatCard label="Trabajos activos" value={open.length} Icon={Package} color="violet" />
        <StatCard label="Cobrado hoy" value={`$${(todayRevenue(data.orders) / 100).toFixed(2)}`} Icon={DollarSign} color="green" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ListCard title="Servicios más solicitados" empty="Sin trabajos todavía"
          items={tops.map(t => ({ primary: t.name, trailing: `${t.count} pedidos` }))} />
        <ListCard title="Cotizaciones pendientes" empty="Sin cotizaciones pendientes"
          items={inReview.slice(0, 5).map(o => ({
            primary: `#${o.id.slice(0, 8)}`,
            secondary: o.status,
            trailing: `$${((o.total ?? 0) / 100).toFixed(2)}`,
          }))} />
      </div>
    </>
  )
}

export function RealtimeWidgets({ data }: { data: DashboardData }) {
  const today = todayOrders(data.orders)
  const upcoming = data.orders
    .filter(o => o.scheduled_at && new Date(o.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)
  const occupancyPct = data.menu.length === 0 ? 0
    : Math.round((data.orders.filter(o => o.scheduled_at && Math.abs(new Date(o.scheduled_at).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000).length / Math.max(data.menu.length * 7, 1)) * 100)
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Reservas hoy" value={today.length} Icon={CalendarDays} color="indigo" />
        <StatCard label="Próximos check-ins" value={upcoming.length} Icon={MapPin} color="violet" />
        <StatCard label="Ocupación 7d" value={`${occupancyPct}%`} Icon={Clock} color="amber" />
        <StatCard label="Ingresos hoy" value={`$${(todayRevenue(data.orders) / 100).toFixed(2)}`} Icon={DollarSign} color="green" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ListCard title="Próximas reservas" empty="Sin reservas próximas"
          items={upcoming.map(o => ({
            primary: `#${o.id.slice(0, 8)}`,
            secondary: o.scheduled_at ? new Date(o.scheduled_at).toLocaleString() : undefined,
            trailing: `$${((o.total ?? 0) / 100).toFixed(2)}`,
          }))} />
        <ListCard title="Recursos más reservados" empty="Sin reservas todavía"
          items={topItems(data.orders, 5).map(t => ({ primary: t.name, trailing: `${t.count} reservas` }))} />
      </div>
    </>
  )
}

// ─── Selector ─────────────────────────────────────────────────────────────────

export function DashboardWidgetsForType({ businessType, data }: { businessType: string | null | undefined; data: DashboardData }) {
  switch (businessType) {
    case 'food':
    case 'food+appointment':
      return <FoodWidgets data={data} />
    case 'appointment':
      return <AppointmentWidgets data={data} />
    case 'task':
      return <TaskWidgets data={data} />
    case 'realtime':
      return <RealtimeWidgets data={data} />
    default:
      return <FoodWidgets data={data} />
  }
}
