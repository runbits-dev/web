// Realistic fixture data modelled on the current Runbits stack.
// Used as a graceful fallback when the runtics-pulse backend isn't deployed.

import type {
  PulseState,
  PulseResource,
  PulseEdge,
  PulseDriftEvent,
  PulseTimelineCommit,
} from './types'

const now = () => Math.floor(Date.now() / 1000)

const r = (
  id: string,
  type: PulseResource['type'],
  name: string,
  spec: Record<string, unknown>,
  observed: Record<string, unknown> = spec,
  drift_count = 0
): PulseResource => ({
  id,
  type,
  name,
  cf_resource_id: id,
  spec_json: JSON.stringify(spec, null, 2),
  observed_json: JSON.stringify(observed, null, 2),
  drift_count,
  first_seen_at: now() - 60 * 60 * 24 * 90,
  last_seen_at: now() - 60 * Math.floor(Math.random() * 60),
})

const e = (
  id: string,
  from_resource: string,
  to_resource: string,
  edge_type: PulseEdge['edge_type'],
  source: PulseEdge['source'] = 'wrangler.toml'
): PulseEdge => ({ id, from_resource, to_resource, edge_type, source })

// ── Workers ────────────────────────────────────────────────────────────────
const workers: PulseResource[] = [
  r('worker:runbits-gateway', 'worker', 'runbits-gateway', {
    routes: ['api.runbits.dev/*'],
    compatibility_date: '2025-10-01',
    bindings: ['AUTH_SERVICE', 'CORE_SERVICE', 'ORDERS_SERVICE', 'PAYMENTS_SERVICE'],
    cron: [],
  }),
  r('worker:runbits-auth', 'worker', 'runbits-auth', {
    compatibility_date: '2025-10-01',
    bindings: ['DB_AUTH', 'KV_GLOBAL'],
    secrets: ['JWT_SECRET', 'GOOGLE_CLIENT_SECRET'],
  }),
  r('worker:runbits-core', 'worker', 'runbits-core', {
    compatibility_date: '2025-10-01',
    bindings: ['DB_CORE', 'KV_GLOBAL'],
  }),
  r('worker:runbits-orders', 'worker', 'runbits-orders', {
    bindings: ['DB_ORDERS', 'QUEUE_ORDERS', 'NOTIFICATIONS_SERVICE'],
  }),
  r('worker:runbits-payments', 'worker', 'runbits-payments', {
    bindings: ['DB_ORDERS', 'KV_GLOBAL'],
    secrets: ['MP_ACCESS_TOKEN', 'STRIPE_SECRET'],
  }, {
    bindings: ['DB_ORDERS', 'KV_GLOBAL'],
    secrets: ['MP_ACCESS_TOKEN'], // STRIPE_SECRET missing in observed → drift
  }, 1),
  r('worker:runbits-social', 'worker', 'runbits-social', {
    bindings: ['DB_SOCIAL', 'KV_GLOBAL'],
  }),
  r('worker:runbits-notifications', 'worker', 'runbits-notifications', {
    bindings: ['QUEUE_NOTIFICATIONS', 'WHATSAPP_SERVICE', 'CHANNELS_SERVICE'],
  }),
  r('worker:runbits-channels', 'worker', 'runbits-channels', {
    bindings: ['DB_CORE'],
    secrets: ['SENDGRID_KEY'],
  }),
  r('worker:runbits-whatsapp', 'worker', 'runbits-whatsapp', {
    bindings: ['KV_GLOBAL'],
    secrets: ['WHATSAPP_TOKEN'],
  }),
  r('worker:runbits-domain', 'worker', 'runbits-domain', {
    bindings: ['DB_CORE', 'KV_GLOBAL'],
  }),
  r('worker:runbits-delivery', 'worker', 'runbits-delivery', {
    bindings: ['DB_ORDERS'],
  }),
  r('worker:runbits-verification', 'worker', 'runbits-verification', {
    bindings: ['DB_AUTH'],
    secrets: ['TWILIO_KEY'],
  }),
  r('worker:runbits-billing', 'worker', 'runbits-billing', {
    bindings: ['DB_CORE', 'QUEUE_BILLING'],
    cron: ['0 0 * * *'],
  }, {
    bindings: ['DB_CORE', 'QUEUE_BILLING'],
    cron: [], // declared cron, not active → drift
  }, 1),
  r('worker:runbits-og', 'worker', 'runbits-og', {
    bindings: [],
  }),
  r('worker:runbits-analytics', 'worker', 'runbits-analytics', {
    bindings: ['DB_ANALYTICS', 'R2_LOGS'],
  }),
  r('worker:runbits-status', 'worker', 'runbits-status', {
    bindings: ['KV_GLOBAL'],
    cron: ['*/5 * * * *'],
  }),
  r('worker:runtics-control', 'worker', 'runtics-control', {
    bindings: ['DB_CONTROL', 'KV_GLOBAL'],
  }),
  r('worker:runtics-agents-runtime', 'worker', 'runtics-agents-runtime', {
    bindings: ['DB_CONTROL', 'QUEUE_AGENTS', 'R2_AGENT_ARTIFACTS'],
  }),
  r('worker:runtics-pulse', 'worker', 'runtics-pulse', {
    bindings: ['DB_PULSE', 'R2_PULSE_STATE'],
    cron: ['0 */6 * * *'],
  }),
  r('worker:email-marketing', 'worker', 'email-marketing', {
    bindings: ['QUEUE_EMAILS'],
    secrets: ['SENDGRID_KEY'],
  }),
  r('worker:sales-agent', 'worker', 'sales-agent', {
    bindings: ['DB_CORE', 'KV_GLOBAL'],
  }),
  r('worker:loyalty', 'worker', 'loyalty', {
    bindings: ['DB_CORE'],
  }),
]

