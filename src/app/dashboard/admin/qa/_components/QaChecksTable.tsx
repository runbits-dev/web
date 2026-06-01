"use client"

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { QaCheckBadge } from './QaStatusBadge'
import { formatDurationMs } from '../_lib/api'
import type { QaCheckResult } from '../_lib/types'

interface QaChecksTableProps {
  checks: QaCheckResult[]
}

export function QaChecksTable({ checks }: QaChecksTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  if (checks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-8 text-center">
        <p className="text-sm text-slate-400">Checks aún no disponibles.</p>
        <p className="text-[11px] text-slate-400 mt-1">Aparecen a medida que el run avanza.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900">Checks ({checks.length})</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {checks.map((c) => {
          const isOpen = expanded.has(c.check_name)
          const hasExcerpt = !!c.output_excerpt && c.output_excerpt.trim().length > 0
          return (
            <li key={c.check_name}>
              <button
                type="button"
                onClick={() => hasExcerpt && toggle(c.check_name)}
                disabled={!hasExcerpt}
                className={`w-full px-5 py-3 flex items-center gap-3 text-left ${hasExcerpt ? 'hover:bg-slate-50/60 cursor-pointer' : 'cursor-default'}`}
              >
                <div className="w-4 shrink-0 text-slate-400">
                  {hasExcerpt ? (
                    isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 font-mono">{c.check_name}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono shrink-0">{formatDurationMs(c.duration_ms)}</span>
                <QaCheckBadge status={c.status} />
              </button>
              {isOpen && hasExcerpt && (
                <div className="px-5 pb-4 pl-12">
                  <pre className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-72">
                    {c.output_excerpt}
                  </pre>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
