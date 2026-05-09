"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { OnboardingChecklistFull } from '@/components/OnboardingChecklist'
import { DashboardWidgetsForType } from '@/components/DashboardWidgets'
import { useProfile } from '@/context/ProfileContext'

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
  const { activeProfile } = useProfile()
  const [orders, setOrders] = useState<any[]>([])
  const [menu, setMenu] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
    api.me().then(u => {
      if (u.restaurant_id) {
        api.getRestaurantStats(u.restaurant_id).then((s: any) => {
          setIsOpen(!!s.is_open)
        }).catch(() => {})
        api.getMenu(u.restaurant_id).then(setMenu).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const businessType = activeProfile?.business_type ?? null
  const revenueData = generateRevenueData(orders)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Inicio</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de tu comercio</p>
      </div>

      <OnboardingChecklistFull />

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : (
        <DashboardWidgetsForType businessType={businessType} data={{ orders, menu, isOpen }} />
      )}

      {/* Revenue chart — universal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Ingresos — últimos 7 días</h2>
        <BarChart data={revenueData} height={130} />
        <div className="flex justify-between mt-1 px-1">
          {revenueData.map((d, i) => (
            <span key={i} className="text-xs text-slate-400 w-10 text-center">${d.value.toFixed(0)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