// ── D1 Databases ───────────────────────────────────────────────────────────
const dbs: PulseResource[] = [
  r('d1:runbits-auth', 'd1', 'runbits-auth', { migrations: 12, size_mb: 4.3 }),
  r('d1:runbits-core', 'd1', 'runbits-core', { migrations: 23, size_mb: 18.7 }),
  r('d1:runbits-orders', 'd1', 'runbits-orders', { migrations: 19, size_mb: 11.2 }),
  r('d1:runbits-catalog', 'd1', 'runbits-catalog', { migrations: 8, size_mb: 6.1 }),
  r('d1:runbits-social', 'd1', 'runbits-social', { migrations: 14, size_mb: 3.4 }),
  r(
    'd1:runbits-analytics',
    'd1',
    'runbits-analytics',
    { migrations: 7, size_mb: 24.0 },
    { migrations: 6, size_mb: 24.0 }, // migration not applied → drift
    1
  ),
  r('d1:runtics-control', 'd1', 'runtics-control', { migrations: 11, size_mb: 2.1 }),
  r('d1:runtics-pulse', 'd1', 'runtics-pulse', { migrations: 3, size_mb: 0.4 }),
]

// ── KV / R2 / Queues / Pages ───────────────────────────────────────────────
const others: PulseResource[] = [
  r('kv:global', 'kv', 'KV_GLOBAL', { keys: 8421 }),
  r('kv:sessions', 'kv', 'KV_SESSIONS', { keys: 312 }),
  r('r2:logs', 'r2', 'R2_LOGS', { objects: 1042, size_gb: 1.3 }),
  r('r2:agent-artifacts', 'r2', 'R2_AGENT_ARTIFACTS', { objects: 87, size_gb: 0.4 }),
  r('r2:pulse-state', 'r2', 'R2_PULSE_STATE', { objects: 144, size_gb: 0.02 }),
  r('queue:orders', 'queue', 'QUEUE_ORDERS', { backlog: 0, throughput_per_min: 42 }),
  r('queue:notifications', 'queue', 'QUEUE_NOTIFICATIONS', { backlog: 3, throughput_per_min: 18 }),
  r('queue:billing', 'queue', 'QUEUE_BILLING', { backlog: 0, throughput_per_min: 0 }),
  r('queue:agents', 'queue', 'QUEUE_AGENTS', { backlog: 1, throughput_per_min: 4 }),
  r('queue:emails', 'queue', 'QUEUE_EMAILS', { backlog: 8, throughput_per_min: 6 }),
  r('pages:runbits-web', 'pages', 'runbits-web', { domain: 'runbits.io', last_deploy: '2026-05-10T08:42:00Z' }),
  r('pages:runbits-app', 'pages', 'runbits-app', { domain: 'app.runbits.io', last_deploy: '2026-05-10T07:11:00Z' }),
]

