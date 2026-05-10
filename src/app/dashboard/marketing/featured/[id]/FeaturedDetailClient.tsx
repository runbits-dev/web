"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { ChevronLeft, Eye, MousePointerClick, DollarSign, CalendarClock, Sparkles, AlertCircle } from 'lucide-react'

type Slot = {
  id: string
  item_id: string
  item_name?: string
  placement: string
  placement_value?: string | null
  status: string
  starts_at: number
  ends_at: number
  duration_days: number
  cost_cents: number
  currency: string
  checkout_url?: string | null
  impressions_total: number
  clicks_total: number
  ctr: number
}

type DailyMetric = { date_yyyymmdd: number; impressions: number; clicks: number }

function formatMoney(cents: number, currency = 'USD'): string {
  return `${currency} ${(cents / 100).toFixed(2)}`
}

function daysBetween(now: number, end: number): number {
  if (end <= now) return 0
  return Math.ceil((end - now) / 86400)
}

function parseYyyymmdd(n: number): Date {
  const s = String(n)
  const y = parseInt(s.slice(0, 4), 10)
  const m = parseInt(s.slice(4, 6), 10) - 1
  const d = parseInt(s.slice(6, 8), 10)
  return new Date(y, m, d)
}

export default function FeaturedDetailClient() {
  const params = useParams<{ id: string }>()
  const id = params?.id ? decodeURIComponent(params.id) : ''
  const router = useRouter()
  const { t, locale } = useI18n()
  const { toast } = useToast()

  const [slot, setSlot] = useState<Slot | null>(null)
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [extendOpen, setExtendOpen] = useState(false)
  const [extendDays, setExtendDays] = useState(7)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!id || id === 'placeholder') {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [s, m] = await Promise.all([
        api.getFeatured(id),
        api.getFeaturedMetrics(id).catch(() => ({ data: [] })),
      ])
      setSlot(s as any)
      setMetrics(Array.isArray((m as any)?.data) ? (m as any).data : [])
    } catch (e) {
      setError((e as Error)?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id])

  const now = Math.floor(Date.now() / 1000)
  const remaining = slot ? daysBetween(now, slot.ends_at) : 0

  const chartMax = useMemo(() => {
    let max = 0
    for (const m of metrics) {
      if (m.impressions > max) max = m.impressions
      if (m.clicks > max) max = m.clicks
    }
    return max
  }, [metrics])

  async function doCancel() {
    if (!slot) return
    setBusy(true)
    try {
      await api.cancelFeatured(slot.id)
      toast(t('marketing.featured.status.cancelled'), 'success')
      setCancelOpen(false)
      await load()
    } catch (e) {
      toast((e as Error)?.message || 'Error', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function doExtend() {
    if (!slot) return
    setBusy(true)
    try {
      const res = await api.extendFeatured(slot.id, extendDays)
      if (res?.checkout_url) {
        window.location.href = res.checkout_url
      } else {
        toast('OK', 'success')
        setExtendOpen(false)
        await load()
      }
    } catch (e) {
      toast((e as Error)?.message || 'Error', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (id === 'placeholder' || !id) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 text-sm">
        Loading…
      </div>
    )
  }

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />
  }

  if (error || !slot) {
    return (
      <div>
        <Link href="/dashboard/marketing/featured" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4">
          <ChevronLeft className="w-4 h-4" /> {t('marketing.featured.detail.back')}
        </Link>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 text-sm">
          {error || 'Not found'}
        </div>
      </div>
    )
  }

  const ctr = slot.ctr ? (slot.ctr * 100).toFixed(2) + '%' : '—'

  return (
    <div>
      <Link href="/dashboard/marketing/featured" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> {t('marketing.featured.detail.back')}
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            {slot.item_name || slot.item_id.slice(0, 8)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t(`marketing.featured.placement.${slot.placement}.title`)}
            {slot.placement_value ? ` · ${slot.placement_value}` : ''}
          </p>
        </div>
        <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium border ${
          slot.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          slot.status === 'pending_payment' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          slot.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {t(`marketing.featured.status.${slot.status}`)}
        </span>
      </div>

      {slot.status === 'pending_payment' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{t('marketing.featured.detail.paymentPending.title')}</p>
              <p className="text-xs text-amber-700 mt-1">{t('marketing.featured.detail.paymentPending.body')}</p>
            </div>
          </div>
          {slot.checkout_url && (
            <a
              href={slot.checkout_url}
              className="bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-amber-700 whitespace-nowrap"
            >
              {t('marketing.featured.detail.paymentPending.retry')}
            </a>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-xs">{t('marketing.featured.detail.metrics.impressions')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{(slot.impressions_total ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <MousePointerClick className="w-4 h-4" />
            <span className="text-xs">{t('marketing.featured.detail.metrics.clicks')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{(slot.clicks_total ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <span className="text-xs text-slate-400">{t('marketing.featured.detail.metrics.ctr')}</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{ctr}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">{t('marketing.featured.detail.metrics.cost')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatMoney(slot.cost_cents, slot.currency)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <CalendarClock className="w-4 h-4" />
            <span className="text-xs">{t('marketing.featured.detail.metrics.remaining')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {slot.status === 'expired' || slot.status === 'cancelled'
              ? t('marketing.featured.detail.metrics.remainingExpired')
              : `${remaining}d`}
          </p>
        </div>
      </div>

      {/* Daily chart (lightweight inline bars) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">{t('marketing.featured.detail.chartTitle')}</h2>
        {metrics.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('marketing.featured.detail.chartEmpty')}</p>
        ) : (
          <div className="flex items-end gap-1 h-40 overflow-x-auto">
            {metrics.map(m => {
              const date = parseYyyymmdd(m.date_yyyymmdd)
              const impH = chartMax > 0 ? (m.impressions / chartMax) * 100 : 0
              const clickH = chartMax > 0 ? (m.clicks / chartMax) * 100 : 0
              return (
                <div key={m.date_yyyymmdd} className="flex flex-col items-center gap-1 min-w-[28px]" title={`Imp: ${m.impressions}, Clicks: ${m.clicks}`}>
                  <div className="flex items-end gap-0.5 h-32">
                    <div className="w-3 bg-slate-300 rounded-t" style={{ height: `${impH}%` }} />
                    <div className="w-3 bg-blue-500 rounded-t" style={{ height: `${clickH}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {date.toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-300 inline-block rounded" /> Impresiones</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 inline-block rounded" /> Clicks</span>
        </div>
      </div>

      {/* Actions */}
      {(slot.status === 'active' || slot.status === 'pending_payment') && (
        <div className="flex flex-wrap gap-3">
          {slot.status === 'active' && (
            <button
              onClick={() => setExtendOpen(true)}
              className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700"
            >
              {t('marketing.featured.actions.extend')}
            </button>
          )}
          <button
            onClick={() => setCancelOpen(true)}
            className="bg-white border border-rose-200 text-rose-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-rose-50"
          >
            {t('marketing.featured.actions.cancel')}
          </button>
        </div>
      )}

      {/* Extend modal */}
      {extendOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('marketing.featured.detail.extendModal.title')}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('marketing.featured.detail.extendModal.body')}</p>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">
              {t('marketing.featured.detail.extendModal.days')}: <span className="text-slate-900 font-bold">{extendDays}</span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={extendDays}
              onChange={e => setExtendDays(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 mb-4"
            />
            <p className="text-xs text-slate-500 mb-1">{t('marketing.featured.detail.extendModal.extraCost')}:</p>
            <p className="text-2xl font-bold text-slate-900 mb-5">
              {formatMoney(Math.round((slot.cost_cents / slot.duration_days) * extendDays), slot.currency)}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setExtendOpen(false)} className="text-sm text-slate-500 px-4 py-2">
                {t('marketing.featured.purchase.back')}
              </button>
              <button
                onClick={doExtend}
                disabled={busy}
                className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 disabled:bg-slate-300"
              >
                {t('marketing.featured.detail.extendModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('marketing.featured.detail.cancelModal.title')}</h3>
            <p className="text-sm text-slate-500 mb-5">
              {now < slot.starts_at
                ? t('marketing.featured.detail.cancelModal.bodyBeforeStart')
                : t('marketing.featured.detail.cancelModal.bodyAfterStart')}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCancelOpen(false)} className="text-sm text-slate-500 px-4 py-2">
                {t('marketing.featured.purchase.back')}
              </button>
              <button
                onClick={doCancel}
                disabled={busy}
                className="bg-rose-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-rose-700 disabled:bg-rose-300"
              >
                {t('marketing.featured.detail.cancelModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
