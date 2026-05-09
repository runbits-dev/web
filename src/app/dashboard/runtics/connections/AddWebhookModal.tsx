"use client"

import { useEffect, useState, useMemo } from 'react'
import { X, Plus, Loader2, AlertTriangle } from 'lucide-react'
import {
  runticsApi,
  type TenantConnection,
  type TenantWebhook,
  type DiscoveredRepo,
} from '../_lib'

const ALL_EVENTS = ['push', 'pull_request', 'release', 'workflow_run', 'issues'] as const

export function AddWebhookModal({
  connection,
  existing,
  onClose,
  onCreated,
}: {
  connection: TenantConnection
  existing: TenantWebhook[]
  onClose: () => void
  onCreated: () => void
}) {
  const [repos, setRepos] = useState<DiscoveredRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [reposError, setReposError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState('')
  const [events, setEvents] = useState<string[]>(['push', 'pull_request'])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribedRepos = useMemo(
    () => new Set(existing.map((w) => w.source_external_id)),
    [existing],
  )

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await runticsApi.discoverRepos(connection.id)
        if (!cancelled) {
          setRepos(res.repos)
          // Auto-select first not-subscribed
          const first = res.repos.find((r) => !subscribedRepos.has(r.full_name))
          if (first) setSelectedRepo(first.full_name)
        }
      } catch (err) {
        if (!cancelled) setReposError((err as Error).message ?? 'Error')
      } finally {
        if (!cancelled) setLoadingRepos(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [connection.id, subscribedRepos])

  function toggleEvent(e: string) {
    setEvents((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRepo) {
      setError('Elegí un repo')
      return
    }
    if (events.length === 0) {
      setError('Elegí al menos un evento')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await runticsApi.createWebhook({
        connection_id: connection.id,
        source_external_id: selectedRepo,
        events,
      })
      onCreated()
    } catch (err) {
      setError((err as Error).message ?? 'Error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Agregar webhook</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {connection.display_name ?? connection.external_account_login}
            </p>
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

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Repo</label>
            {loadingRepos ? (
              <div className="text-xs text-slate-400 inline-flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Cargando repos…
              </div>
            ) : reposError ? (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {reposError}
              </div>
            ) : repos.length === 0 ? (
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                No encontramos repos accesibles en esta instalación.
              </div>
            ) : (
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              >
                <option value="">— Elegí un repo —</option>
                {repos.map((r) => {
                  const taken = subscribedRepos.has(r.full_name)
                  return (
                    <option key={r.id} value={r.full_name} disabled={taken}>
                      {r.full_name} {r.private ? '(private)' : ''}{taken ? ' — ya suscrito' : ''}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Eventos</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EVENTS.map((e) => (
                <label key={e} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={events.includes(e)}
                    onChange={() => toggleEvent(e)}
                    className="rounded text-blue-600 focus:ring-blue-300"
                  />
                  <span className="text-slate-700">{e}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Por ahora solo `push` con cambios sensibles dispara el security-auditor.
            </p>
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !selectedRepo || events.length === 0}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creando…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Crear webhook
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
