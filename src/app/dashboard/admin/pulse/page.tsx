"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, History, Sparkles } from 'lucide-react'

import { PulseMap } from './_components/PulseMap'
import { PulseSidebar } from './_components/PulseSidebar'
import { PulseNodeDetail } from './_components/PulseNodeDetail'
import { PulseTimelineScrubber } from './_components/PulseTimelineScrubber'
import { PulseDriftBadge } from './_components/PulseDriftBadge'

import { getPulseState, getPulseStateAt, getPulseTimeline, triggerScan } from './_lib/api'
import type {
  PulseState,
  PulseResource,
  ResourceType,
  PulseTimelineCommit,
} from './_lib/types'
import styles from './_styles/pulse.module.css'

const POLL_INTERVAL_MS = 30_000

const ALL_TYPES: ResourceType[] = ['worker', 'd1', 'kv', 'r2', 'queue', 'pages', 'secret']

interface Toast {
  id: number
  title: string
  body?: string
  severity: 'critical' | 'warning' | 'info'
}

export default function PulseMapPage() {
  const [state, setState] = useState<PulseState | null>(null)
  const [liveBackend, setLiveBackend] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number>(Math.floor(Date.now() / 1000))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [timeline, setTimeline] = useState<PulseTimelineCommit[]>([])
  const [selectedSha, setSelectedSha] = useState<string | undefined>(undefined)
  const [timeTravelLoading, setTimeTravelLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [typeFilters, setTypeFilters] = useState<Set<ResourceType>>(new Set(ALL_TYPES))
  const [driftOnly, setDriftOnly] = useState(false)

  const [selectedResource, setSelectedResource] = useState<PulseResource | null>(null)

  const [scanning, setScanning] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const prevOpenDriftIds = useRef<Set<string>>(new Set())

  // ── Load state + timeline on mount + poll ────────────────────────────────
  const loadState = useCallback(async () => {
    try {
      const res = await getPulseState()
      setState((prev) => {
        // Toast on newly-appearing drift events.
        if (prev) {
          const prevIds = prevOpenDriftIds.current
          const newOpen = new Set(
            res.data.drift_events.filter((d) => d.status === 'open').map((d) => d.id)
          )
          const fresh = [...newOpen].filter((id) => !prevIds.has(id))
          if (fresh.length > 0) {
            const newToasts: Toast[] = fresh
              .map((id) => res.data.drift_events.find((d) => d.id === id))
              .filter((d): d is NonNullable<typeof d> => Boolean(d))
              .map((d) => ({
                id: Date.now() + Math.random(),
                title: d.title,
                body: d.description,
                severity: d.severity,
              }))
            setToasts((cur) => [...cur, ...newToasts])
            // auto-dismiss after 6s
            for (const t of newToasts) {
              setTimeout(() => {
                setToasts((cur) => cur.filter((x) => x.id !== t.id))
              }, 6000)
            }
          }
          prevOpenDriftIds.current = newOpen
        } else {
          prevOpenDriftIds.current = new Set(
            res.data.drift_events.filter((d) => d.status === 'open').map((d) => d.id)
          )
        }
        return res.data
      })
      setLiveBackend(res.live)
      setLastUpdated(Math.floor(Date.now() / 1000))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadState()
    getPulseTimeline(60).then((res) => setTimeline(res.data))
    const interval = setInterval(() => {
      if (!selectedSha) loadState()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadState, selectedSha])

  // ── Time travel ──────────────────────────────────────────────────────────
  async function handleSelectCommit(sha: string) {
    setSelectedSha(sha)
    setTimeTravelLoading(true)
    try {
      const res = await getPulseStateAt(sha)
      setState(res.data)
      setLastUpdated(Math.floor(Date.now() / 1000))
    } finally {
      setTimeTravelLoading(false)
    }
  }

  function handleResetTimeline() {
    setSelectedSha(undefined)
    loadState()
  }

  // ── Filter handlers ──────────────────────────────────────────────────────
  function toggleType(t: ResourceType) {
    setTypeFilters((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      // Don't allow zero filters — force at least one type on.
      if (next.size === 0) {
        return new Set(ALL_TYPES)
      }
      return next
    })
  }

  async function handleTriggerScan() {
    setScanning(true)
    const result = await triggerScan()
    setToasts((cur) => [
      ...cur,
      {
        id: Date.now(),
        title: result.ok ? 'Scan disparado' : 'Scan no disponible',
        body: result.message ?? (result.live ? 'Backend procesando…' : 'Usando fixtures locales'),
        severity: result.ok ? 'info' : 'warning',
      },
    ])
    setTimeout(() => setScanning(false), 1200)
    // refresh shortly after
    setTimeout(loadState, 1500)
  }

  // ── KPI counts / header ──────────────────────────────────────────────────
  const openDrifts = useMemo(
    () => state?.drift_events.filter((d) => d.status === 'open') ?? [],
    [state]
  )
  const criticalCount = openDrifts.filter((d) => d.severity === 'critical').length

  if (loading || !state) {
    return (
      <div className={styles.shell}>
        <div className="flex-1 flex items-center justify-center">
          <div className={`${styles.glassStrong} px-8 py-6 rounded-2xl text-center`}>
            <Sparkles className="w-6 h-6 text-indigo-300 mx-auto mb-3 animate-pulse" />
            <div className="text-slate-200 text-sm font-semibold">Cargando Pulse…</div>
            <div className="text-slate-500 text-xs mt-1">Escaneando topología</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      {/* Header */}
      <header className="relative z-20 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/dashboard/admin" className="text-xs text-slate-500 hover:text-indigo-300 transition shrink-0">
            ← Admin
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                border: '1px solid rgba(165,180,252,0.4)',
                boxShadow: '0 0 16px rgba(99,102,241,0.5)',
              }}
            >
              <Activity className="w-4 h-4 text-indigo-200" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight truncate">runtics-pulse</h1>
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  Mission Control
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                snapshot {state.snapshot_meta.commit_sha.slice(0, 9)} · {state.snapshot_meta.total_resources} resources · {state.snapshot_meta.total_edges} edges
              </div>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 shrink-0">
          <NavTab href="/dashboard/admin/pulse" label="Map" active />
          <NavTab href="/dashboard/admin/pulse/timeline" label="Timeline" />
          <NavTab
            href="/dashboard/admin/pulse/drift"
            label="Drift"
            badge={openDrifts.length > 0 ? openDrifts.length : undefined}
            badgeAccent={criticalCount > 0 ? 'red' : 'amber'}
          />
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {criticalCount > 0 && (
            <PulseDriftBadge severity="critical" count={criticalCount} label="critical" size="sm" />
          )}
          {timeTravelLoading && (
            <span className="text-[10px] text-indigo-300 animate-pulse">time-travel…</span>
          )}
        </div>
      </header>

      {/* Body: map + sidebar */}
      <div className="flex-1 flex gap-3 px-4 lg:px-6 py-3 overflow-hidden">
        <div className={`${styles.glass} flex-1 rounded-2xl overflow-hidden relative`}>
          <PulseMap
            state={state}
            search={search}
            typeFilters={typeFilters}
            driftOnly={driftOnly}
            selectedId={selectedResource?.id}
            onSelect={(r) => setSelectedResource(r)}
          />
        </div>
        <PulseSidebar
          state={state}
          search={search}
          onSearchChange={setSearch}
          typeFilters={typeFilters}
          onToggleType={toggleType}
          driftOnly={driftOnly}
          onToggleDriftOnly={() => setDriftOnly((v) => !v)}
          liveBackend={liveBackend}
          lastUpdated={lastUpdated}
          onTriggerScan={handleTriggerScan}
          scanning={scanning}
        />
      </div>

      {/* Bottom timeline scrubber */}
      <div className="px-4 lg:px-6 pb-3">
        <PulseTimelineScrubber
          commits={timeline}
          selectedSha={selectedSha}
          onSelect={handleSelectCommit}
          onReset={handleResetTimeline}
        />
      </div>

      {/* Slide-in node detail */}
      {selectedResource && (
        <PulseNodeDetail
          resource={selectedResource}
          state={state}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.glassStrong} ${styles.toast} pointer-events-auto rounded-xl px-4 py-3 border-l-4`}
            style={{
              borderLeftColor:
                t.severity === 'critical' ? '#f87171'
                : t.severity === 'warning' ? '#fbbf24'
                : '#7dd3fc',
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{
                  color:
                    t.severity === 'critical' ? '#f87171'
                    : t.severity === 'warning' ? '#fbbf24'
                    : '#7dd3fc',
                }}
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">{t.title}</div>
                {t.body && <div className="text-xs text-slate-400 mt-0.5">{t.body}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className={`${styles.glassStrong} fixed bottom-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl border-red-400/40 text-red-200 text-xs`}>
          {error}
        </div>
      )}
    </div>
  )
}

function NavTab({
  href,
  label,
  active,
  badge,
  badgeAccent = 'amber',
}: {
  href: string
  label: string
  active?: boolean
  badge?: number
  badgeAccent?: 'amber' | 'red'
}) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40'
          : 'text-slate-400 hover:text-indigo-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      {label}
      {badge !== undefined && (
        <span
          className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold rounded-full ${
            badgeAccent === 'red'
              ? 'bg-red-500/30 text-red-200 border border-red-400/40'
              : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
