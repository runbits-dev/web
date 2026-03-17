"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    api.me().then(u => {
      if (u.restaurant_id) {
        setRestaurantId(u.restaurant_id)
        api.getMenu(u.restaurant_id).then(setItems).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Menú</h1>
        <p className="text-slate-500 text-sm mt-1">{items.length} productos</p>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : !restaurantId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-700 text-sm">Tu cuenta no tiene un restaurante asociado aún.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <p className="text-slate-400 text-sm">No hay productos en el menú</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">${(item.price / 100).toFixed(2)}</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  item.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>{item.is_available ? 'Disponible' : 'No disponible'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
