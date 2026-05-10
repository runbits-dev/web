"use client"

import { useState } from 'react'
import { useI18n } from '@/i18n'
import { Loader2, Lock, ArrowRight } from 'lucide-react'
import type { ProviderInfo } from './types'

type Props = {
  info: ProviderInfo
  unlocked: boolean
  busy: boolean
  onConnect: () => void
}

export function ConnectableCard({ info, unlocked, busy, onConnect }: Props) {
  const { t } = useI18n()
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const ctaLabel = info.oauth
    ? t('settingsPayments.connect')
    : info.id === 'cash'
      ? t('settingsPayments.activate')
      : t('settingsPayments.configure')

  return (
    <div
      className={`bg-white border rounded-2xl p-4 flex items-center justify-between gap-4 ${
        unlocked ? 'border-slate-200' : 'border-slate-200/70 bg-slate-50/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`text-2xl leading-none shrink-0 ${unlocked ? '' : 'grayscale opacity-60'}`}
          aria-hidden
        >
          {info.logo}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {info.name}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {info.oauth
              ? t('settingsPayments.oauthHint')
              : info.id === 'transfer'
                ? t('settingsPayments.transferHint')
                : t('settingsPayments.cashHint')}
          </p>
        </div>
      </div>

      <div className="shrink-0 relative">
        {unlocked ? (
          <button
            onClick={onConnect}
            disabled={busy}
            className="text-xs font-semibold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {busy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ArrowRight className="w-3 h-3" />
            )}
            {ctaLabel}
          </button>
        ) : (
          <button
            type="button"
            disabled
            onMouseEnter={() => setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
            onFocus={() => setTooltipOpen(true)}
            onBlur={() => setTooltipOpen(false)}
            className="text-xs font-semibold bg-slate-100 text-slate-400 px-3 py-2 rounded-lg cursor-not-allowed inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Lock className="w-3 h-3" />
            {ctaLabel}
            {tooltipOpen && (
              <span
                role="tooltip"
                className="absolute right-0 top-full mt-1 z-10 whitespace-nowrap text-[11px] font-medium bg-slate-900 text-white px-2 py-1 rounded-lg shadow-lg"
              >
                {t('settingsPayments.requiresStarter')}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
