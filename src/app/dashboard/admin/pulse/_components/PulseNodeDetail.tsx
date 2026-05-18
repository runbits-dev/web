"use client"

import { useState, useMemo } from 'react'
import { X, ExternalLink, GitCommit, Layers, ArrowRight, ArrowLeft, Zap, Database, Box, Inbox, Globe, Key, Copy, Check } from 'lucide-react'
import type { PulseState, PulseResource, ResourceType, DriftSeverity } from '../_lib/types'
import { RESOURCE_COLORS, RESOURCE_LABEL, EDGE_COLORS } from '../_lib/colors'
import { PulseDriftBadge } from './PulseDriftBadge'
import { DiffView } from './DiffView'
import styles from '../_styles/pulse.module.css'

const TYPE_ICONS: Record<ResourceType, typeof Zap> = {
  worker: Zap, d1: Database, kv: Layers, r2: Box,
  queue: Inbox, pages: Globe, secret: Key,
}

interface Props {
  resource: PulseResource
  state: PulseState
  onClose: () => void
}

type Tab = 'overview' | 'bindings' | 'spec' | 'observed' | 'drift' | 'history'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'bindings', label: 'Bindings' },
  { key: 'spec',     label: 'Spec' },
  { key: 'observed', label: 'Observed' },
  { key: 'drift',    label: 'Drift' },
  { key: 'history',  label: 'History' },
]

