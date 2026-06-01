"use client"

/**
 * /dashboard/admin/qa — runtics-qa runs list.
 *
 * Admin-only surface for the meta-QA agent. Lets the admin:
 *   - Browse recent QA runs, filtered by status / subject / time window
 *   - Spot in-flight runs (polls every 5s while any run is queued/running)
 *   - Kick off a new validation via the ValidateModal
 *
 * Auth: gateway enforces admin JWT on /api/runtics/qa/*. The dashboard
 * layout also gates /dashboard/admin/* to superadmin role.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react'

import { QaRunsTable, QaRunsTableSkeleton } from './_components/QaRunsTable'
import { ValidateModal } from './_components/ValidateModal'
import { isActiveStatus, qaApi, sinceWindowToEpoch } from './_lib/api'
import type { QaRun, QaRunStatus, QaSinceWindow } from './_lib/types'

const ALL_STATUSES: QaRunStatus[] = ['queued', 'running', 'passed', 'failed', 'blocked', 'error']
const POLL_ACTIVE_MS = 5_000
const POLL_IDLE_MS = 30_000

export default function QaRunsListPage() {
  const [runs, setRuns] = useState<QaRun[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<Set<QaRunStatus>>(new Set())
  const [subjectQuery, setSubjectQuery] = useState('')
  const [sinceWindow, setSinceWindow] = useState<QaSinceWindow>('7d')

  // Modal
  const [validateOpen, setValidateOpen] = useState(false)

  // ── Filter logic ────────────────────────────────────────────────────────────
  function toggleStatus(s: QaRunStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const filteredRuns = useMemo(() => {
    if (!runs) return []
    return runs.filter((r) => {
      if (selectedStatuses.size > 0 && !selectedStatuses.has(r.status)) return false
      if (subjectQuery.trim()) {
        const q = subjectQuery.trim().toLowerCase()
        if (!r.subject.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [runs, selectedStatuses, subjectQuery])

  // ── Loader ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const since = sinceWindowToEpoch(sinceWindow)
      // We pass a soft limit; backend caps further. We don't push status to the
      // server because we let the user toggle multiple values client-side.
      const { runs: r } = await qaApi.runs({ since, limit: 100 })
      setRuns(r)
      setRefreshError(null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido'
      setRefreshError(message)
    } finally {
      setLoading(false)
    }
  }, [sinceWindow])

  // Initial + manual reload.
  useEffect(() => { void load() }, [load, reload])

  // Polling chain (setTimeout, not setInterval — single in-flight at a time).
  useEffect(() => {
    if (!runs) return
    const anyActive = runs.some((r) => isActiveStatus(r.status))
    const delay = anyActive ? POLL_ACTIVE_MS : POLL_IDLE_MS
    const handle = setTimeout(() => { void load() }, delay)
    return () => clearTimeout(handle)
  }, [runs, load])

  const sessionExpired = !!refreshError && refreshError.toLowerCase().includes('sesión')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>QA Runs</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-slate-700" />
            QA Runs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Meta-QA agent (<span className="font-mono text-slate-700">runtics-qa</span>). Valida TypeScript, contracts, pulse-drift, smoke-e2e y service-bindings sobre cualquier subject del stack.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setValidateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Validate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="search"
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder="Buscar por subject o id…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 ring-1 ring-slate-200 rounded-lg p-0.5">
            {(['24h', '7d', '30d', 'all'] as QaSinceWindow[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSinceWindow(w)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition ${
                  sinceWindow === w ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {w === 'all' ? 'All' : `Last ${w}`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setLoading(true); setReload((x) => x + 1) }}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mr-1">Status</span>
          {ALL_STATUSES.map((s) => {
            const active = selectedStatuses.has(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 transition ${
                  active
                    ? 'bg-slate-900 text-white ring-slate-900'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            )
          })}
          {selectedStatuses.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatuses(new Set())}
              className="text-[11px] font-semibold px-2 py-1 text-slate-500 hover:text-slate-700"
            >
              limpiar
            </button>
          )}
        </div>
      </div>

      {/* Error / table */}
      {refreshError && !runs && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-800">
          <p className="font-semibold">No se pudo cargar la lista</p>
          <p className="text-xs mt-1">{refreshError}</p>
          {sessionExpired ? (
            <p className="text-xs mt-2">
              Sesión expirada, andá a <a href="/login" className="underline font-semibold">login</a>.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => { setLoading(true); setReload((x) => x + 1) }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3" /> Reintentar
            </button>
          )}
        </div>
      )}

      {loading && !runs ? (
        <QaRunsTableSkeleton />
      ) : (
        runs && <QaRunsTable runs={filteredRuns} />
      )}

      {/* Soft refresh error banner */}
      {refreshError && runs && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800">
          Última actualización falló: {refreshError}
        </div>
      )}

      <ValidateModal open={validateOpen} onClose={() => setValidateOpen(false)} />
    </div>
  )
}
