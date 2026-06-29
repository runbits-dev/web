"use client"

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { runticsApi, type Flow, type FlowRun, formatRelative, statusColor } from '../../_lib'

export default function FlowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [flow, setFlow] = useState<Flow | null>(null)
  const [runs, setRuns] = useState<FlowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dslText, setDslText] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await runticsApi.flow(id)
      setFlow(res.flow)
      setRuns(res.recent_runs)
      setName(res.flow.name)
      setDescription(res.flow.description ?? '')
      const parsed = (() => { try { return JSON.stringify(JSON.parse(res.flow.dsl_json), null, 2) } catch { return res.flow.dsl_json } })()
      setDslText(parsed)
      setDirty(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function save() {
    setSaving(true)
    setError(null)
    let dsl: unknown
    try {
      dsl = JSON.parse(dslText)
    } catch {
      setError('El DSL no es JSON válido')
      setSaving(false)
      return
    }
    try {
      await runticsApi.updateFlow(id, { name, description, dsl: dsl as { nodes: Array<{ id: string; agent: string }> } })
      setFlash('Guardado')
      setDirty(false)
      setTimeout(() => setFlash(null), 2000)
      void load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm(`¿Borrar el flow "${flow?.name}"? Esto no afecta corridas pasadas.`)) return
    try {
      await runticsApi.deleteFlow(id)
      router.push('/dashboard/runtics/flows')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  if (!flow) return <div className="text-sm text-slate-500">Flow no encontrado.</div>

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/runtics/flows"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-3 h-3" /> Volver a flows
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{flow.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              <code className="bg-slate-100 px-1.5 py-0.5 rounded">{flow.id}</code> · {flow.status}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            title="Eliminar flow"
            className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {flash && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-sm text-emerald-800">{flash}</p>
        </div>
      )}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Edición</h2>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true) }}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDirty(true) }}
            rows={2}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">DSL (JSON)</label>
            <span className="text-[10px] text-slate-400">
              Editor visual con drag-and-drop próximamente
            </span>
          </div>
          <textarea
            value={dslText}
            onChange={(e) => { setDslText(e.target.value); setDirty(true) }}
            rows={14}
            spellCheck={false}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Formato: <code>{`{ "nodes": [{ "id": "step1", "agent": "project-manager", "args_template": { "note": "{{input.note}}" } }] }`}</code>
          </p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Últimas corridas</h2>
        </div>
        {runs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Sin corridas todavía.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {runs.map((r) => (
              <div key={r.id} className="px-5 py-3 text-sm flex items-center justify-between">
                <div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ring-1 ${statusColor(r.status as 'completed' | 'running' | 'queued' | 'failed' | 'killed_budget')}`}
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">{r.trigger_source}</span>
                  {r.error_message && (
                    <p className="text-xs text-red-600 mt-1">{r.error_message}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{formatRelative(r.started_at)}</p>
                  {r.duration_ms !== null && (
                    <p className="text-[10px] text-slate-400">{r.duration_ms}ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
