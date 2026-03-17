"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getAdminRestaurants().then(r => setRestaurants(r.data || [])).finally(() => setLoading(false)) }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Restaurantes</h1>
        <p className="text-slate-500 text-sm mt-1">{restaurants.length} registrados</p>
      </div>
      {loading ? <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div> : restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center"><p className="text-slate-400 text-sm">No hay restaurantes</p></div>
      ) : (
        <div className="grid gap-4">
          {restaurants.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🍽️</div>
                <div><p className="font-semibold text-slate-900">{r.name}</p><p className="text-sm text-slate-500">{r.slug}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
                  r.is_open ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-600 ring-red-200'
                }`}>{r.is_open ? 'Abierto' : 'Cerrado'}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">{r.subscription_plan}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
