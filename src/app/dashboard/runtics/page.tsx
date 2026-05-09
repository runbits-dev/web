"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, Play, AlertTriangle, ArrowRight, Activity, DollarSign, Plug } from 'lucide-react'
import {
  runticsApi,
  type Overview,
  severityColor,
  statusColor,
  formatRelative,
  formatUsd,
} from './_lib'

export default function RunticsOverviewPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const o = await runticsApi.overview()
        if (!cancelled) setData(o)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-40 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <p className="text-amber-700 text-sm">No pudimos cargar Runtics: {error ?? 'desconocido'}</p>
      </div>
    )
  }

  const tenant = data.tenant
  const budgetPct = tenant && tenant.budget_monthly_usd > 0
    ? Math.min(100, Math.round((tenant.budget_used_this_month_usd / tenant.budget_monthly_usd) * 100))
    : 0
  const enabled = data.agents.filter((a) => (a.tenant_status ?? a.status) === 'enabled')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Bot className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Runtics</h1>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            beta
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Plataforma de agents agéntico — auditorías, monitoreo, oportunidades.
        </p>
        <div className="flex gap-2 mt-3">
          <Link
            href="/dashboard/runtics/connections"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1.5 transition-colors"
          >
            <Plug className="w-3 h-3" /> Conexiones
          </Link>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Agents activos</p>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {enabled.length}
            <span className="text-sm font-medium text-slate-400"> / {data.agents.length}</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Findings abiertos</p>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.open_findings.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            {data.open_findings.filter((f) => f.severity === 'critical').length} críticos · {data.open_findings.filter((f) => f.severity === 'high').length} altos
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Costo este mes</p>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {tenant ? formatUsd(tenant.budget_used_this_month_usd) : '—'}
            <span className="text-sm font-medium text-slate-400">
              {' '}/ {tenant ? formatUsd(tenant.budget_monthly_usd) : '—'}
            </span>
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${budgetPct > 80 ? 'bg-red-500' : budgetPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Agents list */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Agents</h2>
          <Link href="/dashboard/runtics/agents" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.agents.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No hay agents registrados.</p>
          )}
          {data.agents.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/runtics/agents/${encodeURIComponent(a.id)}`}
              className="block px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{a.id}</p>
                  <p className="text-xs text-slate-500 truncate">{a.description ?? '—'}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${
                    (a.tenant_status ?? a.status) === 'enabled'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-slate-100 text-slate-600 ring-slate-200'
                  }`}
                >
                  {a.tenant_status ?? a.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent runs */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Runs recientes</h2>
          <Link href="/dashboard/runtics/runs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recent_runs.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Todavía no hay runs.</p>
          )}
          {data.recent_runs.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/runtics/runs/${encodeURIComponent(r.id)}`}
              className="block px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{r.agent_id}</p>
                  <p className="text-xs text-slate-500">
                    {r.trigger_type} · {formatRelative(r.started_at)}
                    {r.cost_usd > 0 && <span> · {formatUsd(r.cost_usd)}</span>}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${statusColor(r.status)}`}
                >
                  {r.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Open findings */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Findings abiertos</h2>
          <Link href="/dashboard/runtics/findings" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            Gestionar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.open_findings.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No hay findings abiertos. ✅</p>
          )}
          {data.open_findings.slice(0, 8).map((f) => (
            <div key={f.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {f.agent_id} · {f.category ?? 'general'} · {formatRelative(f.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${severityColor(f.severity)}`}
                >
                  {f.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
