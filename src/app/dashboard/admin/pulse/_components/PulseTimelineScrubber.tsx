"use client"

import { useMemo, useState } from 'react'
import { GitCommit, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PulseTimelineCommit } from '../_lib/types'
import styles from '../_styles/pulse.module.css'

interface Props {
  commits: PulseTimelineCommit[]
  selectedSha?: string
  onSelect: (sha: string) => void
  onReset: () => void
}

function fmt(ts: number) {
  const d = new Date(ts * 1000)
  return d.toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function PulseTimelineScrubber({ commits, selectedSha, onSelect, onReset }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  // newest first → reverse for left-to-right oldest→newest scrubber
  const ordered = useMemo(() => [...commits].sort((a, b) => a.timestamp - b.timestamp), [commits])
  const total = ordered.length

  const selectedIdx = selectedSha
    ? ordered.findIndex((c) => c.sha === selectedSha)
    : total - 1
  const idx = selectedIdx >= 0 ? selectedIdx : total - 1

  const current = hoverIdx !== null ? ordered[hoverIdx] : ordered[idx]

  function moveTo(delta: number) {
    const next = Math.min(Math.max(0, idx + delta), total - 1)
    onSelect(ordered[next].sha)
  }

  return (
    <div className={`${styles.glassStrong} rounded-2xl px-5 py-3 flex items-center gap-4`}>
      <button
        onClick={() => moveTo(-1)}
        className="text-slate-400 hover:text-indigo-300 transition disabled:opacity-30"
        disabled={idx <= 0}
        aria-label="Anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 relative">
        {/* track */}
        <div className="h-1 bg-slate-800/60 rounded-full relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500/80 to-violet-500/80 rounded-full"
            style={{ width: total > 1 ? `${(idx / (total - 1)) * 100}%` : '0%' }}
          />
        </div>

        {/* commit dots */}
        <div className="absolute inset-x-0 -top-1.5 flex justify-between pointer-events-none">
          {ordered.map((c, i) => {
            const isCurrent = i === idx
            const isHover = i === hoverIdx
            return (
              <button
                key={c.sha}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => onSelect(c.sha)}
                className="pointer-events-auto group"
                title={`${c.short_sha} · ${c.message}`}
                style={{ width: 14, height: 14 }}
              >
                <span
                  className={`block rounded-full transition-all ${
                    isCurrent
                      ? 'w-3.5 h-3.5 bg-indigo-300 shadow-[0_0_12px_rgba(165,180,252,0.7)]'
                      : isHover
                        ? 'w-3 h-3 bg-violet-300'
                        : 'w-2 h-2 bg-slate-500 group-hover:bg-slate-300'
                  } mx-auto mt-1`}
                />
              </button>
            )
          })}
        </div>

        {/* timeline tooltip */}
        {current && (
          <div className="mt-4 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
              <span>{fmt(ordered[0]?.timestamp ?? 0)}</span>
              <span>—</span>
              <span>now</span>
            </div>
            <div className={`${styles.fadeIn} flex-1 flex items-center gap-2 truncate`}>
              <GitCommit className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="font-mono text-slate-300 shrink-0">{current.short_sha}</span>
              <span className="text-slate-400 truncate">{current.message}</span>
              <span className="text-slate-600 shrink-0">· {fmt(current.timestamp)}</span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => moveTo(1)}
        className="text-slate-400 hover:text-indigo-300 transition disabled:opacity-30"
        disabled={idx >= total - 1}
        aria-label="Siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <button
        onClick={onReset}
        className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 hover:text-indigo-300 transition px-2.5 py-1 rounded-md border border-slate-700/40 hover:border-indigo-400/40"
      >
        Now
      </button>
    </div>
  )
}
