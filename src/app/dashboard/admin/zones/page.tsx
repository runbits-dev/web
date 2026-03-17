"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AdminZonesPage() {
  const [zones, setZones] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getZones().then(setZones).finally(() => setLoading(false)) }, [])

  async function create() {
    if (!newName.trim()) return
    await api.createZone(newName.trim())
    setNewName('')
    setZones(await api.getZones())
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Zonas</h1>
        <p className="text-slate-500 text-sm mt-1">{zones.length} zonas</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="flex gap-3">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Nombre de la nueva zona..."
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={e => e.key === 'Enter' && create()} />
          <button onClick={create} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">+ Crear zona</button>
        </div>
      </div>
      {loading ? <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div> : zones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center"><p className="text-slate-400 text-sm">No hay zonas creadas</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">País</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Moneda</th>
              <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">IIBB</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map(z => (
                <tr key={z.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{z.name}</td>
                  <td className="px-6 py-4 text-slate-600">{z.country}</td>
                  <td className="px-6 py-4 text-slate-600">{z.currency}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">{((z.iibb_rate || 0) * 100).toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
