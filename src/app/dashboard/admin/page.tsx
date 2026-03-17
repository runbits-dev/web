"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function AdminOverview() {
  const router = useRouter()
  const [stats, setStats] = useState({ restaurants: 0, riders: 0, orders: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me().then(user => {
      if (user.role !== 'superadmin') { router.push('/dashboard'); return }
      Promise.all([api.getAdminRestaurants(), api.getRiders(), api.getOrders()])
        .then(([restaurants, riders, orders]) => {
          const revenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
          setStats({ restaurants: restaurants.total || 0, riders: riders.length, orders: orders.length, revenue })
        }).finally(() => setLoading(false))
    }).catch(() => router.push('/dashboard'))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Estado general de la plataforma</p>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Restaurantes', value: stats.restaurants, icon: '🍽️', color: 'orange' },
            { label: 'Repartidores', value: stats.riders, icon: '🚴', color: 'blue' },
            { label: 'Pedidos totales', value: stats.orders, icon: '📦', color: 'violet' },
            { label: 'Revenue total', value: `$${(stats.revenue / 100).toFixed(2)}`, icon: '💰', color: 'green' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 bg-${s.color}-50 text-${s.color}-700`}>{s.icon}</div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
