"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { runticsApi, type Finding, severityColor, formatRelative } from '../_lib'
import { AlertTriangle, Check, X } from 'lucide-react'

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusF, setStatusF] = useState('open')
  const [sevF, setSevF] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const r = await runticsApi.findings({ status: statusF, severity: sevF || undefined, limit: 100 })
      setFindings(r.findings)
    } catch (e: any) {
      setError(e?.message ?? 'Error')
    }
  }
  useEffect(() => { void load() }, [statusF, sevF])

  async function patch(id: string, status: 'acknowledged' | 'closed' | 'open') {
    setBusy(id)
    try {
      await runticsApi.patchFinding(id, status)
      await load()
    } catch (e: any) {
      alert(e?.message ?? 'Error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/dashboard/runtics" className="hover:text-slate-600">Runtics</Link>
          <span>/</span>
          <span>Findings</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-slate-700" /> Findings
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {['open', 'acknowledged', 'closed'].map((s) => (
          <button key={s} onClick={() => setStatusF(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ${statusF === s ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200'}`}>
            {s}
          </button>
        ))}
        <span className="w-px bg-slate-200 mx-1" />
        {['', 'critical', 'high', 'medium', 'low', 'info'].map((s) => (
          <button key={s || 'all'} onClick={() => setSevF(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ${sevF === s ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200'}`}>
            {s || 'all sev'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {findings?.map((f) => (
          <div key={f.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <Link href={`/dashboard/runtics/runs/${encodeURIComponent(f.run_id)}`} className="hover:underline">
                    run {f.run_id.slice(0, 8)}
                  </Link>{' '}· {f.agent_id} · {f.category ?? '—'} · {formatRelative(f.created_at)}
                </p>
                {f.description && <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{f.description}</p>}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${severityColor(f.severity)}`}>
                  {f.severity}
                </span>
                {f.status === 'open' && (
                  <>
                    <button onClick={() => patch(f.id, 'acknowledged')} disabled={busy === f.id} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-50 inline-flex items-center gap-1">
                      Ack
                    </button>
                    <button onClick={() => patch(f.id, 'closed')} disabled={busy === f.id} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Close
                    </button>
                  </>
                )}
                {f.status === 'acknowledged' && (
                  <button onClick={() => patch(f.id, 'closed')} disabled={busy === f.id} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Close
                  </button>
                )}
                {f.status !== 'open' && (
                  <button onClick={() => patch(f.id, 'open')} disabled={busy === f.id} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1">
                    <X className="w-3 h-3" /> Reopen
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {findings && findings.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Sin findings que coincidan.</p>
        )}
      </div>
    </div>
  )
}
