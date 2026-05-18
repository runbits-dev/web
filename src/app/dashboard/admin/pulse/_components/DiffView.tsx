"use client"

import { useMemo } from 'react'
import styles from '../_styles/pulse.module.css'

interface DiffViewProps {
  before: string
  after: string
  labelBefore?: string
  labelAfter?: string
}

/**
 * Lightweight line-diff. Not a full LCS — we tokenize each side by line and
 * mark any line not present in the other side as added/removed. Good enough
 * for short JSON specs and avoids pulling in a diff library.
 */
function diffLines(beforeText: string, afterText: string) {
  const beforeLines = beforeText.split('\n')
  const afterLines = afterText.split('\n')
  const beforeSet = new Set(beforeLines)
  const afterSet = new Set(afterLines)
  return {
    before: beforeLines.map((line) => ({
      line,
      status: afterSet.has(line) ? 'same' : 'removed',
    })),
    after: afterLines.map((line) => ({
      line,
      status: beforeSet.has(line) ? 'same' : 'added',
    })),
  }
}

export function DiffView({ before, after, labelBefore = 'Declarado', labelAfter = 'Observado' }: DiffViewProps) {
  const diff = useMemo(() => diffLines(before, after), [before, after])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="rounded-lg border border-slate-700/40 bg-slate-950/60 overflow-hidden">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 py-2 border-b border-slate-700/40 bg-slate-900/60">
          {labelBefore}
        </div>
        <pre className={`text-xs leading-relaxed font-mono p-3 overflow-x-auto max-h-80 overflow-y-auto ${styles.scroll}`}>
          {diff.before.map((entry, i) => (
            <div
              key={i}
              className={
                entry.status === 'removed' ? styles.diffRemove + ' -mx-3 px-3' : styles.diffMeta
              }
            >
              <span className="inline-block w-4 text-slate-600 select-none">
                {entry.status === 'removed' ? '-' : ' '}
              </span>
              <span className={entry.status === 'removed' ? 'text-rose-200' : 'text-slate-300'}>
                {entry.line || ' '}
              </span>
            </div>
          ))}
        </pre>
      </div>

      <div className="rounded-lg border border-slate-700/40 bg-slate-950/60 overflow-hidden">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 py-2 border-b border-slate-700/40 bg-slate-900/60">
          {labelAfter}
        </div>
        <pre className={`text-xs leading-relaxed font-mono p-3 overflow-x-auto max-h-80 overflow-y-auto ${styles.scroll}`}>
          {diff.after.map((entry, i) => (
            <div
              key={i}
              className={
                entry.status === 'added' ? styles.diffAdd + ' -mx-3 px-3' : styles.diffMeta
              }
            >
              <span className="inline-block w-4 text-slate-600 select-none">
                {entry.status === 'added' ? '+' : ' '}
              </span>
              <span className={entry.status === 'added' ? 'text-emerald-200' : 'text-slate-300'}>
                {entry.line || ' '}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}
