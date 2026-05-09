"use client"

import { useEffect, useState, useCallback } from 'react'
import { Plug, GitBranch, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  runticsApi,
  type ConnectionProvider,
  type TenantConnection,
  type TenantWebhook,
} from '../_lib'
import { ConnectionCard } from './ConnectionCard'
import { WebhookList } from './WebhookList'
import { ConnectGitHubFlow } from './ConnectGitHubFlow'

export default function RunticsConnectionsPage() {
  const [providers, setProviders] = useState<ConnectionProvider[]>([])
  const [connections, setConnections] = useState<TenantConnection[]>([])
  const [webhooks, setWebhooks] = useState<TenantWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pv, cs, ws] = await Promise.all([
        runticsApi.providers(),
        runticsApi.connections(),
        runticsApi.webhooks(),
      ])
      setProviders(pv.providers)
      setConnections(cs.connections)
      setWebhooks(ws.webhooks)
    } catch (err) {
      setError((err as Error).message ?? 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
    // ?connected=github → success flash
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('connected') === 'github') {
        setFlash('GitHub conectado correctamente')
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)
      } else if (params.get('error') === 'github') {
        setError('No pudimos completar la conexión con GitHub. Reintentá.')
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [loadAll])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Plug className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Conexiones</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Conectá GitHub (y, próximamente, otros providers) para que tus agents puedan auditar
          tus repos automáticamente vía webhooks.
        </p>
      </div>

      {flash && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">{flash}</p>
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      {/* Providers grid */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Providers disponibles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hacé click en un provider activo para conectarlo. Los grises están planeados.
          </p>
        </div>
        <div className="px-5 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* GitHub */}
          <ProviderTile
            providerId="github"
            label="GitHub"
            Icon={GitBranch}
            active={providers.some((p) => p.id === 'github' && p.status === 'active')}
            connected={connections.some((c) => c.provider_id === 'github' && c.status === 'active')}
          />
          {/* Future placeholders — visible but disabled */}
          <ProviderTile providerId="gitlab" label="GitLab" Icon={GitBranch} active={false} connected={false} />
          <ProviderTile providerId="bitbucket" label="Bitbucket" Icon={GitBranch} active={false} connected={false} />
          <ProviderTile providerId="linear" label="Linear" Icon={GitBranch} active={false} connected={false} />
        </div>
      </div>

      {/* Active connections */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Tus conexiones</h2>
          {connections.length > 0 && (
            <span className="text-xs text-slate-400">{connections.length} activas</span>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {connections.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              <Plug className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="mb-2">No hay conexiones activas todavía.</p>
              <p className="text-xs text-slate-400">Conectá un provider arriba para empezar.</p>
            </div>
          )}
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              webhooks={webhooks.filter((w) => w.connection_id === conn.id)}
              onChange={loadAll}
            />
          ))}
        </div>
      </div>

      {/* Standalone webhooks list (catch-all if any) */}
      {webhooks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Webhooks</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Todos los webhooks subscribed across providers.
            </p>
          </div>
          <WebhookList webhooks={webhooks} onChange={loadAll} />
        </div>
      )}
    </div>
  )
}

// ─── ProviderTile ────────────────────────────────────────────────────────────

function ProviderTile({
  providerId,
  label,
  Icon,
  active,
  connected,
}: {
  providerId: string
  label: string
  Icon: typeof GitBranch
  active: boolean
  connected: boolean
}) {
  const [showFlow, setShowFlow] = useState(false)

  if (providerId === 'github' && active) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowFlow(true)}
          className="border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-4 text-left transition-all bg-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Icon className="w-5 h-5 text-slate-700" />
            {connected && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                Conectado
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-900 text-sm">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {connected ? 'Agregar otra cuenta' : 'Conectar'}
          </p>
        </button>
        {showFlow && <ConnectGitHubFlow onClose={() => setShowFlow(false)} />}
      </>
    )
  }

  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 opacity-60">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-slate-400" />
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
          Pronto
        </span>
      </div>
      <p className="font-semibold text-slate-700 text-sm">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">Próximamente</p>
    </div>
  )
}
