"use client"

import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n'
import { API_BASE } from '@/lib/api'
import type { Template } from './types'

interface Props {
  storeId: string
  onClose: () => void
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function statusBadge(s: string): string {
  switch (s) {
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800'
    case 'PENDING':
      return 'bg-amber-100 text-amber-800'
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800'
    case 'PAUSED':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export function TemplateList({ storeId, onClose }: Props) {
  const { t } = useI18n()
  const [templates, setTemplates] = useState<Template[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(
          `${API_BASE}/api/channels/whatsapp/templates?storeId=${encodeURIComponent(storeId)}`,
          { headers: { ...authHeaders() } },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { templates: Template[] }
        if (!cancelled) setTemplates(data.templates)
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [storeId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('settingsChannels.templatesTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-rose-600">
            {t('settingsChannels.templatesError')}
          </p>
        )}
        {!loading && !error && templates && templates.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">
            {t('settingsChannels.templatesEmpty')}
          </p>
        )}
        {!loading && !error && templates && templates.length > 0 && (
          <ul className="space-y-2">
            {templates.map((tpl) => (
              <li
                key={`${tpl.name}-${tpl.language}`}
                className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{tpl.name}</p>
                  <p className="text-xs text-slate-500">
                    {tpl.category} · {tpl.language}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusBadge(tpl.status)}`}>
                  {tpl.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
