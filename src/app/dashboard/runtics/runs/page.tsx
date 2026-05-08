"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { runticsApi, type Run, statusColor, formatRelative, formatUsd } from '../_lib'
import { Activity } from 'lucide-react'

export default function RunsListPage() {
  const [runs, setRuns] = useState<Run[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  async function load() {
    setError(null)
    try {
      const r = await runticsApi.runs({ status: statusFilter || undefined, limit: 100 })
      setRuns(r.runs)
    } catch (e: any) {
      setError(e?.message ?? 'Error')
    }
  }

  useEffect(() => {
    void load()
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/dashboard/runtics" className="hover:text-slate-600">Runtics</Link>
          <span>/</span>
          <span>Runs</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-slate-700" /> Runs
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'running', 'completed', 'failed', 'killed_budget'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ${
              statusFilter === s ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s || 'all'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {runs?.map((r) => (
          <Link key={r.id} href={`/dashboard/runtics/runs/${encodeURIComponent(r.id)}`} className="block px-5 py-3 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{r.agent_id}</p>
                <p className="text-xs text-slate-500 truncate">
                  <span className="font-mono">{r.id.slice(0, 8)}</span> · {r.trigger_type} · {formatRelative(r.started_at)}
                  {r.cost_usd > 0 && <> · {formatUsd(r.cost_usd)}</>}
                  {r.duration_ms && <> · {(r.duration_ms / 1000).toFixed(1)}s</>}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${statusColor(r.status)}`}>
                {r.status}
              </span>
            </div>
          </Link>
        ))}
        {runs && runs.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Sin runs.</p>
        )}
      </div>
    </div>
  )
}
