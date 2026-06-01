"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, X } from 'lucide-react'

import { qaApi } from '../_lib/api'
import type { QaScope } from '../_lib/types'

interface ValidateModalProps {
  open: boolean
  onClose: () => void
  /** Pre-fill the subject (e.g. when re-running). */
  initialSubject?: string
  initialScope?: QaScope
}

export function ValidateModal({
  open,
  onClose,
  initialSubject = '',
  initialScope = 'shallow',
}: ValidateModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [subject, setSubject] = useState(initialSubject)
  const [scope, setScope] = useState<QaScope>(initialScope)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSubject(initialSubject)
      setScope(initialScope)
      setError(null)
      setSubmitting(false)
      // focus the subject input on next tick
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open, initialSubject, initialScope])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { run_id } = await qaApi.validate(subject.trim(), scope)
      onClose()
      router.push(`/dashboard/admin/qa/run?id=${encodeURIComponent(run_id)}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
      onClick={() => { if (!submitting) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Nueva validación QA</h2>
              <p className="text-[11px] text-slate-500">runtics-qa dispara los 5 checks contra el subject</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label htmlFor="qa-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subject
            </label>
            <input
              id="qa-subject"
              ref={inputRef}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="runbits-billing, commit SHA, o --all"
              disabled={submitting}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition disabled:bg-slate-50"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Worker, commit, o <span className="font-mono">--all</span> para validar todo el stack.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {(['shallow', 'full'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  disabled={submitting}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ring-1 transition ${
                    scope === s
                      ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                      : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  <span className="block">{s}</span>
                  <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                    {s === 'shallow' ? 'checks rápidos' : 'incluye smoke-e2e'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !subject.trim()}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitting ? 'Disparando…' : 'Validar'}
          </button>
        </div>
      </form>
    </div>
  )
}
