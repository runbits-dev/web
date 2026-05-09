"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Bot, Play, Power, ArrowLeft } from 'lucide-react'
import { runticsApi, type Agent, type Run, statusColor, formatRelative, formatUsd } from '../../_lib'

export default function AgentDetailClient() {
  const params = useParams<{ id: string }>()
  const id = params?.id ? decodeURIComponent(params.id) : ''
  const [data, setData] = useState<{ agent: Agent; last_run: Run | null; tenant_status: string | null } | null>(null)
  const [runs, setRuns] = useState<Run[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setError(null)
    try {
      const a = await runticsApi.agent(id)
      setData(a)
      const r = await runticsApi.runs({ agent_id: id, limit: 50 })
      setRuns(r.runs)
    } catch (e: any) {
      setError(e?.message ?? 'Error')
    }
  }

  useEffect(() => {
    if (id) void load()
  }, [id])

  if (!id) return null
  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <p className="text-amber-700 text-sm">{error}</p>
      </div>
    )
  }
  if (!data) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />

  const a = data.agent
  const enabled = (data.tenant_status ?? a.status) === 'enabled'
  let cfg: any = {}
  try { cfg = JSON.parse(a.config_json) } catch {}

  async function runNow() {
    setBusy(true)
    try {
      const r = await runticsApi.runAgent(id)
      alert(`Run encolado: ${r.run_id}`)
      await load()
    } catch (e: any) {
      alert(e?.message ?? 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function toggle() {
    setBusy(true)
    try {
      const newStatus = enabled ? 'disabled' : 'enabled'
      await runticsApi.toggleAgent(id, newStatus)
      await load()
    } catch (e: any) {
      alert(e?.message ?? 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/dashboard/runtics" className="hover:text-slate-600">Runtics</Link>
          <span>/</span>
          <Link href="/dashboard/runtics/agents" className="hover:text-slate-600">Agents</Link>
          <span>/</span>
          <span>{a.id}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-slate-700" />
          {a.id}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{a.description ?? '—'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={runNow}
          disabled={busy || !enabled}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Play className="w-4 h-4" /> Run now
        </button>
        <button
          onClick={toggle}
          disabled={busy}
          className={`text-sm font-semibold px-4 py-2 rounded-xl ring-1 inline-flex items-center gap-2 disabled:opacity-50 ${
            enabled ? 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          }`}
        >
          <Power className="w-4 h-4" /> {enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500">Versión</p>
          <p className="text-lg font-bold text-slate-900 mt-1">v{a.version}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500">Estado</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{enabled ? 'enabled' : 'disabled'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500">Owner</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{a.owner_email ?? '—'}</p>
        </div>
      </div>

      {/* Cost cap */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Cost cap</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Por run</p>
            <p className="font-bold">${cfg.cost_cap?.per_run_usd ?? 2}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Por día</p>
            <p className="font-bold">${cfg.cost_cap?.per_day_usd ?? 5}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Por mes</p>
            <p className="font-bold">${cfg.cost_cap?.per_month_usd ?? 30}</p>
          </div>
        </div>
      </div>

      {/* Triggers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Triggers</h3>
        <ul className="space-y-1 text-sm text-slate-600">
          {(cfg.triggers ?? []).map((t: any, i: number) => (
            <li key={i} className="font-mono text-xs">
              {t.type === 'cron' && <>cron <span className="text-slate-400">{t.schedule}</span> → {JSON.stringify(t.args ?? {})}</>}
              {t.type === 'webhook' && <>webhook <span className="text-slate-400">{t.path}</span> → {JSON.stringify(t.args ?? {})}</>}
              {t.type === 'manual' && <>manual</>}
            </li>
          ))}
          {(!cfg.triggers || cfg.triggers.length === 0) && <li className="text-slate-400">— sin triggers automáticos</li>}
        </ul>
      </div>

      {/* Run history */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Runs recientes</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {runs?.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/runtics/runs/${encodeURIComponent(r.id)}`}
              className="block px-5 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-700 truncate">{r.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">
                    {r.trigger_type} · {formatRelative(r.started_at)}{' '}
                    {r.cost_usd > 0 && <>· {formatUsd(r.cost_usd)}</>}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${statusColor(r.status)}`}
                >
                  {r.status}
                </span>
              </div>
            </Link>
          ))}
          {runs && runs.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Sin runs todavía.</p>
          )}
        </div>
      </div>
    </div>
  )
}
