"use client"

import type { QaCheckStatus, QaRunStatus } from '../_lib/types'

const RUN_STATUS_STYLES: Record<QaRunStatus, { label: string; ring: string; pulse: boolean }> = {
  queued:   { label: 'queued',   ring: 'bg-slate-100 text-slate-600 ring-slate-200',     pulse: false },
  running:  { label: 'running',  ring: 'bg-blue-100 text-blue-700 ring-blue-200',         pulse: true },
  passed:   { label: 'passed',   ring: 'bg-emerald-100 text-emerald-800 ring-emerald-200', pulse: false },
  failed:   { label: 'failed',   ring: 'bg-red-100 text-red-800 ring-red-200',             pulse: false },
  blocked:  { label: 'blocked',  ring: 'bg-amber-100 text-amber-800 ring-amber-200',       pulse: false },
  error:    { label: 'error',    ring: 'bg-rose-100 text-rose-800 ring-rose-200',          pulse: false },
}

const CHECK_STATUS_STYLES: Record<QaCheckStatus, { label: string; ring: string }> = {
  pass:  { label: 'pass',  ring: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  fail:  { label: 'fail',  ring: 'bg-red-100 text-red-800 ring-red-200' },
  skip:  { label: 'skip',  ring: 'bg-slate-100 text-slate-500 ring-slate-200' },
  error: { label: 'error', ring: 'bg-rose-100 text-rose-800 ring-rose-200' },
}

interface QaStatusBadgeProps {
  status: QaRunStatus
  size?: 'sm' | 'md'
}

export function QaStatusBadge({ status, size = 'sm' }: QaStatusBadgeProps) {
  const cfg = RUN_STATUS_STYLES[status] ?? RUN_STATUS_STYLES.queued
  const sizeCls = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5'
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full ring-1 ${sizeCls} ${cfg.ring}`}
    >
      {cfg.pulse && (
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600" />
        </span>
      )}
      {cfg.label}
    </span>
  )
}

interface QaCheckBadgeProps {
  status: QaCheckStatus
}

export function QaCheckBadge({ status }: QaCheckBadgeProps) {
  const cfg = CHECK_STATUS_STYLES[status] ?? CHECK_STATUS_STYLES.skip
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full ring-1 text-[10px] px-2 py-0.5 ${cfg.ring}`}
    >
      {cfg.label}
    </span>
  )
}
