"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getPendingPayouts().then(setPayouts).finally(() => setLoading(false)) }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pagos pendientes</h1>
        <p className="text-slate-500 text-sm mt-1">{payouts.length} pagos por procesar</p>
      </div>
      {loading ? <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div> : payouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center"><p className="text-slate-400 text-sm">No hay pagos pendientes</p></div>
      ) : (
        <div className="grid gap-4">
          {payouts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div><p className="font-semibold text-slate-900">{p.agent_name}</p><p className="text-sm text-slate-500">{p.commission_count} comisiones</p></div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-900">${(p.total_amount / 100).toFixed(2)}</span>
                <button onClick={() => api.processPayouts(p.agent_id, p.commission_ids).then(() => api.getPendingPayouts().then(setPayouts))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Procesar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
