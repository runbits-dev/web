"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { runticsApi, type AuditEntry, formatTime } from '../_lib'
import { ClipboardList } from 'lucide-react'

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    runticsApi.auditLog({ limit: 200 }).then((r) => setEntries(r.entries)).catch((e) => setError(e?.message ?? 'Error'))
  }, [])

  if (error) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-700">{error}</div>
  if (!entries) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/dashboard/runtics" className="hover:text-slate-600">Runtics</Link>
          <span>/</span>
          <span>Audit log</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-slate-700" /> Audit log
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {entries.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Sin entradas.</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{e.action}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {e.actor} {e.target_type ? `· ${e.target_type}/${e.target_id?.slice(0, 8) ?? '—'}` : ''}
                  {e.ip ? ` · ${e.ip}` : ''}
                </p>
                {e.metadata_json && (
                  <details className="mt-1 text-xs text-slate-500">
                    <summary className="cursor-pointer">metadata</summary>
                    <pre className="mt-1 overflow-x-auto">{e.metadata_json}</pre>
                  </details>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatTime(e.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