const allResources: PulseResource[] = [...workers, ...dbs, ...others]

// ── Edges ──────────────────────────────────────────────────────────────────
const edges: PulseEdge[] = [
  // Gateway routes
  e('e1', 'worker:runbits-gateway', 'worker:runbits-auth', 'service_binding'),
  e('e2', 'worker:runbits-gateway', 'worker:runbits-core', 'service_binding'),
  e('e3', 'worker:runbits-gateway', 'worker:runbits-orders', 'service_binding'),
  e('e4', 'worker:runbits-gateway', 'worker:runbits-payments', 'service_binding'),
  e('e5', 'worker:runbits-gateway', 'worker:runbits-social', 'service_binding'),
  e('e6', 'worker:runbits-gateway', 'worker:runbits-channels', 'service_binding'),
  e('e7', 'worker:runbits-gateway', 'worker:runbits-domain', 'service_binding'),
  e('e8', 'worker:runbits-gateway', 'worker:runbits-billing', 'service_binding'),
  e('e9', 'worker:runbits-gateway', 'worker:runbits-analytics', 'service_binding'),
  e('e10', 'worker:runbits-gateway', 'worker:runtics-control', 'service_binding'),
  e('e11', 'worker:runbits-gateway', 'worker:runtics-pulse', 'service_binding'),

  // Frontend → gateway
  e('e20', 'pages:runbits-web', 'worker:runbits-gateway', 'frontend_call', 'src_grep'),
  e('e21', 'pages:runbits-app', 'worker:runbits-gateway', 'frontend_call', 'src_grep'),

  // DB bindings
  e('e30', 'worker:runbits-auth', 'd1:runbits-auth', 'd1_binding'),
  e('e31', 'worker:runbits-core', 'd1:runbits-core', 'd1_binding'),
  e('e32', 'worker:runbits-orders', 'd1:runbits-orders', 'd1_binding'),
  e('e33', 'worker:runbits-payments', 'd1:runbits-orders', 'd1_binding'),
  e('e34', 'worker:runbits-social', 'd1:runbits-social', 'd1_binding'),
  e('e35', 'worker:runbits-channels', 'd1:runbits-core', 'd1_binding'),
  e('e36', 'worker:runbits-domain', 'd1:runbits-core', 'd1_binding'),
  e('e37', 'worker:runbits-delivery', 'd1:runbits-orders', 'd1_binding'),
  e('e38', 'worker:runbits-verification', 'd1:runbits-auth', 'd1_binding'),
  e('e39', 'worker:runbits-billing', 'd1:runbits-core', 'd1_binding'),
  e('e40', 'worker:runbits-analytics', 'd1:runbits-analytics', 'd1_binding'),
  e('e41', 'worker:runtics-control', 'd1:runtics-control', 'd1_binding'),
  e('e42', 'worker:runtics-agents-runtime', 'd1:runtics-control', 'd1_binding'),
  e('e43', 'worker:runtics-pulse', 'd1:runtics-pulse', 'd1_binding'),
  e('e44', 'worker:sales-agent', 'd1:runbits-core', 'd1_binding'),
  e('e45', 'worker:loyalty', 'd1:runbits-core', 'd1_binding'),

  // KV
  e('e50', 'worker:runbits-auth', 'kv:global', 'kv_binding'),
  e('e51', 'worker:runbits-core', 'kv:global', 'kv_binding'),
  e('e52', 'worker:runbits-payments', 'kv:global', 'kv_binding'),
  e('e53', 'worker:runbits-social', 'kv:global', 'kv_binding'),
  e('e54', 'worker:runbits-whatsapp', 'kv:global', 'kv_binding'),
  e('e55', 'worker:runbits-domain', 'kv:global', 'kv_binding'),
  e('e56', 'worker:runbits-status', 'kv:global', 'kv_binding'),
  e('e57', 'worker:runtics-control', 'kv:global', 'kv_binding'),
  e('e58', 'worker:sales-agent', 'kv:global', 'kv_binding'),

  // R2
  e('e60', 'worker:runbits-analytics', 'r2:logs', 'r2_binding'),
  e('e61', 'worker:runtics-agents-runtime', 'r2:agent-artifacts', 'r2_binding'),
  e('e62', 'worker:runtics-pulse', 'r2:pulse-state', 'r2_binding'),

  // Queues — producers / consumers
  e('e70', 'worker:runbits-orders', 'queue:orders', 'queue_producer'),
  e('e71', 'worker:runbits-notifications', 'queue:orders', 'queue_consumer'),
  e('e72', 'worker:runbits-orders', 'queue:notifications', 'queue_producer'),
  e('e73', 'worker:runbits-notifications', 'queue:notifications', 'queue_consumer'),
  e('e74', 'worker:runbits-billing', 'queue:billing', 'queue_producer'),
  e('e75', 'worker:runtics-agents-runtime', 'queue:agents', 'queue_producer'),
  e('e76', 'worker:email-marketing', 'queue:emails', 'queue_producer'),
  e('e77', 'worker:runbits-notifications', 'queue:emails', 'queue_consumer'),

  // Inter-worker service bindings
  e('e80', 'worker:runbits-orders', 'worker:runbits-notifications', 'service_binding'),
  e('e81', 'worker:runbits-notifications', 'worker:runbits-whatsapp', 'service_binding'),
  e('e82', 'worker:runbits-notifications', 'worker:runbits-channels', 'service_binding'),
]

