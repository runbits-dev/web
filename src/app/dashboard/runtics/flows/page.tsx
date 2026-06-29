"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Zap, Plus, ChevronRight, AlertTriangle, Power } from 'lucide-react'
import { runticsApi, type Flow, formatRelative } from '../_lib'

export default function RunticsFlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await runticsApi.flows()
      setFlows(res.flows)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])

  async function toggleStatus(flow: Flow) {
    const next = flow.status === 'enabled' ? 'disabled' : 'enabled'
    try {
      await runticsApi.updateFlow(flow.id, { status: next })
      void loadAll()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Zap className="w-6 h-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900">Flows</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Encadená agentes para automatizar tareas recurrentes. Cada flow se dispara desde una
            nota (intake) o via webhook/cron.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Nuevo flow
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200">
        {flows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            <Zap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="mb-2">No hay flows todavía.</p>
            <p className="text-xs">Creá el primero arriba.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {flows.map((f) => {
              const nodeCount = parseDslNodes(f.dsl_json)
              return (
                <div key={f.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/dashboard/runtics/flows/${encodeURIComponent(f.id)}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{f.name}</span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ring-1 ${
                            f.status === 'enabled'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-slate-100 text-slate-500 ring-slate-200'
                          }`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {f.description ?? 'Sin descripción'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {nodeCount} {nodeCount === 1 ? 'nodo' : 'nodos'} · actualizado {formatRelative(f.updated_at)} · id <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">{f.id}</code>
                      </p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleStatus(f)}
                      title={f.status === 'enabled' ? 'Deshabilitar' : 'Habilitar'}
                      className={`p-2 rounded-lg transition-colors ${
                        f.status === 'enabled'
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/dashboard/runtics/flows/${encodeURIComponent(f.id)}`}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {creating && (
        <CreateFlowDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            void loadAll()
          }}
        />
      )}
    </div>
  )
}

function parseDslNodes(dslJson: string): number {
  try {
    const dsl = JSON.parse(dslJson) as { nodes?: unknown[] }
    return Array.isArray(dsl.nodes) ? dsl.nodes.length : 0
  } catch {
    return 0
  }
}

function CreateFlowDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await runticsApi.createFlow({
        id: id.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        // Start with an empty DSL — the user fills nodes in the detail page.
        dsl: { nodes: [] },
        status: 'disabled',
      })
      onCreated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Nuevo flow</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crealo vacío y armás los nodos en la página del detalle.
          </p>
        </div>
        <form onSubmit={submit} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ID (kebab-case)
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="pm_orchestrator"
              required
              pattern="[a-z0-9_-]+"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Identificador único, no se puede cambiar después.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PM Orchestrator"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !id.trim() || !name.trim()}
              className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
            >
              {submitting ? 'Creando…' : 'Crear flow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
