"use client"

/**
 * /dashboard/admin/monitoring
 *
 * Unified Monitoring & Alerts dashboard for the Runbits stack. Replaces the
 * old Sentry-based observability and consolidates everything monitoring-
 * related into a single admin surface.
 *
 * Tabs:
 *   1. Live Status   — current health snapshot of every monitored service.
 *                      Same data as status.runbits.dev but admin-only and
 *                      with a manual refresh button.
 *   2. Configuration — runtime config (status check interval, alert
 *                      thresholds, notification channels) backed by KV
 *                      `monitoring:config` on runbits-status.
 *   3. Alerts        — placeholder for the push-driven monitoring agent
 *                      (populated in the next bucket).
 *   4. Findings      — placeholder for the pull-driven hourly findings.
 *   5. Reports       — placeholder for the weekly synthesised reports.
 *
 * Auth: admin / super_admin only — gateway enforces via /api/monitoring/*
 * middleware; the dashboard layout also gates the route at /dashboard/admin/*.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api,
  type MonitoringAlert,
  type MonitoringConfig,
  type MonitoringConfigInput,
  type MonitoringFinding,
  type MonitoringReport,
  type MonitoringService,
} from '@/lib/api'
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cog,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Save,
} from 'lucide-react'

type TabKey = 'live' | 'config' | 'alerts' | 'findings' | 'reports'

const TABS: Array<{ key: TabKey; label: string; Icon: typeof Activity }> = [
  { key: 'live',     label: 'Live Status',     Icon: Activity },
  { key: 'config',   label: 'Configuración',   Icon: Cog },
  { key: 'alerts',   label: 'Alertas',         Icon: BellRing },
  { key: 'findings', label: 'Findings',        Icon: Search },
  { key: 'reports',  label: 'Reportes',        Icon: FileText },
]

export default function AdminMonitoringPage() {
  const [tab, setTab] = useState<TabKey>('live')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Monitoring &amp; Alerts</h1>
        <p className="text-slate-500 text-sm mt-1">
          Punto único de control para el monitoring del stack Runbits. Configurá
          intervalos, thresholds, canales de notificación y revisá alertas en vivo.
        </p>
      </div>

      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      {tab === 'live' && <LiveStatusTab />}
      {tab === 'config' && <ConfigurationTab />}
      {tab === 'alerts' && <AlertsTab />}
      {tab === 'findings' && <FindingsTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  )
}

// ─── Tab: Live Status ────────────────────────────────────────────────────────

function LiveStatusTab() {
  const [snapshot, setSnapshot] = useState<{ ts: number; services: MonitoringService[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const data = await api.getMonitoringHealthSnapshot()
      setSnapshot(data)
    } catch (e: any) {
      setError(e?.message || 'No se pudo obtener el estado')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load(true) }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando estado...
      </div>
    )
  }

  const services = snapshot?.services ?? []
  const allOk = services.length > 0 && services.every(s => s.ok)
  const downCount = services.filter(s => !s.ok).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${allOk ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <p className={`text-sm font-semibold ${allOk ? 'text-green-700' : 'text-red-700'}`}>
              {allOk ? 'Todos los servicios operativos' : `${downCount} servicio${downCount === 1 ? '' : 's'} con problemas`}
            </p>
            {snapshot && (
              <p className="text-xs text-slate-400 mt-0.5">
                Último chequeo: {new Date(snapshot.ts).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Refresh now'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map(svc => (
          <div
            key={svc.id}
            className={`p-4 rounded-xl border ${
              svc.ok ? 'bg-white border-slate-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium text-sm text-slate-800">{svc.name}</p>
              {svc.ok ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className={svc.ok ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {svc.ok ? 'Operational' : `HTTP ${svc.status || 'unreachable'}`}
              </span>
              <span>{svc.latency_ms} ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Configuration ──────────────────────────────────────────────────────

const INTERVAL_OPTIONS = [5, 10, 15, 30, 60]

const DEFAULT_CONFIG_INPUT: MonitoringConfigInput = {
  version: 1,
  status_cron: { interval_minutes: 5, enabled: true },
  thresholds: {
    error_rate_pct: 1.0,
    error_rate_window_minutes: 10,
    cost_daily_usd: 5.0,
    latency_p95_ms: 2000,
  },
  channels: {
    email: { enabled: true, address: 'lucas.i.carrizo@gmail.com' },
    whatsapp: { enabled: false, phone: '' },
    push: { enabled: true },
  },
}

function ConfigurationTab() {
  const [config, setConfig] = useState<MonitoringConfigInput>(DEFAULT_CONFIG_INPUT)
  const [loaded, setLoaded] = useState<MonitoringConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getMonitoringConfig()
      .then(data => {
        const c = data.config
        setLoaded(c)
        setConfig({
          version: c.version,
          status_cron: c.status_cron,
          thresholds: c.thresholds,
          channels: c.channels,
        })
      })
      .catch(e => setError(e?.message || 'No se pudo cargar la configuración'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const result = await api.updateMonitoringConfig(config)
      setLoaded(result.config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando configuración...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status check */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Status checks</h2>
        <p className="text-sm text-slate-500 mb-4">
          Cron real corre cada 5 min; el handler salta ticks fuera del intervalo elegido.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Intervalo (min)</label>
            <select
              value={config.status_cron.interval_minutes}
              onChange={e => setConfig({
                ...config,
                status_cron: { ...config.status_cron, interval_minutes: Number(e.target.value) },
              })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {INTERVAL_OPTIONS.map(m => (
                <option key={m} value={m}>{m === 60 ? '1 hora' : `${m} minutos`}</option>
              ))}
            </select>
          </div>
          <ToggleField
            label="Habilitado"
            checked={config.status_cron.enabled}
            onChange={v => setConfig({ ...config, status_cron: { ...config.status_cron, enabled: v } })}
          />
        </div>
      </section>

      {/* Thresholds */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Thresholds de alerta</h2>
        <p className="text-sm text-slate-500 mb-4">
          Disparan notificaciones cuando se superan en la ventana especificada.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Error rate (%)"
            value={config.thresholds.error_rate_pct}
            min={0} max={100} step={0.1}
            onChange={v => setConfig({ ...config, thresholds: { ...config.thresholds, error_rate_pct: v } })}
          />
          <NumberField
            label="Ventana (min)"
            value={config.thresholds.error_rate_window_minutes}
            min={1} max={1440} step={1}
            onChange={v => setConfig({ ...config, thresholds: { ...config.thresholds, error_rate_window_minutes: v } })}
          />
          <NumberField
            label="Costo diario (USD)"
            value={config.thresholds.cost_daily_usd}
            min={0} step={0.5}
            onChange={v => setConfig({ ...config, thresholds: { ...config.thresholds, cost_daily_usd: v } })}
          />
          <NumberField
            label="Latencia p95 (ms)"
            value={config.thresholds.latency_p95_ms}
            min={1} step={100}
            onChange={v => setConfig({ ...config, thresholds: { ...config.thresholds, latency_p95_ms: v } })}
          />
        </div>
      </section>

      {/* Channels */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Canales de notificación</h2>
        <p className="text-sm text-slate-500 mb-4">
          Definí cómo se notifican las alertas cuando se disparan.
        </p>
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-5">
            <ToggleField
              label="Email"
              checked={config.channels.email.enabled}
              onChange={v => setConfig({
                ...config,
                channels: { ...config.channels, email: { ...config.channels.email, enabled: v } },
              })}
            />
            <input
              type="email"
              placeholder="lucas.i.carrizo@gmail.com"
              value={config.channels.email.address}
              onChange={e => setConfig({
                ...config,
                channels: { ...config.channels, email: { ...config.channels.email, address: e.target.value } },
              })}
              disabled={!config.channels.email.enabled}
              className="mt-2 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-50 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="border-b border-slate-100 pb-5">
            <ToggleField
              label="WhatsApp"
              checked={config.channels.whatsapp.enabled}
              onChange={v => setConfig({
                ...config,
                channels: { ...config.channels, whatsapp: { ...config.channels.whatsapp, enabled: v } },
              })}
            />
            <input
              type="tel"
              placeholder="+5491123456789 (formato E.164)"
              value={config.channels.whatsapp.phone}
              onChange={e => setConfig({
                ...config,
                channels: { ...config.channels, whatsapp: { ...config.channels.whatsapp, phone: e.target.value } },
              })}
              disabled={!config.channels.whatsapp.enabled}
              className="mt-2 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-50 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <ToggleField
              label="Push (usa las suscripciones existentes)"
              checked={config.channels.push.enabled}
              onChange={v => setConfig({
                ...config,
                channels: { ...config.channels, push: { enabled: v } },
              })}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
        <div className="text-xs text-slate-500">
          {loaded?.updated_at
            ? `Última actualización: ${new Date(loaded.updated_at).toLocaleString()}${loaded.updated_by ? ` — ${loaded.updated_by}` : ''}`
            : 'Sin guardados previos'}
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Guardado
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}

function NumberField({
  label, value, onChange, min, max, step,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  )
}

// ─── Placeholder tabs (populated by monitoring agent in the next bucket) ─────

function EmptyState({ title, description, Icon }: { title: string; description: string; Icon: typeof Activity }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>
    </div>
  )
}

// ─── Tab: Alerts (Layer 1 — push-driven) ─────────────────────────────────────

function severityBadge(sev: 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low') {
  const map: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-100', text: 'text-red-700' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-800' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    low: { bg: 'bg-blue-100', text: 'text-blue-700' },
    info: { bg: 'bg-slate-100', text: 'text-slate-700' },
  }
  const v = map[sev] ?? map.info
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${v.bg} ${v.text}`}>
      {sev}
    </span>
  )
}

function statusBadge(s: MonitoringAlert['status']) {
  const map: Record<MonitoringAlert['status'], { bg: string; text: string; label: string }> = {
    open: { bg: 'bg-red-50', text: 'text-red-700', label: 'open' },
    acknowledged: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'ack' },
    resolved: { bg: 'bg-green-50', text: 'text-green-700', label: 'resolved' },
    auto_resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'auto-resolved' },
  }
  const v = map[s]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${v.bg} ${v.text}`}>
      {v.label}
    </span>
  )
}

