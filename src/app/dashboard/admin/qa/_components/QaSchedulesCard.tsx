"use client"

/**
 * QA schedules card — visible toggle for each cron declared in
 * wrangler.toml. The cron itself always fires on the Cloudflare side; the
 * worker reads qa_schedules.enabled at every tick and only dispatches a run
 * when the row is on. Flipping the switch is a single PATCH — no redeploy.
 *
 * UX notes:
 *  - Optimistic toggle: the switch flips instantly. On API error we rewind
 *    the local state and surface an inline message under the row. We do not
 *    rely on a global toast system — the existing UI doesn't have one.
 *  - The toggle is the source of feedback. We don't render a "saved" pill.
 *  - cron_expression, subject and scope are read-only in V1. Editing them
 *    is wired up on the backend but not exposed here — wait for a real use
 *    case before adding the form.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarClock, Loader2 } from 'lucide-react'

import { qaApi, formatRelativeUnix } from '../_lib/api'
import type { QaSchedule } from '../_lib/types'

interface QaSchedulesCardProps {
  /** Called after a successful toggle so the parent can refresh the runs list. */
  onChange?: () => void
}

export function QaSchedulesCard({ onChange }: QaSchedulesCardProps) {
  const [schedules, setSchedules] = useState<QaSchedule[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { schedules: rows } = await qaApi.listSchedules()
      setSchedules(rows)
      setLoadError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading && !schedules) {
    return <QaSchedulesCardSkeleton />
  }

  if (loadError && !schedules) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <Header />
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">No se pudieron cargar las schedules.</p>
            <p className="mt-0.5">{loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <Header />
        <p className="text-xs text-slate-400 mt-3">Sin schedules configurados.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <Header />
      <ul className="mt-4 divide-y divide-slate-100">
        {schedules.map((s) => (
          <ScheduleRow
            key={s.id}
            schedule={s}
            onUpdated={(next) => {
              setSchedules((prev) =>
                prev ? prev.map((p) => (p.id === next.id ? next : p)) : prev,
              )
              onChange?.()
            }}
            onLocalToggle={(id, enabled) => {
              setSchedules((prev) =>
                prev ? prev.map((p) => (p.id === id ? { ...p, enabled } : p)) : prev,
              )
            }}
          />
        ))}
      </ul>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex w-8 h-8 rounded-lg bg-slate-100 text-slate-700 items-center justify-center">
        <CalendarClock className="w-4 h-4" />
      </span>
      <div>
        <h2 className="text-sm font-bold text-slate-900">Programación automática</h2>
        <p className="text-[11px] text-slate-500">
          Activá o desactivá los cron de QA sin necesidad de redeploy.
        </p>
      </div>
    </div>
  )
}

interface ScheduleRowProps {
  schedule: QaSchedule
  /** Replace the row entirely after a confirmed server update. */
  onUpdated: (next: QaSchedule) => void
  /** Apply an optimistic enabled-only patch immediately. */
  onLocalToggle: (id: string, enabled: boolean) => void
}

function ScheduleRow({ schedule, onUpdated, onLocalToggle }: ScheduleRowProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    if (submitting) return
    const previous = schedule.enabled
    const next = !previous
    setError(null)
    setSubmitting(true)
    // Optimistic flip — let the parent rewrite local state immediately so
    // the switch visually moves before the round-trip completes.
    onLocalToggle(schedule.id, next)
    try {
      const { schedule: updated } = await qaApi.updateSchedule(schedule.id, { enabled: next })
      onUpdated(updated)
    } catch (err) {
      // Roll back on failure and surface the error inline.
      onLocalToggle(schedule.id, previous)
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{schedule.name}</p>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 ring-1 ring-slate-200 rounded px-1.5 py-0.5">
              {schedule.cron_expression}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{schedule.description}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 flex-wrap">
            <span className="font-mono bg-slate-50 ring-1 ring-slate-200 rounded px-1.5 py-0.5">
              {schedule.subject}
            </span>
            <span className="font-mono bg-slate-50 ring-1 ring-slate-200 rounded px-1.5 py-0.5">
              {schedule.scope}
            </span>
            {schedule.last_run_id ? (
              <>
                <span className="text-slate-300">·</span>
                <span>
                  último run{' '}
                  <Link
                    href={`/dashboard/admin/qa/run?id=${encodeURIComponent(schedule.last_run_id)}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {schedule.last_run_id.slice(0, 12)}
                  </Link>
                  {schedule.last_run_status ? (
                    <span className="text-slate-500"> ({schedule.last_run_status})</span>
                  ) : null}
                  {schedule.last_run_at ? (
                    <span className="text-slate-400">
                      {' '}· {formatRelativeUnix(schedule.last_run_at)}
                    </span>
                  ) : null}
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">sin runs aún</span>
              </>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-700 mt-2 bg-red-50 border border-red-200 rounded px-2 py-1 inline-block">
              {error}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          <ToggleSwitch
            enabled={schedule.enabled}
            onClick={handleToggle}
            disabled={submitting}
            label={`Activar schedule ${schedule.name}`}
          />
        </div>
      </div>
    </li>
  )
}

interface ToggleSwitchProps {
  enabled: boolean
  onClick: () => void
  disabled?: boolean
  label: string
}

function ToggleSwitch({ enabled, onClick, disabled, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 ${
        enabled ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-slate-200 transition-transform duration-150 ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function QaSchedulesCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <Header />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 1 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-100 rounded w-40 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded w-64 animate-pulse" />
            </div>
            <div className="h-6 w-11 bg-slate-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