// ── Drift events ───────────────────────────────────────────────────────────
const drift_events: PulseDriftEvent[] = [
  {
    id: 'drift-001',
    event_type: 'SECRET_BROKEN',
    resource_id: 'worker:runbits-payments',
    severity: 'critical',
    title: 'STRIPE_SECRET declarado pero ausente en producción',
    description:
      'wrangler.toml declara STRIPE_SECRET pero el worker desplegado no lo tiene. Pagos Stripe pueden fallar silenciosamente.',
    spec_json: JSON.stringify({ secrets: ['MP_ACCESS_TOKEN', 'STRIPE_SECRET'] }, null, 2),
    observed_json: JSON.stringify({ secrets: ['MP_ACCESS_TOKEN'] }, null, 2),
    status: 'open',
    created_at: now() - 3600 * 2,
  },
  {
    id: 'drift-002',
    event_type: 'CRON_DECLARED_NOT_ACTIVE',
    resource_id: 'worker:runbits-billing',
    severity: 'warning',
    title: 'Cron 0 0 * * * declarado pero no activo',
    description:
      'El cron de billing (corrida diaria a medianoche) está declarado en wrangler.toml pero no aparece en la lista de triggers del deployment actual.',
    spec_json: JSON.stringify({ cron: ['0 0 * * *'] }, null, 2),
    observed_json: JSON.stringify({ cron: [] }, null, 2),
    status: 'open',
    created_at: now() - 3600 * 8,
  },
  {
    id: 'drift-003',
    event_type: 'MIGRATION_NOT_APPLIED',
    resource_id: 'd1:runbits-analytics',
    severity: 'warning',
    title: 'Migración 0007 pendiente en runbits-analytics',
    description:
      'Local migrations dir tiene 7 archivos, la base remota reporta 6 aplicados. Tabla `events_daily_agg` puede no existir.',
    spec_json: JSON.stringify({ migrations: 7 }, null, 2),
    observed_json: JSON.stringify({ migrations: 6 }, null, 2),
    status: 'open',
    created_at: now() - 3600 * 18,
  },
  {
    id: 'drift-004',
    event_type: 'BINDING_DECLARED_NOT_DEPLOYED',
    resource_id: 'worker:runbits-notifications',
    severity: 'info',
    title: 'Binding CHANNELS_SERVICE declarado, no usado en código',
    description:
      'Se declaró binding service hacia runbits-channels pero `grep` en src/ no encuentra referencias. Binding muerto.',
    spec_json: JSON.stringify({ bindings: ['QUEUE_NOTIFICATIONS', 'WHATSAPP_SERVICE', 'CHANNELS_SERVICE'] }, null, 2),
    observed_json: JSON.stringify({ used_in_code: ['QUEUE_NOTIFICATIONS', 'WHATSAPP_SERVICE'] }, null, 2),
    status: 'open',
    created_at: now() - 3600 * 36,
  },
  {
    id: 'drift-005',
    event_type: 'AUTH_PATTERN_DIVERGENT',
    resource_id: 'worker:sales-agent',
    severity: 'warning',
    title: 'sales-agent no usa el middleware auth estándar',
    description:
      'Todos los workers de Runbits importan `requireAuth` de @runbits/shared. sales-agent valida JWT inline — patrón divergente.',
    spec_json: JSON.stringify({ pattern: 'requireAuth from @runbits/shared' }, null, 2),
    observed_json: JSON.stringify({ pattern: 'inline jwt.verify()' }, null, 2),
    status: 'acknowledged',
    created_at: now() - 3600 * 72,
  },
]