function AlertsTab() {
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [items, setItems] = useState<MonitoringAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const out = await api.getMonitoringAlerts({ status: filter, limit: 100 })
      setItems(out.alerts)
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar las alertas')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleAck(id: string) {
    setBusyId(id)
    try { await api.acknowledgeMonitoringAlert(id); await load() } catch (e: any) { setError(e?.message) } finally { setBusyId(null) }
  }
  async function handleResolve(id: string) {
    setBusyId(id)
    try { await api.resolveMonitoringAlert(id); await load() } catch (e: any) { setError(e?.message) } finally { setBusyId(null) }
  }
  async function handleRunAgent() {
    setRunning(true)
    try {
      await api.runMonitoringAgentNow('hourly_patterns')
    } catch (e: any) {
      setError(e?.message || 'No se pudo disparar el agent')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${filter === 'open' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            Abiertas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${filter === 'all' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            Todas
          </button>
          <button
            onClick={load}
            className="ml-2 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
        <button
          onClick={handleRunAgent}
          disabled={running}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run agent now
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando alertas...
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          Icon={BellRing}
          title={filter === 'open' ? 'Sin alertas abiertas' : 'Sin alertas todavía'}
          description="Cuando el monitoring agent detecte issues, aparecen acá con severidad, servicio, mensaje y acciones."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs uppercase tracking-wide">Severidad</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs uppercase tracking-wide">Servicio</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs uppercase tracking-wide">Mensaje</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs uppercase tracking-wide">Origen</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs uppercase tracking-wide">Cuándo</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600 text-xs uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">{severityBadge(a.severity)}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{a.service ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-md">
                    <div className="line-clamp-2">{a.message}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.alert_type}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.source}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{statusBadge(a.status)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {a.status === 'open' && (
                      <button
                        onClick={() => handleAck(a.id)}
                        disabled={busyId === a.id}
                        className="text-xs px-2 py-1 text-amber-700 bg-amber-50 rounded hover:bg-amber-100 disabled:opacity-50 mr-1"
                      >
                        Ack
                      </button>
                    )}
                    {(a.status === 'open' || a.status === 'acknowledged') && (
                      <button
                        onClick={() => handleResolve(a.id)}
                        disabled={busyId === a.id}
                        className="text-xs px-2 py-1 text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Findings (Layer 2 — hourly pattern detection) ──────────────────────

function FindingsTab() {
  const [items, setItems] = useState<MonitoringFinding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const out = await api.getMonitoringFindings({ limit: 100 })
      setItems(out.findings)
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar los findings')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const grouped = useMemo(() => {
    const m = new Map<string, MonitoringFinding[]>()
    for (const f of items) {
      const key = (f.metadata_json ? (() => { try { return (JSON.parse(f.metadata_json) as any).service ?? 'other' } catch { return 'other' } })() : 'other')
      const list = m.get(key) ?? []
      list.push(f)
      m.set(key, list)
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando findings...</div>
  }
  if (error) {
    return <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
  }
  if (items.length === 0) {
    return (
      <EmptyState
        Icon={Search}
        title="Sin findings todavía"
        description="Los findings del monitoring agent (Layer 2 — pull mode horario) van a aparecer acá una vez que el cron corra (cada hora a los 15 minutos)."
      />
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} findings en los últimos 7 días, agrupados por servicio.</p>
        <button onClick={load} className="text-xs px-2.5 py-1.5 text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      {grouped.map(([service, fs]) => (
        <section key={service} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">{service}</h3>
            <p className="text-xs text-slate-500">{fs.length} finding{fs.length === 1 ? '' : 's'}</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {fs.map(f => (
              <li key={f.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{severityBadge(f.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{f.title}</p>
                    {f.description && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap line-clamp-3">{f.description}</p>}
                    <p className="text-xs text-slate-400 mt-1">{new Date(f.created_at).toLocaleString()} &middot; {f.category ?? 'general'}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ─── Tab: Reports (Layer 3 — weekly SLO) ─────────────────────────────────────

function ReportsTab() {
  const [items, setItems] = useState<MonitoringReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const out = await api.getMonitoringReports({ type: 'weekly_slo', limit: 20 })
      setItems(out.reports)
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar los reportes')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando reportes...</div>
  }
  if (error) {
    return <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
  }
  if (items.length === 0) {
    return (
      <EmptyState
        Icon={FileText}
        title="Sin reportes todavía"
        description="Los reportes semanales sintetizados por el monitoring agent (Layer 3) van a aparecer acá los lunes a la mañana."
      />
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} reporte{items.length === 1 ? '' : 's'} disponibles.</p>
        <button onClick={load} className="text-xs px-2.5 py-1.5 text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      {items.map(r => {
        const isOpen = expanded === r.id
        const start = new Date(r.period_start).toISOString().slice(0, 10)
        const end = new Date(r.period_end).toISOString().slice(0, 10)
        return (
          <article key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : r.id)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <span className="font-medium text-sm text-slate-800">Weekly SLO — {start} → {end}</span>
              </div>
              <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
            </button>
            {isOpen && r.markdown && (
              <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
                <pre className="text-xs font-mono whitespace-pre-wrap text-slate-700 leading-relaxed">{r.markdown}</pre>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
