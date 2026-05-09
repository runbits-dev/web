"use client"

import { useState } from 'react'
import { Trash2, Activity, Send, ListOrdered } from 'lucide-react'
import {
  runticsApi,
  type TenantWebhook,
  type WebhookStatus,
  formatRelative,
} from '../_lib'
import { DeliveryLogModal } from './DeliveryLogModal'

export function WebhookList({
  webhooks,
  onChange,
  compact = false,
}: {
  webhooks: TenantWebhook[]
  onChange: () => void
  compact?: boolean
}) {
  const [showLogFor, setShowLogFor] = useState<TenantWebhook | null>(null)

  return (
    <>
      <ul className={compact ? 'space-y-1' : 'divide-y divide-slate-100'}>
        {webhooks.map((wh) => (
          <WebhookRow
            key={wh.id}
            webhook={wh}
            onChange={onChange}
            onShowLog={() => setShowLogFor(wh)}
            compact={compact}
          />
        ))}
      </ul>
      {showLogFor && (
        <DeliveryLogModal
          webhook={showLogFor}
          onClose={() => setShowLogFor(null)}
        />
      )}
    </>
  )
}

function WebhookRow({
  webhook,
  onChange,
  onShowLog,
  compact,
}: {
  webhook: TenantWebhook
  onChange: () => void
  onShowLog: () => void
  compact: boolean
}) {
  const [busy, setBusy] = useState(false)

  let events: string[] = []
  try {
    events = JSON.parse(webhook.events_json) as string[]
  } catch {
    events = []
  }

  async function remove() {
    if (!window.confirm(`¿Eliminar webhook para ${webhook.source_external_id}?`)) return
    setBusy(true)
    try {
      await runticsApi.deleteWebhook(webhook.id)
      onChange()
    } catch (err) {
      alert(`Error: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function ping() {
    setBusy(true)
    try {
      await runticsApi.testWebhook(webhook.id)
      alert('Ping enviado. Mirá deliveries en unos segundos.')
    } catch (err) {
      alert(`Error: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={`flex items-center justify-between gap-3 ${compact ? 'py-2' : 'px-5 py-3'}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {webhook.source_external_id}
          </p>
          <StatusBadge status={webhook.status} />
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {events.join(', ') || 'sin eventos'}
          {webhook.last_received_at != null && (
            <> · último delivery {formatRelative(webhook.last_received_at)}</>
          )}
          {webhook.failures_count > 0 && (
            <> · {webhook.failures_count} fallos seguidos</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onShowLog}
          className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          title="Ver deliveries"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={ping}
          disabled={busy}
          className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-40"
          title="Enviar ping de prueba"
        >
          <Send className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="text-slate-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  )
}

function StatusBadge({ status }: { status: WebhookStatus }) {
  const map: Record<WebhookStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    failing: 'bg-amber-50 text-amber-700 ring-amber-200',
    disabled: 'bg-slate-100 text-slate-600 ring-slate-200',
    revoked: 'bg-slate-100 text-slate-500 ring-slate-200',
  }
  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ring-1 ${map[status]}`}
    >
      {status}
    </span>
  )
}
