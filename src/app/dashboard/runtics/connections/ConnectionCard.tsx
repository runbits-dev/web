"use client"

import { useState } from 'react'
import { GitBranch, Trash2, Plus, ChevronDown, ChevronUp, Building2, User } from 'lucide-react'
import {
  runticsApi,
  type TenantConnection,
  type TenantWebhook,
  formatRelative,
} from '../_lib'
import { WebhookList } from './WebhookList'
import { AddWebhookModal } from './AddWebhookModal'

export function ConnectionCard({
  connection,
  webhooks,
  onChange,
}: {
  connection: TenantConnection
  webhooks: TenantWebhook[]
  onChange: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function disconnect() {
    if (
      !window.confirm(
        `¿Desconectar ${connection.display_name ?? connection.provider_id}? Se eliminarán también todos sus webhooks.`,
      )
    )
      return
    setRemoving(true)
    try {
      await runticsApi.deleteConnection(connection.id)
      onChange()
    } catch (err) {
      alert(`Error: ${(err as Error).message}`)
    } finally {
      setRemoving(false)
    }
  }

  const failingCount = webhooks.filter((w) => w.status === 'failing').length

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-start gap-3 flex-1 min-w-0 text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 text-sm truncate">
                {connection.display_name ?? connection.external_account_login ?? connection.id}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                {connection.status}
              </span>
              {failingCount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                  {failingCount} con fallos
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              {connection.external_account_type === 'organization' ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> organización
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" /> usuario
                </span>
              )}
              <span>conectada {formatRelative(connection.connected_at)}</span>
              {webhooks.length > 0 && <span>{webhooks.length} webhooks</span>}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-3 h-3" /> Webhook
          </button>
          <button
            type="button"
            onClick={disconnect}
            disabled={removing}
            className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Desconectar"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">{removing ? 'Eliminando…' : 'Desconectar'}</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 ml-12">
          {webhooks.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Sin webhooks. Agregá uno para que el agent monitoree los pushes.</p>
          ) : (
            <WebhookList webhooks={webhooks} onChange={onChange} compact />
          )}
        </div>
      )}

      {showAdd && (
        <AddWebhookModal
          connection={connection}
          existing={webhooks}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            onChange()
          }}
        />
      )}
    </div>
  )
}
