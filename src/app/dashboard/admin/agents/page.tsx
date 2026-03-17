"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getAgents().then(r => setAgents(r.data || [])).finally(() => setLoading(false)) }, [])

  async function handleAction(id: string, action: 'approve' | 'activate' | 'suspend') {
    if (action === 'approve') await api.approveAgent(id)
    else if (action === 'activate') await api.activateAgent(id)
    else await api.suspendAgent(id)
    setAgents(await api.getAgents().then(r => r.data || []))
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Agentes</h1>
        <p className="text-slate-500 text-sm mt-1">{agents.length} agentes</p>
      </div>
      {loading ? <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div> : agents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center"><p className="text-slate-400 text-sm">No hay agentes</p></div>
      ) : (
        <div className="grid gap-4">
          {agents.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div><p className="font-semibold text-slate-900">{a.name}</p><p className="text-sm text-slate-500">{a.email}</p></div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  a.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  a.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>{a.status}</span>
                {a.status === 'pending' && <button onClick={() => handleAction(a.id, 'approve')} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">Aprobar</button>}
                {a.status === 'approved' && <button onClick={() => handleAction(a.id, 'activate')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">Activar</button>}
                {a.status === 'active' && <button onClick={() => handleAction(a.id, 'suspend')} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">Suspender</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
