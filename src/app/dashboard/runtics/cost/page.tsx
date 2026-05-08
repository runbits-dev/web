"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { runticsApi, type CostBreakdown, formatUsd } from '../_lib'
import { DollarSign } from 'lucide-react'

export default function CostPage() {
  const [data, setData] = useState<CostBreakdown | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    runticsApi.cost().then(setData).catch((e) => setError(e?.message ?? 'Error'))
  }, [])

  if (error) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-700">{error}</div>
  if (!data) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />

  const tenant = data.tenant
  const tenantPct = tenant && tenant.budget_monthly_usd > 0
    ? Math.min(100, (tenant.budget_used_this_month_usd / tenant.budget_monthly_usd) * 100) : 0
  const globalPct = data.global.budget_usd > 0
    ? Math.min(100, (data.global.used_usd / data.global.budget_usd) * 100) : 0

  // Pivot by_day into agent x day matrix
  const days = Array.from(new Set(data.by_day.map((d) => d.day))).sort()
  const agents = Array.from(new Set(data.by_day.map((d) => d.agent_id))).sort()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/dashboard/runtics" className="hover:text-slate-600">Runtics</Link>
          <span>/</span>
          <span>Cost</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-slate-700" /> Cost · {data.month_key}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500">Tenant: {tenant?.name ?? '—'}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {tenant ? formatUsd(tenant.budget_used_this_month_usd) : '—'}
            <span className="text-sm font-medium text-slate-400"> / {tenant ? formatUsd(tenant.budget_monthly_usd) : '—'}</span>
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${tenantPct > 80 ? 'bg-red-500' : tenantPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${tenantPct}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500">Global (todos los tenants)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatUsd(data.global.used_usd)}
            <span className="text-sm font-medium text-slate-400"> / {formatUsd(data.global.budget_usd)}</span>
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${globalPct > 80 ? 'bg-red-500' : globalPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${globalPct}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Por agent · mes</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {data.by_agent.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Sin gasto este mes.</p>
          )}
          {data.by_agent.map((a) => (
            <div key={a.agent_id} className="px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{a.agent_id}</p>
              <p className="text-sm text-slate-700">
                {formatUsd(a.cost_usd)} · {a.runs_count} runs
              </p>
            </div>
          ))}
        </div>
      </div>

      {agents.length > 0 && days.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Por día · agent</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2">Día</th>
                  {agents.map((a) => (
                    <th key={a} className="text-left px-4 py-2">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {days.map((d) => (
                  <tr key={d}>
                    <td className="px-4 py-2 text-slate-700">{d}</td>
                    {agents.map((a) => {
                      const row = data.by_day.find((x) => x.day === d && x.agent_id === a)
                      return <td key={a} className="px-4 py-2 text-slate-600">{row ? formatUsd(row.cost_usd) : '—'}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
