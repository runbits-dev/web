"use client"

import { useState, type FormEvent } from 'react'
import { useI18n } from '@/i18n'
import { Loader2, X } from 'lucide-react'
import type { PaymentMethod } from './types'

type Props = {
  initial: PaymentMethod | null
  onClose: () => void
  onSave: (config: { instructions?: string }) => Promise<void>
}

export function CashConfigModal({ initial, onClose, onSave }: Props) {
  const { t } = useI18n()
  const initialConfig = (initial?.config ?? {}) as { instructions?: string }
  const [instructions, setInstructions] = useState(initialConfig.instructions ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSave({
        instructions: instructions.trim() || undefined,
      })
    } catch (e) {
      setError((e as Error)?.message || t('settingsPayments.cash.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
          aria-label={t('settingsPayments.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden>💵</span>
          <h3 className="font-semibold text-slate-900">
            {initial
              ? t('settingsPayments.cash.titleEdit')
              : t('settingsPayments.cash.titleNew')}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {t('settingsPayments.cash.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              {t('settingsPayments.cash.instructionsLabel')}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('settingsPayments.cash.instructionsPlaceholder')}
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('settingsPayments.cash.instructionsHelp')}
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50"
            >
              {t('settingsPayments.cancel')}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? t('settingsPayments.save') : t('settingsPayments.activate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
