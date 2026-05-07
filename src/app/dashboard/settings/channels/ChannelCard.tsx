"use client"

import { useI18n } from '@/i18n'
import type { Channel } from './types'

interface Props {
  channel: Channel
  onDisconnect: () => void
  onViewTemplates: () => void
  onRefreshQuality: () => void
}

function qualityColor(rating: string | undefined | null): string {
  switch (rating) {
    case 'GREEN':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'YELLOW':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'RED':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function statusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'active':
      return { label: 'Activo', cls: 'bg-emerald-100 text-emerald-800' }
    case 'error':
      return { label: 'Error', cls: 'bg-rose-100 text-rose-800' }
    case 'expired':
      return { label: 'Expirado', cls: 'bg-amber-100 text-amber-800' }
    case 'pending_oauth':
      return { label: 'Pendiente', cls: 'bg-slate-100 text-slate-700' }
    default:
      return { label: status, cls: 'bg-slate-100 text-slate-700' }
  }
}

export function ChannelCard({ channel, onDisconnect, onViewTemplates, onRefreshQuality }: Props) {
  const { t } = useI18n()
  const meta = channel.metadata ?? {}
  const sb = statusBadge(channel.status)
  const quality = meta.quality_rating ?? 'UNKNOWN'

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-3xl">💬</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">
                {channel.display_name || 'WhatsApp Business'}
              </h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${sb.cls}`}>
                {sb.label}
              </span>
            </div>
            {channel.external_phone_number && (
              <p className="text-xs text-slate-500 mt-0.5">
                {channel.external_phone_number}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded border ${qualityColor(quality)}`}
                title={t('settingsChannels.qualityHint')}
              >
                {t('settingsChannels.qualityLabel')}: {quality}
              </span>
              {meta.messaging_limit && (
                <span className="text-xs font-medium px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200">
                  {meta.messaging_limit}
                </span>
              )}
              {(meta.extra_phone_count ?? 0) > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
                  {t('settingsChannels.multiWabaWarn')}
                </span>
              )}
            </div>
            {channel.last_error_message && (
              <p className="text-xs text-rose-600 mt-2">
                {channel.last_error_message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onRefreshQuality}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          {t('settingsChannels.actionRefreshQuality')}
        </button>
        <button
          onClick={onViewTemplates}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          {t('settingsChannels.actionViewTemplates')}
        </button>
        <button
          onClick={onDisconnect}
          className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          {t('settingsChannels.actionDisconnect')}
        </button>
      </div>
    </div>
  )
}
