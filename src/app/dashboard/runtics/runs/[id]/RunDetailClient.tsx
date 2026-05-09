"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { runticsApi, type Run, type Finding, statusColor, severityColor, formatTime, formatUsd } from '../../_lib'
import { Activity } from 'lucide-react'

export default function RunDetailClient() {
  const params = useParams<{ id: string }>()
  const id = params?.id ? decodeURIComponent(params.id) : ''
  const [data, setData] = useState<{ run: Run; findings: Finding[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    runticsApi.run(id)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'Error') })
    return () => { cancelled = true }
  }, [id])

  if (!id) return null
  if (error) {
    return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 text-sm">{error}</div>
  }
  if (!data) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />

  const r = data.run
  let triggerMeta: any = null
  let outputObj: any = null
  try { triggerMeta = r.trigger_metadata_json ? JSON.parse(r.trigger_metadata_json) : null } catch {}
  try { outputObj = r.output_json ? JSON.parse(r.output_json) : null } catch {}

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/dashboard/runtics" className="hover:text-slate-600">Runtics</Link>
          <span>/</span>
          <Link href="/dashboard/runtics/runs" className="hover:text-slate-600">Runs</Link>
          <span>/</span>
          <span className="font-mono">{r.id.slice(0, 8)}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-slate-700" />
          {r.agent_id}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full ring-1 font-bold uppercase ${statusColor(r.status)}`}>{r.status}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">{r.trigger_type}</span>
          {r.cost_usd > 0 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">{formatUsd(r.cost_usd)}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Iniciado" value={formatTime(r.started_at)} />
        <Card label="Completado" value={formatTime(r.completed_at)} />
        <Card label="Duración" value={r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'} />
        <Card label="Tokens IN" value={r.tokens_input.toString()} />
        <Card label="Tokens OUT" value={r.tokens_output.toString()} />
        <Card label="Costo" value={formatUsd(r.cost_usd)} />
      </div>

      {r.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Error</p>
          <pre className="text-sm text-red-800 mt-2 whitespace-pre-wrap break-all">{r.error_message}</pre>
        </div>
      )}

      {triggerMeta && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Trigger metadata</h3>
          <pre className="text-xs text-slate-600 overflow-x-auto">{JSON.stringify(triggerMeta, null, 2)}</pre>
        </div>
      )}

      {outputObj && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Output</h3>
          <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(outputObj, null, 2)}</pre>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Findings ({data.findings.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {data.findings.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Sin findings.</p>
          )}
          {data.findings.map((f) => (
            <div key={f.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                  {f.description && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{f.description}</p>}
                  {f.metadata_json && (
                    <details className="mt-2 text-xs text-slate-500">
                      <summary className="cursor-pointer">metadata</summary>
                      <pre className="mt-1 overflow-x-auto">{f.metadata_json}</pre>
                    </details>
                  )}
                </div>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${severityColor(f.severity)}`}>
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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  )
}
