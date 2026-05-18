// Shared types for Pulse — kept in sync with the runtics-pulse backend.

export type ResourceType =
  | 'worker'
  | 'd1'
  | 'kv'
  | 'r2'
  | 'queue'
  | 'pages'
  | 'secret'

export type EdgeType =
  | 'service_binding'
  | 'd1_binding'
  | 'kv_binding'
  | 'r2_binding'
  | 'queue_producer'
  | 'queue_consumer'
  | 'webhook'
  | 'frontend_call'

export type EdgeSource = 'wrangler.toml' | 'src_grep' | 'inferred'

export type DriftEventType =
  | 'SECRET_BROKEN'
  | 'BINDING_DECLARED_NOT_DEPLOYED'
  | 'CONFIG_DIVERGENT'
  | 'MIGRATION_NOT_APPLIED'
  | 'CRON_DECLARED_NOT_ACTIVE'
  | 'CIRCULAR_DEPENDENCY'
  | 'WORKER_DEPLOYED_NOT_DECLARED'
  | 'AUTH_PATTERN_DIVERGENT'

export type DriftSeverity = 'critical' | 'warning' | 'info'
export type DriftStatus = 'open' | 'acknowledged' | 'resolved'

export interface PulseResource {
  id: string
  type: ResourceType
  name: string
  cf_resource_id?: string
  spec_json: string
  observed_json: string
  drift_count: number
  last_seen_at: number
  first_seen_at: number
}

export interface PulseEdge {
  id: string
  from_resource: string
  to_resource: string
  edge_type: EdgeType
  source: EdgeSource
}

export interface PulseDriftEvent {
  id: string
  event_type: DriftEventType
  resource_id: string
  severity: DriftSeverity
  title: string
  description: string
  spec_json: string
  observed_json: string
  status: DriftStatus
  created_at: number
}

export interface PulseSnapshotMeta {
  commit_sha: string
  generated_at: number
  scanner_version: string
  total_resources: number
  total_edges: number
  open_drifts: number
}

export interface PulseState {
  resources: PulseResource[]
  edges: PulseEdge[]
  drift_events: PulseDriftEvent[]
  snapshot_meta: PulseSnapshotMeta
}

export interface PulseTimelineCommit {
  sha: string
  short_sha: string
  message: string
  author: string
  timestamp: number
  added: number
  removed: number
  modified: number
  drift_delta: number
}

export interface PulseChanges {
  from: string
  to: string
  added_resources: PulseResource[]
  removed_resources: PulseResource[]
  modified_resources: Array<{ before: PulseResource; after: PulseResource }>
  added_edges: PulseEdge[]
  removed_edges: PulseEdge[]
}
