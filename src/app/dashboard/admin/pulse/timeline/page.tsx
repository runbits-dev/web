"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, GitCommit, Plus, Minus, Pencil, AlertTriangle } from 'lucide-react'

import { getPulseTimeline, getPulseChanges } from '../_lib/api'
import type { PulseTimelineCommit, PulseChanges } from '../_lib/types'
import styles from '../_styles/pulse.module.css'

function fmtTs(ts: number) {
  const d = new Date(ts * 1000)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PulseTimelinePage() {
  const [commits, setCommits] = useState<PulseTimelineCommit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShas, setSelectedShas] = useState<string[]>([])
  const [diff, setDiff] = useState<PulseChanges | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)

  useEffect(() => {
    getPulseTimeline(100).then((res) => {
      setCommits(res.data)
      setLoading(false)
    })
  }, [])

  // When user selects two commits, fetch the diff.
  useEffect(() => {
    if (selectedShas.length === 2) {
      setDiffLoading(true)
      getPulseChanges(selectedShas[0], selectedShas[1])
        .then((res) => setDiff(res.data))
        .finally(() => setDiffLoading(false))
    } else {
      setDiff(null)
    }
  }, [selectedShas])

  function toggleSelect(sha: string) {
    setSelectedShas((curr) => {
      if (curr.includes(sha)) return curr.filter((x) => x !== sha)
      const next = [...curr, sha]
      // cap at 2 — drop oldest
      if (next.length > 2) next.shift()
      return next
    })
  }

  const grouped = useMemo(() => {
    const byDay = new Map<string, PulseTimelineCommit[]>()
    for (const c of commits) {
      const day = new Date(c.timestamp * 1000).toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
      const arr = byDay.get(day) ?? []
      arr.push(c)
      byDay.set(day, arr)
    }
    return Array.from(byDay.entries())
  }, [commits])

  return (
    <div className={styles.shell}>
      {/* Header */}
      <header className="relative z-20 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/dashboard/admin/pulse" className="text-xs text-slate-500 hover:text-indigo-300 transition shrink-0">
            ← Map
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-300" />
            <h1 className="text-base font-bold text-slate-100">Timeline</h1>
            <span className="text-xs text-slate-500">state-as-git scrubber</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <NavTab href="/dashboard/admin/pulse" label="Map" />
          <NavTab href="/dashboard/admin/pulse/timeline" label="Timeline" active />
          <NavTab href="/dashboard/admin/pulse/drift" label="Drift" />
        </nav>

        <div className="text-[11px] text-slate-400">
          {selectedShas.length === 0 && 'Seleccioná 2 commits para comparar'}
          {selectedShas.length === 1 && 'Seleccioná 1 commit más para diff'}
          {selectedShas.length === 2 && 'Comparando 2 commits ↓'}
        </div>
      </header>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto ${styles.scroll} px-4 lg:px-8 py-6`}>
        {loading ? (
          <div className="text-center text-slate-400 text-sm">Cargando commits…</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {grouped.map(([day, dayCommits]) => (
              <section key={day}>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-3 sticky top-0 py-2">
                  {day}
                </div>
                <ol className="relative border-l-2 border-indigo-500/20 ml-3 space-y-3">
                  {dayCommits.map((c) => {
                    const selected = selectedShas.includes(c.sha)
                    return (
                      <li key={c.sha} className="pl-6 relative">
                        <span
                          className={`absolute -left-[9px] top-3 w-4 h-4 rounded-full border-2 transition-all ${
                            selected
                              ? 'bg-indigo-400 border-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.7)]'
                              : 'bg-slate-900 border-slate-600'
                          }`}
                        />
                        <button
                          onClick={() => toggleSelect(c.sha)}
                          className={`${styles.glass} w-full text-left rounded-xl px-4 py-3 hover:border-indigo-400/40 transition-all ${
                            selected ? 'ring-2 ring-indigo-400/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <GitCommit className="w-3.5 h-3.5 text-indigo-300" />
                                <span className="font-mono text-xs text-slate-300">{c.short_sha}</span>
                                <span className="text-[10px] text-slate-500">· {c.author}</span>
                                <span className="text-[10px] text-slate-600">· {fmtTs(c.timestamp)}</span>
                              </div>
                              <div className="text-sm text-slate-100">{c.message}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-[11px]">
                              {c.added > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-300">
                                  <Plus className="w-3 h-3" /> {c.added}
                                </span>
                              )}
                              {c.modified > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-amber-300">
                                  <Pencil className="w-3 h-3" /> {c.modified}
                                </span>
                              )}
                              {c.removed > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-rose-300">
                                  <Minus className="w-3 h-3" /> {c.removed}
                                </span>
                              )}
                              {c.drift_delta !== 0 && (
                                <span
                                  className={`inline-flex items-center gap-0.5 ${
                                    c.drift_delta > 0 ? 'text-red-300' : 'text-emerald-300'
                                  }`}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {c.drift_delta > 0 ? '+' : ''}
                                  {c.drift_delta}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Diff panel — when two selected */}
      {selectedShas.length === 2 && (
        <div className={`${styles.glassStrong} fixed bottom-4 left-1/2 -translate-x-1/2 z-30 rounded-2xl px-5 py-4 w-[680px] max-w-[calc(100vw-32px)]`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-300 font-semibold">
              Diff <span className="font-mono text-indigo-300">{selectedShas[0].slice(0, 7)}</span>
              <span className="text-slate-500 mx-1">→</span>
              <span className="font-mono text-indigo-300">{selectedShas[1].slice(0, 7)}</span>
            </div>
            <button
              onClick={() => setSelectedShas([])}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              limpiar
            </button>
          </div>
          {diffLoading ? (
            <div className="text-sm text-slate-400">Calculando diff…</div>
          ) : diff ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <DiffStat label="Recursos agregados" value={diff.added_resources.length} accent="emerald" />
              <DiffStat label="Recursos eliminados" value={diff.removed_resources.length} accent="red" />
              <DiffStat label="Recursos modificados" value={diff.modified_resources.length} accent="amber" />
              <DiffStat label="Edges agregadas" value={diff.added_edges.length} accent="indigo" />
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Backend pulse-changes no disponible — mostrando placeholder. Cuando esté live, este panel renderiza el diff completo.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NavTab({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40'
          : 'text-slate-400 hover:text-indigo-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      {label}
    </Link>
  )
}

function DiffStat({ label, value, accent }: { label: string; value: number; accent: 'emerald' | 'red' | 'amber' | 'indigo' }) {
  const colors = {
    emerald: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(52,211,153,0.4)', text: '#a7f3d0' },
    red:     { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(248,113,113,0.4)', text: '#fecaca' },
    amber:   { bg: 'rgba(245,158,11,0.15)', border: 'rgba(251,191,36,0.4)', text: '#fde68a' },
    indigo:  { bg: 'rgba(99,102,241,0.15)', border: 'rgba(129,140,248,0.4)', text: '#c7d2fe' },
  }[accent]
  return (
    <div
      className="rounded-lg px-3 py-2 border"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
      <div className="text-xl font-bold" style={{ color: colors.text }}>{value}</div>
    </div>
  )
}