function timeAgo(ts: number) {
  const now = Date.now() / 1000
  const diff = Math.max(0, now - ts)
  if (diff < 60) return `hace ${Math.floor(diff)}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

export function PulseNodeDetail({ resource, state, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [copied, setCopied] = useState<string | null>(null)

  const palette = RESOURCE_COLORS[resource.type]
  const Icon = TYPE_ICONS[resource.type]

  const incoming = useMemo(
    () => state.edges.filter((e) => e.to_resource === resource.id),
    [state.edges, resource.id]
  )
  const outgoing = useMemo(
    () => state.edges.filter((e) => e.from_resource === resource.id),
    [state.edges, resource.id]
  )
  const drifts = useMemo(
    () => state.drift_events.filter((d) => d.resource_id === resource.id),
    [state.drift_events, resource.id]
  )

  const topDriftSeverity: DriftSeverity | null =
    drifts.find((d) => d.severity === 'critical' && d.status === 'open')?.severity ||
    drifts.find((d) => d.severity === 'warning' && d.status === 'open')?.severity ||
    drifts.find((d) => d.status === 'open')?.severity ||
    null

  function getName(id: string) {
    return state.resources.find((r) => r.id === id)?.name ?? id
  }
  function getType(id: string) {
    return state.resources.find((r) => r.id === id)?.type ?? 'worker'
  }

  function copy(value: string, key: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(key)
      setTimeout(() => setCopied((cur) => (cur === key ? null : cur)), 1400)
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 ${styles.fadeIn}`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full md:w-[640px] ${styles.glassStrong} ${styles.slideIn} flex flex-col border-l border-white/10 shadow-2xl`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{
                width: 48, height: 48,
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                color: palette.text,
                boxShadow: `0 0 24px ${palette.glow}`,
              }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] uppercase tracking-wider font-semibold opacity-70"
                  style={{ color: palette.text }}
                >
                  {RESOURCE_LABEL[resource.type]}
                </span>
                {topDriftSeverity && (
                  <PulseDriftBadge
                    severity={topDriftSeverity}
                    count={drifts.filter((d) => d.status === 'open').length}
                    label="drift"
                    size="sm"
                  />
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-100 truncate">{resource.name}</h2>
              <div className="text-[11px] text-slate-500 font-mono truncate flex items-center gap-1.5">
                {resource.id}
                <button
                  onClick={() => copy(resource.id, 'id')}
                  className="opacity-60 hover:opacity-100 transition"
                  title="Copiar ID"
                >
                  {copied === 'id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors rounded-lg p-1.5 hover:bg-white/5"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 border-b border-white/10 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key
            const showBadge = t.key === 'drift' && drifts.length > 0
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'text-indigo-300 border-b-2 border-indigo-400'
                    : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                }`}
              >
                {t.label}
                {showBadge && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] rounded-full bg-red-500/30 text-red-200 border border-red-400/40">
                    {drifts.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${styles.scroll} px-6 py-5`}>
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Tipo" value={RESOURCE_LABEL[resource.type]} />
                <InfoBlock label="Drift count" value={String(resource.drift_count)} accent={resource.drift_count > 0 ? 'red' : 'emerald'} />
                <InfoBlock label="Last seen" value={timeAgo(resource.last_seen_at)} />
                <InfoBlock label="First seen" value={timeAgo(resource.first_seen_at)} />
                <InfoBlock label="Incoming edges" value={String(incoming.length)} />
                <InfoBlock label="Outgoing edges" value={String(outgoing.length)} />
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  Acciones rápidas
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionPill
                    label="Ver en CF dashboard"
                    icon={ExternalLink}
                    href={resource.type === 'worker'
                      ? `https://dash.cloudflare.com/?to=/:account/workers/services/view/${encodeURIComponent(resource.name)}`
                      : resource.type === 'd1'
                        ? `https://dash.cloudflare.com/?to=/:account/workers/d1/databases`
                        : `https://dash.cloudflare.com/`}
                  />
                  <ActionPill label="Copiar spec JSON" icon={Copy} onClick={() => copy(resource.spec_json, 'spec')} active={copied === 'spec'} />
                  <ActionPill label="Copiar observed" icon={Copy} onClick={() => copy(resource.observed_json, 'observed')} active={copied === 'observed'} />
                </div>
              </div>
            </div>
          )}

          {tab === 'bindings' && (
            <div className="space-y-4">
              <BindingsList title="Outgoing" icon={ArrowRight} edges={outgoing} resolveName={getName} resolveType={getType} direction="out" />
              <BindingsList title="Incoming" icon={ArrowLeft} edges={incoming} resolveName={getName} resolveType={getType} direction="in" />
            </div>
          )}

          {tab === 'spec' && (
            <JsonBlock label="wrangler.toml / source spec" json={resource.spec_json} onCopy={() => copy(resource.spec_json, 'spec-json')} copied={copied === 'spec-json'} />
          )}

          {tab === 'observed' && (
            <JsonBlock label="Cloudflare API observed state" json={resource.observed_json} onCopy={() => copy(resource.observed_json, 'observed-json')} copied={copied === 'observed-json'} />
          )}

          {tab === 'drift' && (
            <div className="space-y-3">
              {drifts.length === 0 && (
                <EmptyState label="Sin drift" hint="Spec y observed coinciden 100%." />
              )}
              {drifts.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PulseDriftBadge severity={d.severity} label={d.event_type.replace(/_/g, ' ').toLowerCase()} size="sm" />
                        <span className="text-[10px] text-slate-500">{timeAgo(d.created_at)}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-100">{d.title}</div>
                      <div className="text-[12px] text-slate-400 mt-1">{d.description}</div>
                    </div>
                  </div>
                  <DiffView before={d.spec_json} after={d.observed_json} />
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 mb-2">
                Últimos commits del state repo que tocaron este recurso (mock):
              </div>
              {[0, 1, 2, 3, 4].map((i) => {
                const sha = (Math.random().toString(36).slice(2, 9) + '0000000').slice(0, 7)
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2 hover:bg-slate-900/60 transition cursor-pointer"
                  >
                    <GitCommit className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-mono text-xs text-slate-300">{sha}</span>
                    <span className="text-xs text-slate-400 flex-1 truncate">
                      scan: {i === 0 ? 'sin cambios' : i === 1 ? 'binding agregado' : i === 2 ? 'observed actualizado' : 'snapshot rutinario'}
                    </span>
                    <span className="text-[10px] text-slate-500">{i + 1}h ago</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function InfoBlock({ label, value, accent = 'default' }: { label: string; value: string; accent?: 'default' | 'red' | 'emerald' }) {
  const text =
    accent === 'red' ? 'text-rose-200'
    : accent === 'emerald' ? 'text-emerald-200'
    : 'text-slate-100'
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{label}</div>
      <div className={`text-base font-semibold ${text}`}>{value}</div>
    </div>
  )
}

function ActionPill({ label, icon: Icon, href, onClick, active }: { label: string; icon: typeof X; href?: string; onClick?: () => void; active?: boolean }) {
  const className = `inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
    active
      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
      : 'bg-slate-900/60 border-slate-700/40 text-slate-300 hover:bg-indigo-500/15 hover:border-indigo-400/40 hover:text-indigo-200'
  }`
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </a>
    )
  }
  return (
    <button onClick={onClick} className={className}>
      <Icon className="w-3.5 h-3.5" />
      {active ? 'Copiado' : label}
    </button>
  )
}

function BindingsList({
  title,
  icon: Icon,
  edges,
  resolveName,
  resolveType,
  direction,
}: {
  title: string
  icon: typeof X
  edges: Array<{ id: string; from_resource: string; to_resource: string; edge_type: keyof typeof EDGE_COLORS; source: string }>
  resolveName: (id: string) => string
  resolveType: (id: string) => ResourceType
  direction: 'in' | 'out'
}) {
  if (edges.length === 0) {
    return (
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
          <Icon className="w-3 h-3" /> {title}
        </div>
        <EmptyState label={`Sin bindings ${direction === 'in' ? 'entrantes' : 'salientes'}`} />
      </div>
    )
  }
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {title} ({edges.length})
      </div>
      <div className="space-y-1.5">
        {edges.map((e) => {
          const target = direction === 'out' ? e.to_resource : e.from_resource
          const ec = EDGE_COLORS[e.edge_type]
          const targetType = resolveType(target)
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2"
            >
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                style={{ color: ec.stroke, background: ec.stroke + '20', border: `1px solid ${ec.stroke}55` }}
              >
                {ec.label}
              </span>
              <span className="text-xs text-slate-300 truncate flex-1">
                {resolveName(target)}
              </span>
              <span className="text-[10px] text-slate-500 uppercase">{RESOURCE_LABEL[targetType]}</span>
              <span className="text-[10px] text-slate-600 font-mono">{e.source}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function JsonBlock({ label, json, onCopy, copied }: { label: string; json: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/60">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
        <button
          onClick={onCopy}
          className="text-xs flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className={`text-xs leading-relaxed font-mono p-4 overflow-auto max-h-[60vh] text-slate-200 ${styles.scroll}`}>
        {json}
      </pre>
    </div>
  )
}

function EmptyState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-center">
      <div className="text-sm text-slate-300">{label}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  )
}
