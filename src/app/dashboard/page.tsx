"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { OnboardingBanner } from '@/components/Onboarding'

export default function StoreDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onboardingStatus, setOnboardingStatus] = useState('live')
  const [menuCount, setMenuCount] = useState(0)
  const [hasPhone, setHasPhone] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
    api.me().then(u => {
      if (u.restaurant_id) {
        api.getRestaurantStats(u.restaurant_id).then((s: any) => {
          setOnboardingStatus(s.onboarding_status ?? 'live')
          setMenuCount(s.menu?.total_items ?? 0)
          setIsOpen(!!s.is_open)
        }).catch(() => {})
        api.getRestaurant(u.restaurant_id).then((r: any) => {
          setHasPhone(!!r.phone)
          setHasAddress(!!r.address)
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const pending = orders.filter(o => ['PENDING','CONFIRMED','PREPARING'].includes(o.status))
  const today = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  const todayRevenue = today.reduce((sum, o) => sum + (o.subtotal || 0), 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Inicio</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de tu comercio</p>
      </div>
      <OnboardingBanner status={onboardingStatus} menuCount={menuCount} hasPhone={hasPhone} hasAddress={hasAddress} isOpen={isOpen} />
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Pedidos activos" value={pending.length} icon="📦" color="blue" />
        <StatCard label="Pedidos hoy" value={today.length} icon="📅" color="green" />
        <StatCard label="Ingresos hoy" value={`$${(todayRevenue / 100).toFixed(2)}`} icon="💰" color="amber" />
      </div>
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
            {pending.map(o => (
              <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">#{o.id.slice(0,8)}</p>
                  <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleTimeString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">${(o.total / 100).toFixed(2)}</span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
