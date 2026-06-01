"use client"

import { Search, Filter, Zap, Database, Box, Inbox, Globe, Layers, Key, AlertTriangle, DollarSign, TrendingUp, Activity, GitCommit, RefreshCw } from 'lucide-react'
import { KPICard } from './KPICard'
import type { PulseState, ResourceType } from '../_lib/types'
import { RESOURCE_LABEL } from '../_lib/colors'
import styles from '../_styles/pulse.module.css'

const TYPE_ICONS: Record<ResourceType, typeof Zap> = {
  worker: Zap,
  d1: Database,
  kv: Layers,
  r2: Box,
  queue: Inbox,
  pages: Globe,
  secret: Key,
  zone: Globe,
}

const ALL_TYPES: ResourceType[] = ['worker', 'd1', 'kv', 'r2', 'queue', 'pages', 'secret', 'zone']

interface SidebarProps {
  state: PulseState
  search: string
  onSearchChange: (v: string) => void
  typeFilters: Set<ResourceType>
  onToggleType: (t: ResourceType) => void
  driftOnly: boolean
  onToggleDriftOnly: () => void
  liveBackend: boolean
  lastUpdated: number
  onTriggerScan: () => void
  scanning: boolean
}

function timeAgo(ts: number) {
  const now = Date.now() / 1000
  const diff = Math.max(0, now - ts)
  if (diff < 60) return `hace ${Math.floor(diff)}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

export function PulseSidebar({
  state,
  search,
  onSearchChange,
  typeFilters,
  onToggleType,
  driftOnly,
  onToggleDriftOnly,
  liveBackend,
  lastUpdated,
  onTriggerScan,
  scanning,
}: SidebarProps) {
  const workersTotal = state.resources.filter((r) => r.type === 'worker').length
  const workersHealthy = state.resources.filter(
    (r) => r.type === 'worker' && r.drift_count === 0
  ).length
  const openDrifts = state.drift_events.filter((d) => d.status === 'open').length
  const dbCount = state.resources.filter((r) => r.type === 'd1').length

  const typeCounts: Record<ResourceType, number> = {
    worker: 0, d1: 0, kv: 0, r2: 0, queue: 0, pages: 0, secret: 0, zone: 0,
  }
  for (const r of state.resources) typeCounts[r.type]++

  return (
    <aside
      className={`${styles.glassStrong} ${styles.scroll} w-80 shrink-0 flex flex-col overflow-y-auto rounded-2xl`}
      style={{ maxHeight: '100%' }}
    >
      {/* Live status */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${styles.liveDot}`}
              style={{ background: liveBackend ? '#34d399' : '#fbbf24' }}
            />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
              {liveBackend ? 'Backend live' : 'Mock fixtures'}
            </span>
          </div>
          <button
            onClick={onTriggerScan}
            disabled={scanning}
            className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
            title="Trigger scan manual"
          >
            <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            Scan
          </button>
        </div>
        <div className="text-[11px] text-slate-500">
          Última actualización · {timeAgo(lastUpdated)}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar workers, dbs, queues…"
            className="w-full bg-slate-950/60 border border-slate-700/40 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 transition"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" /> Live KPIs
        </div>
        <div className="grid grid-cols-2 gap-2">
          <KPICard
            icon={Activity}
            label="Workers"
            value={`${workersHealthy}/${workersTotal}`}
            hint={workersHealthy === workersTotal ? 'todos OK' : `${workersTotal - workersHealthy} con drift`}
            accent={workersHealthy === workersTotal ? 'emerald' : 'amber'}
          />
          <KPICard
            icon={AlertTriangle}
            label="Drift open"
            value={openDrifts}
            hint={openDrifts === 0 ? 'limpio' : 'requiere review'}
            accent={openDrifts === 0 ? 'emerald' : openDrifts > 2 ? 'red' : 'amber'}
          />
          <KPICard
            icon={Database}
            label="D1 dbs"
            value={dbCount}
            hint="activas"
            accent="emerald"
          />
          <KPICard
            icon={DollarSign}
            label="Cost today"
            value="$0.42"
            hint="vs. $0.38 ayer"
            accent="violet"
            trend={{ delta: 4, positive: false }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Filter className="w-3 h-3" /> Tipo de recurso
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t]
            const active = typeFilters.has(t)
            const count = typeCounts[t] ?? 0
            if (count === 0) return null
            return (
              <button
                key={t}
                onClick={() => onToggleType(t)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  active
                    ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                    : 'bg-slate-900/40 text-slate-400 border-slate-700/40 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">{RESOURCE_LABEL[t]}</span>
                <span className="opacity-70 text-[10px]">{count}</span>
              </button>
            )
          })}
        </div>

        <label className="flex items-center justify-between mt-3 px-2 py-1.5 rounded-lg bg-slate-900/40 border border-slate-700/40 cursor-pointer hover:bg-slate-800/60 transition">
          <span className="text-xs text-slate-300">Solo con drift</span>
          <span
            className="relative inline-flex w-9 h-5 rounded-full transition-colors"
            style={{ background: driftOnly ? '#6366f1' : 'rgba(148,163,184,0.25)' }}
          >
            <input
              type="checkbox"
              checked={driftOnly}
              onChange={onToggleDriftOnly}
              className="absolute opacity-0 inset-0 cursor-pointer"
            />
            <span
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: driftOnly ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </span>
        </label>
      </div>

      {/* Legend */}
      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <GitCommit className="w-3 h-3" /> Snapshot
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>commit</span>
            <span className="font-mono text-slate-300">{state.snapshot_meta.commit_sha.slice(0, 9)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>resources</span>
            <span className="text-slate-300">{state.snapshot_meta.total_resources}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>edges</span>
            <span className="text-slate-300">{state.snapshot_meta.total_edges}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>scanner</span>
            <span className="text-slate-300">{state.snapshot_meta.scanner_version}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
