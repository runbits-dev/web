"use client"

import { useState } from 'react'
import { useI18n } from '@/i18n'
import { ExternalLink, Loader2, Trash2, RefreshCw, Star } from 'lucide-react'
import type { Domain } from './page'

type Props = {
  domain: Domain
  onVerify?: (id: string) => Promise<unknown>
  onDisconnect?: (id: string) => Promise<unknown>
  onMakePrimary?: (id: string) => Promise<unknown>
  showMakePrimary?: boolean
}

export function DomainCard({
  domain,
  onVerify,
  onDisconnect,
  onMakePrimary,
  showMakePrimary = false,
}: Props) {
  const { t } = useI18n()
  const [verifying, setVerifying] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [makingPrimary, setMakingPrimary] = useState(false)

  const status = (domain.status ?? 'unknown').toLowerCase()
  const isActive = status === 'active'
  const isPending = status === 'pending'
  const isFailed = status === 'failed'

  const statusClasses = isActive
    ? 'bg-emerald-100 text-emerald-700'
    : isPending
      ? 'bg-amber-100 text-amber-800'
      : isFailed
        ? 'bg-red-100 text-red-700'
        : 'bg-slate-100 text-slate-600'

  const statusLabel = isActive
    ? t('settingsDomain.statusActive')
    : isPending
      ? t('settingsDomain.statusPending')
      : isFailed
        ? t('settingsDomain.statusFailed')
        : t('settingsDomain.statusUnknown')

  const url = `https://${domain.hostname}`

  async function handleVerify() {
    if (!onVerify) return
    setVerifying(true)
    try {
      await onVerify(domain.id)
    } finally {
      setVerifying(false)
    }
  }

  async function handleDisconnect() {
    if (!onDisconnect) return
    if (!window.confirm(t('settingsDomain.disconnectConfirm'))) return
    setDisconnecting(true)
    try {
      await onDisconnect(domain.id)
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleMakePrimary() {
    if (!onMakePrimary) return
    setMakingPrimary(true)
    try {
      await onMakePrimary(domain.id)
    } finally {
      setMakingPrimary(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {domain.hostname}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusClasses}`}
            >
              {statusLabel}
            </span>
            {domain.is_primary && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {t('settingsDomain.primaryBadge')}
              </span>
            )}
          </div>
          {isActive && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {t('settingsDomain.visit')} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {showMakePrimary && !domain.is_primary && isActive && onMakePrimary && (
            <button
              onClick={handleMakePrimary}
              disabled={makingPrimary}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {makingPrimary ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Star className="w-3 h-3" />
              )}
              {t('settingsDomain.multiDomain.makePrimary')}
            </button>
          )}

          {onVerify && (isPending || isFailed) && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />{' '}
                  {t('settingsDomain.verifying')}
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" /> {t('settingsDomain.verifyNow')}
                </>
              )}
            </button>
          )}

          {onDisconnect && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {disconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              {t('settingsDomain.disconnect')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
