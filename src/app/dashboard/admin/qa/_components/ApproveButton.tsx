"use client"

import { useState } from 'react'
import { Check, Loader2, ShieldCheck } from 'lucide-react'

import { qaApi } from '../_lib/api'

interface ApproveButtonProps {
  runId: string
  /** Called after a successful approval so the parent can re-fetch the run. */
  onApproved?: () => void
}

export function ApproveButton({ runId, onApproved }: ApproveButtonProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleApprove() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await qaApi.approve(runId)
      setSuccess(true)
      onApproved?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-900">Run lista para aprobar</p>
          <p className="text-xs text-emerald-700/80 mt-0.5">
            Todos los checks pasaron. Aprobá para marcar este run como reviewed.
          </p>
          {error && (
            <p className="text-xs text-red-700 mt-2 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleApprove}
          disabled={submitting || success}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {!submitting && success && <Check className="w-3.5 h-3.5" />}
          {submitting ? 'Aprobando…' : success ? 'Aprobado' : 'Approve'}
        </button>
      </div>
    </div>
  )
}
