/**
 * Runtics dashboard — shared client helpers.
 *
 * The dashboard talks to runtics-control via the runbits-gateway
 * (/api/runtics/*). All endpoints require a JWT (super-admin role).
 */
import { API_BASE } from '@/lib/api'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'killed_budget'
export type FindingStatus = 'open' | 'acknowledged' | 'closed' | 'regressed'

export interface Agent {
  id: string
  version: string
  description: string | null
  status: 'enabled' | 'disabled' | 'error'
  config_json: string
  tenant_status?: string
  tenant_config_overrides_json?: string | null
  owner_email: string | null
  created_at: number
  updated_at: number
}

export interface Run {
  id: string
  tenant_id: string
  agent_id: string
  trigger_type: string
  trigger_metadata_json: string | null
  status: RunStatus
  output_json: string | null
  error_message: string | null
  tokens_input: number
  tokens_output: number
  cost_usd: number
  duration_ms: number | null
  started_at: number
  completed_at: number | null
}

export interface Finding {
  id: string
  tenant_id: string
  agent_id: string
  run_id: string
  severity: Severity
  category: string | null
  title: string
  description: string | null
  metadata_json: string | null
  status: FindingStatus
  acknowledged_by: string | null
  acknowledged_at: number | null
  closed_at: number | null
  created_at: number
}

export interface Tenant {
  id: string
  name: string
  status: string
  budget_monthly_usd: number
  budget_used_this_month_usd: number
}

export interface Schedule {
  id: string
  tenant_id: string
  agent_id: string
  cron_expression: string
  next_run_at: number | null
  last_run_at: number | null
  last_run_id: string | null
  args_json: string | null
  status: string
}

export interface AuditEntry {
  id: string
  tenant_id: string
  actor: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata_json: string | null
  ip: string | null
  created_at: number
}

export interface Overview {
  tenant: Tenant | null
  agents: Agent[]
  recent_runs: Run[]
  open_findings: Finding[]
}

export interface CostBreakdown {
  tenant: Tenant | null
  by_agent: Array<{ agent_id: string; cost_usd: number; runs_count: number }>
  by_day: Array<{ day: string; agent_id: string; cost_usd: number; runs_count: number }>
  month_key: string
  global: { budget_usd: number; used_usd: number; remaining_usd: number }
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function rget<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/runtics${path}`, {
    headers: { ...authHeaders() },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

async function rmut<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/runtics${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

export const runticsApi = {
  overview: () => rget<Overview>('/overview'),
  agents: () => rget<{ agents: Agent[] }>('/agents'),
  agent: (id: string) =>
    rget<{ agent: Agent; last_run: Run | null; tenant_status: string | null; tenant_overrides: string | null }>(
      `/agents/${encodeURIComponent(id)}`,
    ),
  runAgent: (id: string, args?: Record<string, unknown>) =>
    rmut<{ ok: boolean; run_id: string }>(`/agents/${encodeURIComponent(id)}/run`, 'POST', { args }),
  toggleAgent: (id: string, status: 'enabled' | 'disabled') =>
    rmut<{ ok: boolean }>(`/agents/${encodeURIComponent(id)}/toggle`, 'POST', { status }),
  runs: (params: { agent_id?: string; status?: string; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.agent_id) q.set('agent_id', params.agent_id)
    if (params.status) q.set('status', params.status)
    if (params.limit) q.set('limit', String(params.limit))
    if (params.offset) q.set('offset', String(params.offset))
    return rget<{ runs: Run[]; limit: number; offset: number }>(`/runs?${q.toString()}`)
  },
  run: (id: string) =>
    rget<{ run: Run; findings: Finding[] }>(`/runs/${encodeURIComponent(id)}`),
  findings: (params: { status?: string; severity?: string; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.severity) q.set('severity', params.severity)
    if (params.limit) q.set('limit', String(params.limit))
    if (params.offset) q.set('offset', String(params.offset))
    return rget<{ findings: Finding[]; limit: number; offset: number }>(`/findings?${q.toString()}`)
  },
  patchFinding: (id: string, status: 'open' | 'acknowledged' | 'closed') =>
    rmut<{ ok: boolean }>(`/findings/${encodeURIComponent(id)}`, 'PATCH', { status }),
  cost: () => rget<CostBreakdown>('/cost'),
  auditLog: (params: { limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.limit) q.set('limit', String(params.limit))
    if (params.offset) q.set('offset', String(params.offset))
    return rget<{ entries: AuditEntry[]; limit: number; offset: number }>(`/audit-log?${q.toString()}`)
  },
  schedules: () => rget<{ schedules: Schedule[] }>('/schedules'),
}

export function severityColor(s: Severity): string {
  switch (s) {
    case 'critical':
      return 'bg-red-100 text-red-800 ring-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 ring-orange-200'
    case 'medium':
      return 'bg-amber-100 text-amber-800 ring-amber-200'
    case 'low':
      return 'bg-blue-100 text-blue-700 ring-blue-200'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

export function statusColor(s: RunStatus): string {
  switch (s) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
    case 'running':
      return 'bg-blue-100 text-blue-700 ring-blue-200'
    case 'queued':
      return 'bg-slate-100 text-slate-600 ring-slate-200'
    case 'failed':
      return 'bg-red-100 text-red-800 ring-red-200'
    case 'killed_budget':
      return 'bg-amber-100 text-amber-800 ring-amber-200'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

export function formatTime(epoch: number | null): string {
  if (!epoch) return '—'
  const d = new Date(epoch)
  return d.toLocaleString()
}

export function formatRelative(epoch: number | null): string {
  if (!epoch) return '—'
  const diff = Date.now() - epoch
  if (diff < 60_000) return 'hace segundos'
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)}h`
  return `hace ${Math.floor(diff / 86_400_000)}d`
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`
}
