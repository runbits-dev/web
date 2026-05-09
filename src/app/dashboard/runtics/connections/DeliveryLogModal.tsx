"use client"

import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import {
  runticsApi,
  type TenantWebhook,
  type WebhookDelivery,
  formatRelative,
  formatTime,
} from '../_lib'

export function DeliveryLogModal({
  webhook,
  onClose,
}: {
  webhook: TenantWebhook
  onClose: () => void
}) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await runticsApi.webhookDeliveries(webhook.id, { limit: 50 })
        if (!cancelled) setDeliveries(res.deliveries)
      } catch (err) {
        if (!cancelled) setError((err as Error).message ?? 'Error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [webhook.id])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Deliveries</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{webhook.source_external_id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm inline-flex items-center justify-center gap-2 w-full">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        ) : error ? (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {error}
          </div>
        ) : deliveries.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Sin deliveries todavía.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {deliveries.map((d) => {
              let summary: Record<string, unknown> = {}
              try {
                summary = d.payload_summary_json
                  ? (JSON.parse(d.payload_summary_json) as Record<string, unknown>)
                  : {}
              } catch {
                /* ignore */
              }
              let triggered: string[] = []
              try {
                triggered = d.triggered_runs_json
                  ? (JSON.parse(d.triggered_runs_json) as string[])
                  : []
              } catch {
                /* ignore */
              }
              const valid = d.signature_valid === 1
              return (
                <li key={d.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {valid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <p className="text-sm font-semibold text-slate-900">{d.event_type}</p>
                        <span className="text-[10px] text-slate-400">{formatRelative(d.received_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 ml-6 truncate">
                        {Object.entries(summary)
                          .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
                          .join(' · ')}
                      </p>
                      {triggered.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1 ml-6">
                          {triggered.length} run{triggered.length !== 1 ? 's' : ''} disparado{triggered.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatTime(d.received_at).split(',')[0]}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
