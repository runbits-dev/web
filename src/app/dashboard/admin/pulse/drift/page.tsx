"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, AlertCircle, Info, ExternalLink, ChevronDown, ChevronUp, Check } from 'lucide-react'

import { getPulseDrift, getPulseState } from '../_lib/api'
import type { PulseDriftEvent, PulseState, DriftStatus, DriftSeverity } from '../_lib/types'
import { SEVERITY_COLORS } from '../_lib/colors'
import { DiffView } from '../_components/DiffView'
import { PulseDriftBadge } from '../_components/PulseDriftBadge'
import styles from '../_styles/pulse.module.css'

const STATUS_TABS: Array<{ key: DriftStatus | 'all'; label: string }> = [
  { key: 'open', label: 'Abiertos' },
  { key: 'acknowledged', label: 'Reconocidos' },
  { key: 'resolved', label: 'Resueltos' },
  { key: 'all', label: 'Todos' },
]

const SEVERITY_FILTERS: Array<{ key: DriftSeverity; label: string; Icon: typeof AlertTriangle }> = [
  { key: 'critical', label: 'Critical', Icon: AlertTriangle },
  { key: 'warning',  label: 'Warning',  Icon: AlertCircle  },
  { key: 'info',     label: 'Info',     Icon: Info         },
]

function timeAgo(ts: number) {
  const now = Date.now() / 1000
  const diff = Math.max(0, now - ts)
  if (diff < 60) return `hace ${Math.floor(diff)}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

export default function PulseDriftPage() {
  const [drifts, setDrifts] = useState<PulseDriftEvent[]>([])
  const [state, setState] = useState<PulseState | null>(null)
  const [statusTab, setStatusTab] = useState<DriftStatus | 'all'>('open')
  const [sevFilters, setSevFilters] = useState<Set<DriftSeverity>>(new Set(['critical', 'warning', 'info']))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [ackingId, setAckingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [driftRes, stateRes] = await Promise.all([
      getPulseDrift(statusTab),
      getPulseState(),
    ])
    setDrifts(driftRes.data)
    setState(stateRes.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const filtered = useMemo(() => {
    return drifts.filter((d) => sevFilters.has(d.severity))
  }, [drifts, sevFilters])

  const counts = useMemo(() => {
    const c: Record<DriftSeverity, number> = { critical: 0, warning: 0, info: 0 }
    for (const d of drifts) c[d.severity]++
    return c
  }, [drifts])

  function toggleSev(s: DriftSeverity) {
    setSevFilters((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      if (next.size === 0) return new Set(['critical', 'warning', 'info'])
      return next
    })
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Optimistic ack — real backend call is no-op until deploy.
  function handleAck(id: string) {
    setAckingId(id)
    setTimeout(() => {
      setDrifts((cur) =>
        cur.map((d) => (d.id === id ? { ...d, status: 'acknowledged' } : d))
      )
      setAckingId(null)
    }, 400)
  }

  function resourceName(id: string) {
    return state?.resources.find((r) => r.id === id)?.name ?? id
  }

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
            <h1 className="text-base font-bold text-slate-100">Drift Events</h1>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {SEVERITY_FILTERS.map(({ key, Icon }) => (
              <span key={key} className="inline-flex items-center gap-1" style={{ color: SEVERITY_COLORS[key].border }}>
                <Icon className="w-3 h-3" /> {counts[key]}
              </span>
            ))}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <NavTab href="/dashboard/admin/pulse" label="Map" />
          <NavTab href="/dashboard/admin/pulse/timeline" label="Timeline" />
          <NavTab href="/dashboard/admin/pulse/drift" label="Drift" active />
        </nav>
      </header>

      {/* Filters */}
      <div className="px-4 lg:px-6 py-3 border-b border-white/5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {STATUS_TABS.map((t) => {
            const active = statusTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40'
                    : 'text-slate-400 hover:text-indigo-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {SEVERITY_FILTERS.map(({ key, label, Icon }) => {
            const active = sevFilters.has(key)
            const palette = SEVERITY_COLORS[key]
            return (
              <button
                key={key}
                onClick={() => toggleSev(key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  active ? '' : 'opacity-40'
                } ${palette.pill}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto ${styles.scroll} px-4 lg:px-8 py-6`}>
        <div className="max-w-5xl mx-auto space-y-3">
          {loading && <div className="text-slate-400 text-sm text-center">Cargando drifts…</div>}
          {!loading && filtered.length === 0 && (
            <div className={`${styles.glass} rounded-2xl px-6 py-12 text-center`}>
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-slate-200 font-semibold">Sin drift en {statusTab === 'all' ? 'todos los estados' : statusTab}</div>
              <div className="text-slate-500 text-sm mt-1">El stack coincide con lo declarado.</div>
            </div>
          )}
          {filtered.map((d) => {
            const isOpen = expanded.has(d.id)
            const palette = SEVERITY_COLORS[d.severity]
            return (
              <article
                key={d.id}
                className={`${styles.glass} rounded-2xl overflow-hidden border-l-4 transition-all`}
                style={{ borderLeftColor: palette.border }}
              >
                <button
                  onClick={() => toggleExpand(d.id)}
                  className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-white/[0.02] transition"
                >
                  <PulseDriftBadge severity={d.severity} pulse={d.status === 'open'} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {d.event_type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-xs text-indigo-300 font-mono">{resourceName(d.resource_id)}</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">{timeAgo(d.created_at)}</span>
                      {d.status !== 'open' && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-300 border border-slate-600/40">
                          {d.status}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100">{d.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{d.description}</p>
                  </div>
                  <div className="shrink-0 text-slate-500">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className={`${styles.fadeIn} px-5 pb-5 pt-1 border-t border-white/5 space-y-4`}>
                    <DiffView before={d.spec_json} after={d.observed_json} />
                    <div className="flex flex-wrap items-center gap-2">
                      {d.status === 'open' && (
                        <button
                          onClick={() => handleAck(d.id)}
                          disabled={ackingId === d.id}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {ackingId === d.id ? 'Reconociendo…' : 'Acknowledge'}
                        </button>
                      )}
                      <Link
                        href={`/dashboard/admin/pulse/node/${encodeURIComponent(d.resource_id)}`}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 transition"
                      >
                        Ver recurso
                      </Link>
                      <a
                        href="https://dash.cloudflare.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-600/40 bg-slate-800/40 text-slate-300 hover:bg-slate-700/60 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        CF dashboard
                      </a>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
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
