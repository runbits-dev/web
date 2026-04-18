"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  COMPLETED: 'bg-green-50 text-green-800 ring-green-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
}

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
        <p className="text-slate-500 text-sm mt-1">{orders.length} pedidos en total</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay pedidos</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Total</th>
                <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => window.location.href = `/dashboard/orders/detail?id=${o.id}`}>
                  <td className="px-6 py-4 font-mono text-xs text-blue-600 underline">{o.id.slice(0,8)}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${statusColors[o.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{o.status}</span></td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">${(o.total / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-slate-400 text-xs">{new Date(o.created_at).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
