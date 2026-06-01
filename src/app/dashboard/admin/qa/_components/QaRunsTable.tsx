"use client"

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { QaStatusBadge } from './QaStatusBadge'
import {
  formatRelativeUnix,
  runDuration,
} from '../_lib/api'
import type { QaRun } from '../_lib/types'

interface QaRunsTableProps {
  runs: QaRun[]
}

export function QaRunsTable({ runs }: QaRunsTableProps) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Sin runs todavía</p>
        <p className="text-xs text-slate-400 mt-1">
          Click <span className="font-semibold text-slate-700">+ Validate</span> para disparar tu primera validación.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Desktop table */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
            <th className="text-left font-semibold px-5 py-3">Subject</th>
            <th className="text-left font-semibold px-3 py-3">Scope</th>
            <th className="text-left font-semibold px-3 py-3">Status</th>
            <th className="text-left font-semibold px-3 py-3">Started</th>
            <th className="text-left font-semibold px-3 py-3">Duration</th>
            <th className="text-left font-semibold px-3 py-3">Triggered by</th>
            <th className="text-right font-semibold px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {runs.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[260px]">{r.subject}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-[260px]">{r.id.slice(0, 12)}</p>
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs font-medium text-slate-600">{r.scope}</span>
              </td>
              <td className="px-3 py-3">
                <QaStatusBadge status={r.status} />
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-slate-600">{formatRelativeUnix(r.started_at)}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-slate-600 font-mono">{runDuration(r)}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-slate-600 truncate">{r.triggered_by || '—'}</span>
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  href={`/dashboard/admin/qa/run?id=${encodeURIComponent(r.id)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Ver <ArrowRight className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile list */}
      <ul className="md:hidden divide-y divide-slate-100">
        {runs.map((r) => (
          <li key={r.id}>
            <Link
              href={`/dashboard/admin/qa/run?id=${encodeURIComponent(r.id)}`}
              className="block px-5 py-4 hover:bg-slate-50/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{r.subject}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {r.scope} · {formatRelativeUnix(r.started_at)} · {runDuration(r)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    triggered by {r.triggered_by || '—'}
                  </p>
                </div>
                <QaStatusBadge status={r.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function QaRunsTableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 h-10" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <div className="h-3 bg-slate-100 rounded w-48 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-12 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-20 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-16 animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
