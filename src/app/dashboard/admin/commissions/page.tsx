"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getCommissions(), api.getCommissionsSummary()])
      .then(([c, s]) => { setCommissions(c.data || []); setSummary(s) })
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    if (action === 'approve') await api.approveCommission(id)
    else await api.rejectCommission(id)
    setCommissions(await api.getCommissions().then(r => r.data || []))
  }

  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900">Comisiones</h1></div>
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-2xl font-bold text-slate-900">${((summary.total_amount || 0) / 100).toFixed(2)}</p><p className="text-sm text-slate-500 mt-0.5">Total</p></div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-2xl font-bold text-amber-600">${((summary.pending_amount || 0) / 100).toFixed(2)}</p><p className="text-sm text-slate-500 mt-0.5">Pendientes</p></div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-2xl font-bold text-indigo-600">${((summary.paid_amount || 0) / 100).toFixed(2)}</p><p className="text-sm text-slate-500 mt-0.5">Pagadas</p></div>
        </div>
      )}
      {loading ? <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div> : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Agente</th>
              <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monto</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Acciones</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {commissions.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{c.agent_name || c.agent_id?.slice(0,8)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">${(c.amount / 100).toFixed(2)}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    c.status === 'approved' ? 'bg-indigo-50 text-indigo-700' :
                    c.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>{c.status}</span></td>
                  <td className="px-6 py-4">{c.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(c.id, 'approve')} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Aprobar</button>
                      <button onClick={() => handleAction(c.id, 'reject')} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">Rechazar</button>
                    </div>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
