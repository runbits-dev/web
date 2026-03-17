"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Stats = {
  restaurant_id: string
  restaurant_name: string | null
  is_open: boolean
  onboarding_status: string | null
  menu: { total_items: number; available_items: number }
  orders: { today: number | null; this_week: number | null; this_month: number | null; note: string }
}

const ONBOARDING_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  profile_complete: 'Perfil completo',
  menu_added: 'Menú cargado',
  live: 'Activo',
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    api.me().then(u => {
      if (u.restaurant_id) {
        setRestaurantId(u.restaurant_id)
        api.getRestaurantStats(u.restaurant_id)
          .then(setStats)
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Estadísticas</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de tu restaurante</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : !restaurantId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-700 text-sm">Tu cuenta no tiene un restaurante asociado aún.</p>
        </div>
      ) : !stats ? (
        <div className="p-8 text-center text-slate-400 text-sm">No se pudieron cargar las estadísticas.</div>
      ) : (
        <div className="space-y-6">
          {/* Estado del restaurante */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estado</p>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${stats.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <p className="text-lg font-bold text-slate-900">{stats.is_open ? 'Abierto' : 'Cerrado'}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Onboarding</p>
              <p className="text-lg font-bold text-slate-900">
                {ONBOARDING_LABELS[stats.onboarding_status ?? ''] ?? stats.onboarding_status ?? '—'}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Productos en menú</p>
              <p className="text-lg font-bold text-slate-900">
                {stats.menu.available_items}
                <span className="text-sm font-normal text-slate-400 ml-1">/ {stats.menu.total_items} totales</span>
              </p>
            </div>
          </div>

          {/* Pedidos — próximamente */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Pedidos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Hoy', value: stats.orders.today },
                { label: 'Esta semana', value: stats.orders.this_week },
                { label: 'Este mes', value: stats.orders.this_month },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-slate-400">{value ?? '—'}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center">
              Los datos de pedidos estarán disponibles próximamente (requiere integración con delivery-service).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
