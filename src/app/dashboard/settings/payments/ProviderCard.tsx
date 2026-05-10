"use client"

import { useState } from 'react'
import { useI18n } from '@/i18n'
import { Check, Loader2, Star, Trash2, Pencil } from 'lucide-react'
import type { PaymentMethod, ProviderInfo } from './types'

type Props = {
  info: ProviderInfo
  method: PaymentMethod
  onSetDefault: () => Promise<void>
  onDisconnect: () => Promise<void>
  onEdit?: () => void
}

export function ProviderCard({
  info,
  method,
  onSetDefault,
  onDisconnect,
  onEdit,
}: Props) {
  const { t } = useI18n()
  const [busyAction, setBusyAction] = useState<'default' | 'disconnect' | null>(null)

  const status = (method.status ?? 'unknown').toLowerCase()
  const isActive = status === 'active'
  const isPending = status === 'pending_oauth'
  const isError = status === 'error'

  const statusClasses = isActive
    ? 'bg-emerald-100 text-emerald-700'
    : isPending
      ? 'bg-amber-100 text-amber-700'
      : isError
        ? 'bg-red-100 text-red-700'
        : 'bg-slate-100 text-slate-600'

  const statusLabel = isActive
    ? t('settingsPayments.statusActive')
    : isPending
      ? t('settingsPayments.statusPending')
      : isError
        ? t('settingsPayments.statusError')
        : t('settingsPayments.statusUnknown')

  // Build a one-line account hint: prefer account_label, then config-derived text.
  let detail: string | null = null
  if (method.account_label) {
    detail = method.account_label
  } else if (info.id === 'transfer' && method.config) {
    const cfg = method.config as { cbu?: string; alias?: string; holder_name?: string }
    if (cfg.cbu) {
      const masked = cfg.cbu.length > 8
        ? `${cfg.cbu.slice(0, 4)}…${cfg.cbu.slice(-4)}`
        : cfg.cbu
      detail = `CBU ${masked}${cfg.alias ? ` · ${cfg.alias}` : ''}`
    } else if (cfg.alias) {
      detail = cfg.alias
    }
  }

  async function handleSetDefault() {
    setBusyAction('default')
    try {
      await onSetDefault()
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDisconnect() {
    setBusyAction('disconnect')
    try {
      await onDisconnect()
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: identity */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="text-2xl leading-none shrink-0" aria-hidden>
            {info.logo}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {info.name}
              </p>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClasses}`}
              >
                {statusLabel}
              </span>
              {method.is_default && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" />
                  {t('settingsPayments.defaultBadge')}
                </span>
              )}
            </div>
            {detail && (
              <p className="text-xs text-slate-500 mt-1 truncate">{detail}</p>
            )}
            {isPending && (
              <p className="text-xs text-amber-700 mt-1">
                {t('settingsPayments.pendingDescription')}
              </p>
            )}
            {isError && (
              <p className="text-xs text-red-700 mt-1">
                {t('settingsPayments.errorDescription')}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!method.is_default && isActive && (
            <button
              onClick={handleSetDefault}
              disabled={busyAction !== null}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {busyAction === 'default' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              {t('settingsPayments.setDefault')}
            </button>
          )}
          {onEdit && !info.oauth && (
            <button
              onClick={onEdit}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 inline-flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" />
              {t('settingsPayments.edit')}
            </button>
          )}
          <button
            onClick={handleDisconnect}
            disabled={busyAction !== null}
            className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1"
          >
            {busyAction === 'disconnect' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            {t('settingsPayments.disconnect')}
          </button>
        </div>
      </div>
    </div>
  )
}
