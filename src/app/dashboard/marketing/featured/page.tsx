"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { Megaphone, Eye, MousePointerClick, Plus, Sparkles } from 'lucide-react'

type Slot = {
  id: string
  item_id: string
  item_name?: string
  item_image_key?: string | null
  placement: string
  placement_value?: string | null
  status: string
  starts_at: number
  ends_at: number
  duration_days: number
  cost_cents: number
  currency: string
  impressions_total: number
  clicks_total: number
  ctr: number
  checkout_url?: string | null
}

type StatusFilter = 'all' | 'active' | 'pending_payment' | 'expired' | 'cancelled'

function formatMoney(cents: number, currency = 'USD'): string {
  const amount = (cents / 100).toFixed(2)
  return `${currency} ${amount}`
}

function formatDate(epochSeconds: number, locale: string): string {
  if (!epochSeconds) return '—'
  return new Date(epochSeconds * 1000).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
    day: '2-digit', month: 'short',
  })
}

export default function FeaturedListPage() {
  const { t, locale } = useI18n()
  const { toast } = useToast()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [cancelling, setCancelling] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await api.listMyFeatured({ status: status === 'all' ? undefined : status, limit: 50 })
      setSlots(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      toast((e as Error)?.message || 'Error', 'error')
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status])

  const filtered = useMemo(() => {
    if (status === 'all') return slots
    return slots.filter(s => s.status === status)
  }, [slots, status])

  async function cancelSlot(id: string) {
    if (!confirm(t('marketing.featured.detail.cancelModal.confirm') + '?')) return
    setCancelling(id)
    try {
      await api.cancelFeatured(id)
      toast(t('marketing.featured.status.cancelled'), 'success')
      await load()
    } catch (e) {
      toast((e as Error)?.message || 'Error', 'error')
    } finally {
      setCancelling(null)
    }
  }

  const statusPill: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-slate-100 text-slate-500 border-slate-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  const placementLabel = (p: string): string => t(`marketing.featured.placement.${p}.title`)

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            {t('marketing.featured.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('marketing.featured.subtitle')}</p>
        </div>
        <Link
          href="/dashboard/marketing/featured/new"
          className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('marketing.featured.newCta')}
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          ['all', t('marketing.featured.tabAll')],
          ['active', t('marketing.featured.tabActive')],
          ['pending_payment', t('marketing.featured.tabPending')],
          ['expired', t('marketing.featured.tabExpired')],
          ['cancelled', t('marketing.featured.tabCancelled')],
        ] as Array<[StatusFilter, string]>).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setStatus(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              status === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 text-sm">
          {t('marketing.featured.purchase.step1.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">{t('marketing.featured.empty.title')}</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">{t('marketing.featured.empty.body')}</p>
          <Link
            href="/dashboard/marketing/featured/new"
            className="inline-flex items-center gap-2 mt-6 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700"
          >
            <Plus className="w-4 h-4" /> {t('marketing.featured.newCta')}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">{t('marketing.featured.table.item')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('marketing.featured.table.placement')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('marketing.featured.table.status')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('marketing.featured.table.schedule')}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t('marketing.featured.table.cost')}</th>
                  <th className="text-right px-4 py-3 font-semibold"><Eye className="w-4 h-4 inline" /></th>
                  <th className="text-right px-4 py-3 font-semibold"><MousePointerClick className="w-4 h-4 inline" /></th>
                  <th className="text-right px-4 py-3 font-semibold">{t('marketing.featured.table.ctr')}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t('marketing.featured.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => {
                  const ctr = s.ctr ? (s.ctr * 100).toFixed(1) + '%' : '—'
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link href={`/dashboard/marketing/featured/${s.id}`} className="hover:underline">
                          {s.item_name || s.item_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{placementLabel(s.placement)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${statusPill[s.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {t(`marketing.featured.status.${s.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(s.starts_at, locale)} → {formatDate(s.ends_at, locale)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">{formatMoney(s.cost_cents, s.currency)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{(s.impressions_total ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{(s.clicks_total ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{ctr}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.status === 'pending_payment' && s.checkout_url && (
                            <a href={s.checkout_url} className="text-xs text-amber-700 hover:text-amber-900 font-medium">
                              {t('marketing.featured.actions.retryPayment')}
                            </a>
                          )}
                          <Link href={`/dashboard/marketing/featured/${s.id}`} className="text-xs text-slate-600 hover:text-slate-900 font-medium">
                            {t('marketing.featured.actions.view')}
                          </Link>
                          {(s.status === 'active' || s.status === 'pending_payment') && (
                            <button
                              onClick={() => cancelSlot(s.id)}
                              disabled={cancelling === s.id}
                              className="text-xs text-rose-500 hover:text-rose-700 font-medium disabled:opacity-50"
                            >
                              {cancelling === s.id ? '...' : t('marketing.featured.actions.cancel')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <p className="font-semibold mb-1">{t('marketing.featured.refundPolicy.title')}</p>
        <p>{t('marketing.featured.refundPolicy.body')}</p>
      </div>
    </div>
  )
}
