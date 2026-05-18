// Pulse API client — falls back gracefully to fixtures when the backend is
// not yet deployed (any non-2xx, network error, or 404 → fixtures).

import { API_BASE } from '@/lib/api'
import type {
  PulseState,
  PulseDriftEvent,
  PulseTimelineCommit,
  PulseChanges,
  DriftStatus,
} from './types'
import { FIXTURE_STATE, FIXTURE_TIMELINE } from './fixtures'

export interface PulseFetchResult<T> {
  data: T
  /** true when the live backend responded; false when fixtures were used. */
  live: boolean
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function tryFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers as Record<string, string>) },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getPulseState(): Promise<PulseFetchResult<PulseState>> {
  const live = await tryFetch<PulseState>('/api/pulse/state')
  if (live && Array.isArray(live.resources)) {
    return { data: live, live: true }
  }
  return { data: FIXTURE_STATE, live: false }
}

export async function getPulseStateAt(commitSha: string): Promise<PulseFetchResult<PulseState>> {
  const live = await tryFetch<PulseState>(`/api/pulse/state/at/${commitSha}`)
  if (live && Array.isArray(live.resources)) {
    return { data: live, live: true }
  }
  return { data: FIXTURE_STATE, live: false }
}

export async function getPulseDrift(
  status: DriftStatus | 'all' = 'open'
): Promise<PulseFetchResult<PulseDriftEvent[]>> {
  const q = status === 'all' ? '' : `?status=${status}`
  const live = await tryFetch<PulseDriftEvent[]>(`/api/pulse/drift${q}`)
  if (live && Array.isArray(live)) {
    return { data: live, live: true }
  }
  const filtered =
    status === 'all'
      ? FIXTURE_STATE.drift_events
      : FIXTURE_STATE.drift_events.filter((d) => d.status === status)
  return { data: filtered, live: false }
}

export async function getPulseTimeline(limit = 50): Promise<PulseFetchResult<PulseTimelineCommit[]>> {
  const live = await tryFetch<PulseTimelineCommit[]>(`/api/pulse/timeline?limit=${limit}`)
  if (live && Array.isArray(live)) {
    return { data: live, live: true }
  }
  return { data: FIXTURE_TIMELINE.slice(0, limit), live: false }
}

export async function getPulseChanges(
  from: string,
  to: string
): Promise<PulseFetchResult<PulseChanges>> {
  const live = await tryFetch<PulseChanges>(`/api/pulse/changes?from=${from}&to=${to}`)
  if (live) return { data: live, live: true }
  return {
    data: {
      from,
      to,
      added_resources: [],
      removed_resources: [],
      modified_resources: [],
      added_edges: [],
      removed_edges: [],
    },
    live: false,
  }
}

export async function triggerScan(): Promise<{ ok: boolean; live: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/pulse/scan`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      return { ok: true, live: true, message: body.message }
    }
    return { ok: false, live: false, message: `Backend respondió ${res.status}` }
  } catch {
    return { ok: false, live: false, message: 'Backend no alcanzable' }
  }
}
