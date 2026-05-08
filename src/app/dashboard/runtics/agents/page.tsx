"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, Play, Power } from 'lucide-react'
import { runticsApi, type Agent } from '../_lib'

export default function AgentsListPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const r = await runticsApi.agents()
      setAgents(r.agents)
    } catch (e: any) {
      setError(e?.message ?? 'Error')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggle(a: Agent) {
    const newStatus: 'enabled' | 'disabled' = (a.tenant_status ?? a.status) === 'enabled' ? 'disabled' : 'enabled'
    setBusy(a.id)
    try {
      await runticsApi.toggleAgent(a.id, newStatus)
      await load()
    } catch (e: any) {
      alert(e?.message ?? 'Error')
    } finally {
      setBusy(null)
    }
  }

  async function runNow(a: Agent) {
    setBusy(a.id)
    try {
      const r = await runticsApi.runAgent(a.id)
      alert(`Run encolado: ${r.run_id}`)
    } catch (e: any) {
      alert(e?.message ?? 'Error')
    } finally {
      setBusy(null)
    }
  }

  if (!agents && !error) {
    return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />
  }
  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <p className="text-amber-700 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/dashboard/runtics" className="hover:text-slate-600">Runtics</Link>
          <span>/</span>
          <span>Agents</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-slate-700" />
          Agents
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {agents!.map((a) => {
          const enabled = (a.tenant_status ?? a.status) === 'enabled'
          let cfg: any = {}
          try { cfg = JSON.parse(a.config_json) } catch {}
          const cap = cfg.cost_cap ?? {}
          return (
            <div key={a.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/runtics/agents/${encodeURIComponent(a.id)}`} className="font-semibold text-slate-900 text-sm hover:underline">
                    {a.id}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">{a.description ?? '—'}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">v{a.version}</span>
                    {cap.per_run_usd != null && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                        ${cap.per_run_usd}/run · ${cap.per_day_usd}/day · ${cap.per_month_usd}/mo
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => runNow(a)}
                    disabled={busy === a.id || !enabled}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Run
                  </button>
                  <button
                    onClick={() => toggle(a)}
                    disabled={busy === a.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg ring-1 inline-flex items-center gap-1 disabled:opacity-50 ${
                      enabled ? 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50' : 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-3 h-3" /> {enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {agents!.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No hay agents registrados.</p>
        )}
      </div>
    </div>
  )
}
