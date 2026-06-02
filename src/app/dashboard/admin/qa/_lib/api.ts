/**
 * runtics-qa client.
 *
 * Talks to the runtics-qa worker via the runbits-gateway at
 * /api/runtics/qa/*. All endpoints require an admin JWT (Bearer token).
 *
 * Patterned after the runtics dashboard helper (src/app/dashboard/runtics/_lib.ts):
 * a plain fetch wrapper that pulls the token from localStorage and throws on
 * non-2xx responses with a human-readable message.
 */

import { API_BASE } from '@/lib/api'
import type {
  QaApproveResponse,
  QaRun,
  QaRunDetailResponse,
  QaRunsListResponse,
  QaRunStatus,
  QaScheduleUpdate,
  QaScheduleUpdateResponse,
  QaSchedulesListResponse,
  QaScope,
  QaSinceWindow,
  QaValidateResponse,
} from './types'

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function qaGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/runtics/qa${path}`, {
    headers: { ...authHeaders() },
    cache: 'no-store',
  })
  if (res.status === 401) throw new Error('Sesión expirada')
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

async function qaPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/runtics/qa${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) throw new Error('Sesión expirada')
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

async function qaPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/runtics/qa${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (res.status === 401) throw new Error('Sesión expirada')
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export interface QaRunsQuery {
  status?: QaRunStatus | ''
  limit?: number
  since?: number // unix seconds
}

export const qaApi = {
  /** POST /api/runtics/qa/validate — kick off a new QA run. */
  validate: (subject: string, scope: QaScope = 'shallow') =>
    qaPost<QaValidateResponse>('/validate', { subject, scope }),

  /** GET /api/runtics/qa/runs — list runs, with optional filters. */
  runs: (params: QaRunsQuery = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.limit) q.set('limit', String(params.limit))
    if (params.since) q.set('since', String(params.since))
    const qs = q.toString()
    return qaGet<QaRunsListResponse>(`/runs${qs ? `?${qs}` : ''}`)
  },

  /** GET /api/runtics/qa/runs/:id — run + check results. */
  run: (id: string) => qaGet<QaRunDetailResponse>(`/runs/${encodeURIComponent(id)}`),

  /** POST /api/runtics/qa/runs/:id/approve — mark a passed run as approved. */
  approve: (id: string) =>
    qaPost<QaApproveResponse>(`/runs/${encodeURIComponent(id)}/approve`),

  /** GET /api/runtics/qa/schedules — list cron schedules and their toggle state. */
  listSchedules: () => qaGet<QaSchedulesListResponse>('/schedules'),

  /** PATCH /api/runtics/qa/schedules/:id — flip toggle or tweak fields. */
  updateSchedule: (id: string, patch: QaScheduleUpdate) =>
    qaPatch<QaScheduleUpdateResponse>(
      `/schedules/${encodeURIComponent(id)}`,
      patch,
    ),
}

// ─── Display helpers ────────────────────────────────────────────────────────

export function sinceWindowToEpoch(window: QaSinceWindow): number | undefined {
  if (window === 'all') return undefined
  const now = Math.floor(Date.now() / 1000)
  switch (window) {
    case '24h': return now - 86_400
    case '7d':  return now - 86_400 * 7
    case '30d': return now - 86_400 * 30
  }
}

export function formatUnix(epochSec: number | null): string {
  if (!epochSec) return '—'
  return new Date(epochSec * 1000).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelativeUnix(epochSec: number | null): string {
  if (!epochSec) return '—'
  const diffMs = Date.now() - epochSec * 1000
  if (diffMs < 0) return 'en el futuro'
  if (diffMs < 60_000) return 'hace segundos'
  if (diffMs < 3_600_000) return `hace ${Math.floor(diffMs / 60_000)}m`
  if (diffMs < 86_400_000) return `hace ${Math.floor(diffMs / 3_600_000)}h`
  return `hace ${Math.floor(diffMs / 86_400_000)}d`
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${m}m${s.toString().padStart(2, '0')}s`
}

export function runDuration(run: QaRun): string {
  if (!run.started_at) return '—'
  const endMs = (run.completed_at ?? Math.floor(Date.now() / 1000)) * 1000
  const startMs = run.started_at * 1000
  if (endMs < startMs) return '—'
  return formatDurationMs(endMs - startMs)
}

/** True when we should keep polling (run is still in-flight). */
export function isActiveStatus(status: QaRunStatus): boolean {
  return status === 'queued' || status === 'running'
}

/** True when the run finished and is eligible for approval. */
export function isApprovable(run: QaRun): boolean {
  return run.status === 'passed' && !run.approved_by
}