// Bump drift_count on affected resources
for (const ev of drift_events) {
  if (ev.status === 'open') {
    const res = allResources.find((x) => x.id === ev.resource_id)
    if (res) res.drift_count = Math.max(res.drift_count, 1)
  }
}

export const FIXTURE_STATE: PulseState = {
  resources: allResources,
  edges,
  drift_events,
  snapshot_meta: {
    commit_sha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e',
    generated_at: now() - 120,
    scanner_version: '0.1.0-mock',
    total_resources: allResources.length,
    total_edges: edges.length,
    open_drifts: drift_events.filter((d) => d.status === 'open').length,
  },
}

// ── Timeline fixtures ──────────────────────────────────────────────────────
const COMMIT_MESSAGES = [
  'scan: full topology refresh',
  'scan: incremental update',
  'scan: secret rotation detected',
  'scan: new worker runtics-pulse deployed',
  'scan: migration applied on runbits-orders',
  'scan: binding added — runbits-orders → queue:notifications',
  'scan: deprecated worker removed',
  'scan: cron activated on runbits-status',
  'scan: drift CONFIG_DIVERGENT resolved',
  'scan: routine deploy snapshot',
]

export const FIXTURE_TIMELINE: PulseTimelineCommit[] = Array.from({ length: 28 }, (_, i) => {
  const ts = now() - i * 3600 * 6
  const sha = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8)
  return {
    sha,
    short_sha: sha.slice(0, 7),
    message: COMMIT_MESSAGES[i % COMMIT_MESSAGES.length],
    author: 'runtics-pulse-bot',
    timestamp: ts,
    added: Math.floor(Math.random() * 4),
    removed: Math.floor(Math.random() * 2),
    modified: Math.floor(Math.random() * 8),
    drift_delta: i === 0 ? 0 : Math.floor(Math.random() * 3) - 1,
  }
})
