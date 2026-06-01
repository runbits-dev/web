/**
 * Types for the runtics-qa (meta-QA agent) admin UI.
 *
 * Mirrors the shapes returned by the runtics-qa worker via the gateway at
 * /api/runtics/qa/*. Admin JWT required.
 */

export type QaScope = 'shallow' | 'full'

export type QaRunStatus =
  | 'queued'
  | 'running'
  | 'passed'
  | 'failed'
  | 'blocked'
  | 'error'

export type QaCheckStatus = 'pass' | 'fail' | 'skip' | 'error'

export type QaCheckName =
  | 'typescript'
  | 'contracts'
  | 'pulse-drift'
  | 'smoke-e2e'
  | 'service-bindings'
  | string // tolerate future check names

export interface QaRun {
  id: string
  subject: string
  scope: QaScope
  status: QaRunStatus
  triggered_by: string
  started_at: number // unix seconds
  completed_at: number | null
  report_md: string | null
  report_r2_key: string | null
  meta_json: string | null
  approved_by: string | null
  approved_at: number | null
}

export interface QaCheckResult {
  run_id: string
  check_name: QaCheckName
  status: QaCheckStatus
  duration_ms: number
  output_excerpt: string | null
}

export interface QaRunsListResponse {
  runs: QaRun[]
}

export interface QaRunDetailResponse {
  run: QaRun
  checks: QaCheckResult[]
}

export interface QaValidateResponse {
  run_id: string
}

export interface QaApproveResponse {
  ok: true
}

export type QaSinceWindow = 'all' | '24h' | '7d' | '30d'
