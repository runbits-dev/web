"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getRiders().then(setRiders).finally(() => setLoading(false)) }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Repartidores</h1>
        <p className="text-slate-500 text-sm mt-1">{riders.length} registrados</p>
      </div>
      {loading ? <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div> : riders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center"><p className="text-slate-400 text-sm">No hay repartidores</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Vehículo</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Score</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Tier</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Estado</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {riders.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                  <td className="px-6 py-4 text-slate-600">{r.vehicle}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(r.score * 20, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-600">{r.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    r.tier === 'pro' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'
                  }`}>{r.tier}</span></td>
                  <td className="px-6 py-4"><span className={`flex items-center gap-1.5 text-xs font-medium ${
                    r.is_available ? 'text-indigo-600' : 'text-slate-400'
                  }`}><span className={`w-2 h-2 rounded-full ${r.is_available ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />{r.is_available ? 'Disponible' : 'No disponible'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
