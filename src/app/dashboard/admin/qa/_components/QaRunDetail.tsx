"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, FileText, RefreshCw, RotateCw, ShieldCheck, AlertTriangle } from 'lucide-react'

import { QaStatusBadge } from './QaStatusBadge'
import { QaChecksTable } from './QaChecksTable'
import { QaReportMarkdown } from './QaReportMarkdown'
import { ApproveButton } from './ApproveButton'
import { ValidateModal } from './ValidateModal'

import {
  formatUnix,
  formatRelativeUnix,
  isActiveStatus,
  isApprovable,
  qaApi,
  runDuration,
} from '../_lib/api'
import type { QaCheckResult, QaRun } from '../_lib/types'

interface QaRunDetailProps {
  runId: string
}

const POLL_ACTIVE_MS = 3_000
const POLL_IDLE_MS = 30_000

export function QaRunDetail({ runId }: QaRunDetailProps) {
  const [run, setRun] = useState<QaRun | null>(null)
  const [checks, setChecks] = useState<QaCheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [reRunOpen, setReRunOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const { run: r, checks: c } = await qaApi.run(runId)
      setRun(r)
      setChecks(c)
      setError(null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [runId])

  // Initial + on-demand load.
  useEffect(() => { void load() }, [load, reload])

  // Poll using setTimeout chain (cleaner than setInterval).
  useEffect(() => {
    if (!run) return
    const delay = isActiveStatus(run.status) ? POLL_ACTIVE_MS : POLL_IDLE_MS
    const handle = setTimeout(() => { void load() }, delay)
    return () => clearTimeout(handle)
  }, [run, load])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error && !run) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/admin/qa" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-3.5 h-3.5" /> QA Runs
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">No se pudo cargar el run</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
              {error.toLowerCase().includes('sesión') && (
                <p className="text-xs text-red-700 mt-2">
                  <Link href="/login" className="underline font-semibold">Andá a login</Link>
                </p>
              )}
              <button
                type="button"
                onClick={() => { setLoading(true); setReload((x) => x + 1) }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-100"
              >
                <RefreshCw className="w-3 h-3" /> Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!run) return null

  return (
    <div className="space-y-6">
      {/* Breadcrumb + reload pulse */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/admin/qa" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-3.5 h-3.5" /> QA Runs
        </Link>
        {isActiveStatus(run.status) && (
          <span className="text-[11px] text-blue-600 inline-flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin" /> Auto-refresh cada 3s
          </span>
        )}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <QaStatusBadge status={run.status} size="md" />
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                {run.scope}
              </span>
              {run.approved_by && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  approved
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 truncate">{run.subject}</h1>
            <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">{run.id}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setReRunOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <RotateCw className="w-3.5 h-3.5" /> Re-run
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          <Stat label="Triggered by" value={run.triggered_by || '—'} />
          <Stat label="Started" value={`${formatUnix(run.started_at)} · ${formatRelativeUnix(run.started_at)}`} />
          <Stat label="Completed" value={run.completed_at ? formatUnix(run.completed_at) : '—'} />
          <Stat label="Duration" value={runDuration(run)} />
        </div>

        {run.approved_by && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>Aprobado por <span className="font-semibold text-slate-900">{run.approved_by}</span></span>
            {run.approved_at && <span className="text-slate-500">{formatUnix(run.approved_at)}</span>}
          </div>
        )}
      </div>

      {/* Approve panel */}
      {isApprovable(run) && (
        <ApproveButton runId={run.id} onApproved={() => setReload((x) => x + 1)} />
      )}

      {/* Checks */}
      <QaChecksTable checks={checks} />

      {/* Report */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Report</h3>
        </div>
        <div className="px-5 py-4">
          <QaReportMarkdown source={run.report_md ?? ''} />
        </div>
      </div>

      {/* Meta (collapsible) */}
      {run.meta_json && (
        <details className="bg-white rounded-2xl border border-slate-200 px-5 py-3">
          <summary className="text-xs font-semibold text-slate-700 cursor-pointer">meta_json</summary>
          <pre className="text-[11px] text-slate-600 mt-2 overflow-x-auto whitespace-pre-wrap break-words">
            {safeJsonPretty(run.meta_json)}
          </pre>
        </details>
      )}

      {/* Soft refresh error banner */}
      {error && run && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800">
          Última actualización falló: {error}
        </div>
      )}

      {/* Re-run modal */}
      <ValidateModal
        open={reRunOpen}
        onClose={() => setReRunOpen(false)}
        initialSubject={run.subject}
        initialScope={run.scope}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5 truncate">{value}</p>
    </div>
  )
}

function safeJsonPretty(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}
