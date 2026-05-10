"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, API_BASE } from '@/lib/api'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { useProfile } from '@/context/ProfileContext'
import { ChevronLeft, ChevronRight, Search, Sparkles, Home, Tag, Compass, AlertCircle, CheckCircle2 } from 'lucide-react'

type Item = { id: string; name: string; price: number; image_key?: string | null; category_slug?: string | null; categories?: Array<{ slug: string; name: string }> }
type Pricing = { placement: string; cost_per_day_cents: number; currency: string; min_days: number; max_days: number; description?: string }
type Quote = { placement: string; cost_cents: number; currency: string; starts_at: number; ends_at: number; duration_days: number; available: boolean; competing_slots: number }

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatMoney(cents: number, currency = 'USD'): string {
  return `${currency} ${(cents / 100).toFixed(2)}`
}

const placementIcons: Record<string, any> = {
  home_top: Home,
  category_top: Tag,
  search_promoted: Compass,
}

export default function NewFeaturedPage() {
  const { t, locale } = useI18n()
  const { toast } = useToast()
  const router = useRouter()
  const { activeProfile } = useProfile()
  const storeId = activeProfile?.store_id ?? null

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: item
  const [items, setItems] = useState<Item[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  // Step 2: placement
  const [pricing, setPricing] = useState<Pricing[]>([])
  const [placement, setPlacement] = useState<string>('')
  const [placementValue, setPlacementValue] = useState<string>('')

  // Step 3: duration
  const [days, setDays] = useState(7)
  const [startsAt, setStartsAt] = useState<string>('') // empty = today
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoting, setQuoting] = useState(false)

  // Step 4: payment provider connectivity
  const [hasPaymentProvider, setHasPaymentProvider] = useState<boolean | null>(null)
  const [creating, setCreating] = useState(false)

  // ── Initial loads ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!storeId) return
    setLoadingItems(true)
    api.getItems({ storeId, status: 'active', limit: 100 })
      .then(res => setItems(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false))
  }, [storeId])

  useEffect(() => {
    api.getFeaturedPricing()
      .then(r => setPricing(Array.isArray(r?.placements) ? r.placements : []))
      .catch(() => setPricing([]))
  }, [])

  // Check payment provider status when reaching step 4.
  useEffect(() => {
    if (step !== 4 || !storeId) return
    let abort = false
    fetch(`${API_BASE}/api/payments/methods?storeId=${storeId}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then((res: any) => {
        if (abort) return
        const list: any[] = Array.isArray(res) ? res : (res?.methods ?? [])
        // Accept any connected/active method as valid for paying.
        const hasActive = list.some((m: any) => m?.status === 'active' || m?.status === 'connected' || m?.is_default)
        setHasPaymentProvider(hasActive)
      })
      .catch(() => { if (!abort) setHasPaymentProvider(false) })
    return () => { abort = true }
  }, [step, storeId])

  // ── Step 3 quote (debounced) ──────────────────────────────────────────────
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (step !== 3 || !selectedItem || !placement) return
    setQuoting(true)
    if (quoteTimer.current) clearTimeout(quoteTimer.current)
    quoteTimer.current = setTimeout(async () => {
      try {
        const startsEpoch = startsAt ? Math.floor(new Date(startsAt).getTime() / 1000) : undefined
        const q = await api.quoteFeatured({
          item_id: selectedItem.id,
          placement,
          placement_value: placementValue || undefined,
          duration_days: days,
          starts_at: startsEpoch,
        })
        setQuote(q)
      } catch {
        setQuote(null)
      } finally {
        setQuoting(false)
      }
    }, 300)
    return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current) }
  }, [step, selectedItem?.id, placement, placementValue, days, startsAt])

  // ── Filtered items ────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(i => (i.name || '').toLowerCase().includes(q))
  }, [items, search])

  // ── Computed ──────────────────────────────────────────────────────────────
  const placementInfo = pricing.find(p => p.placement === placement) || null
  const itemCategories: Array<{ slug: string; name: string }> = (selectedItem?.categories as any) || []

  const canNext = (() => {
    if (step === 1) return !!selectedItem
    if (step === 2) {
      if (!placement) return false
      if (placement === 'category_top' && !placementValue) return false
      return true
    }
    if (step === 3) return !!quote && quote.available
    return false
  })()

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!selectedItem || !placement || !quote) return
    if (hasPaymentProvider === false) {
      router.push('/dashboard/settings/payments')
      return
    }
    setCreating(true)
    try {
      const startsEpoch = startsAt ? Math.floor(new Date(startsAt).getTime() / 1000) : undefined
      const idempotencyKey = `featured-${selectedItem.id}-${placement}-${placementValue || ''}-${days}-${startsEpoch || 'now'}`
      const res = await api.createFeatured({
        item_id: selectedItem.id,
        placement,
        placement_value: placementValue || undefined,
        duration_days: days,
        starts_at: startsEpoch,
        idempotencyKey,
      })
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      } else {
        // No checkout_url returned (e.g. zero-cost or already active) → straight to detail.
        router.push(`/dashboard/marketing/featured/${res.id}`)
      }
    } catch (e) {
      toast((e as Error)?.message || t('marketing.featured.purchase.step4.errorGeneric'), 'error')
      setCreating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/marketing/featured" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> {t('marketing.featured.detail.back')}
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          {t('marketing.featured.purchase.title')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('marketing.featured.purchase.subtitle')}</p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-8 text-xs">
        {([1, 2, 3, 4] as const).map((n) => {
          const labels = ['item', 'placement', 'duration', 'payment'] as const
          const active = step === n
          const done = step > n
          return (
            <li key={n} className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-7 h-7 rounded-full font-semibold ${
                active ? 'bg-slate-900 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {done ? '✓' : n}
              </span>
              <span className={`hidden sm:inline ${active ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                {t(`marketing.featured.purchase.step.${labels[n - 1]}`)}
              </span>
              {n < 4 && <ChevronRight className="w-3 h-3 text-slate-300 mx-1" />}
            </li>
          )
        })}
      </ol>

      {/* ── Step 1: item ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('marketing.featured.purchase.step1.title')}</h2>
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('marketing.featured.purchase.step1.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          {loadingItems ? (
            <p className="text-sm text-slate-400 text-center py-8">{t('marketing.featured.purchase.step1.loading')}</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t('marketing.featured.purchase.step1.noItems')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto">
              {filteredItems.map(it => {
                const selected = selectedItem?.id === it.id
                return (
                  <button
                    key={it.id}
                    onClick={() => setSelectedItem(it)}
                    className={`text-left rounded-xl border-2 p-3 transition-all ${
                      selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      {it.image_key ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${API_BASE}/api/images/${it.image_key}`} alt={it.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-300 text-xs">sin imagen</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{it.name}</p>
                    <p className="text-xs text-slate-500">${(it.price ?? 0).toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: placement ────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('marketing.featured.purchase.step2.title')}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {pricing.map(p => {
              const Icon = placementIcons[p.placement] || Sparkles
              const selected = placement === p.placement
              return (
                <button
                  key={p.placement}
                  onClick={() => { setPlacement(p.placement); if (p.placement !== 'category_top') setPlacementValue('') }}
                  className={`text-left rounded-2xl border-2 p-5 transition-all ${
                    selected ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-7 h-7 mb-3 ${selected ? 'text-slate-900' : 'text-slate-400'}`} />
                  <p className="font-semibold text-slate-900">{t(`marketing.featured.placement.${p.placement}.title`)}</p>
                  <p className="text-xs text-slate-500 mt-1">{t(`marketing.featured.placement.${p.placement}.description`)}</p>
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    {formatMoney(p.cost_per_day_cents, p.currency)}<span className="text-slate-400 text-xs"> /{t('marketing.featured.purchase.step3.daysUnit')}</span>
                  </p>
                </button>
              )
            })}
          </div>

          {placement === 'category_top' && (
            <div className="mt-5">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('marketing.featured.purchase.step2.category')}</label>
              <select
                value={placementValue}
                onChange={e => setPlacementValue(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {itemCategories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">{t('marketing.featured.purchase.step2.categoryHelp')}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: duration ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('marketing.featured.purchase.step3.title')}</h2>

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                {t('marketing.featured.purchase.step3.days')}: <span className="text-slate-900 font-bold">{days}</span> {t('marketing.featured.purchase.step3.daysUnit')}
              </label>
              <input
                type="range"
                min={placementInfo?.min_days ?? 1}
                max={placementInfo?.max_days ?? 30}
                value={days}
                onChange={e => setDays(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{placementInfo?.min_days ?? 1}</span>
                <span>{placementInfo?.max_days ?? 30}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('marketing.featured.purchase.step3.starts')}</label>
              <input
                type="date"
                value={startsAt}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setStartsAt(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">{t('marketing.featured.purchase.step3.startsHelp')}</p>
            </div>
          </div>

          {/* Live quote */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            {quoting ? (
              <p className="text-sm text-slate-500">{t('marketing.featured.purchase.step3.calculating')}</p>
            ) : !quote ? (
              <p className="text-sm text-slate-500">{t('marketing.featured.purchase.step3.calculating')}</p>
            ) : !quote.available ? (
              <div className="flex items-start gap-2 text-amber-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{t('marketing.featured.purchase.step3.unavailable')}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">{t('marketing.featured.purchase.step3.quoteCost')}</p>
                  <p className="text-2xl font-bold text-slate-900">{formatMoney(quote.cost_cents, quote.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t('marketing.featured.purchase.step3.quoteEnds')}</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(quote.ends_at * 1000).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t('marketing.featured.table.placement')}</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {t(`marketing.featured.placement.${quote.placement}.title`)}
                  </p>
                </div>
                {quote.competing_slots > 0 && (
                  <p className="text-xs text-slate-500 sm:col-span-3">
                    {t('marketing.featured.purchase.step3.competing').replace('{n}', String(quote.competing_slots))}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: payment ──────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('marketing.featured.purchase.step4.title')}</h2>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 mb-5">
            <p className="text-xs text-slate-500 mb-3">{t('marketing.featured.purchase.step4.summary')}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('marketing.featured.table.item')}</dt>
                <dd className="text-slate-900 font-medium">{selectedItem?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('marketing.featured.table.placement')}</dt>
                <dd className="text-slate-900 font-medium">{placement && t(`marketing.featured.placement.${placement}.title`)}{placementValue ? ` · ${placementValue}` : ''}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('marketing.featured.purchase.step3.days')}</dt>
                <dd className="text-slate-900 font-medium">{days} {t('marketing.featured.purchase.step3.daysUnit')}</dd>
              </div>
              {quote && (
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <dt className="text-slate-700 font-semibold">{t('marketing.featured.purchase.step3.quoteCost')}</dt>
                  <dd className="text-slate-900 font-bold text-lg">{formatMoney(quote.cost_cents, quote.currency)}</dd>
                </div>
              )}
            </dl>
          </div>

          {hasPaymentProvider === false && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-semibold">{t('marketing.featured.purchase.step4.noProvider')}</p>
                <Link href="/dashboard/settings/payments" className="inline-block mt-2 text-xs font-semibold text-amber-900 underline">
                  {t('marketing.featured.purchase.step4.noProviderCta')}
                </Link>
              </div>
            </div>
          )}

          {hasPaymentProvider === true && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 mb-5 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Método de pago conectado
            </div>
          )}

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 mb-5 text-xs text-blue-700">
            <p className="font-semibold">{t('marketing.featured.refundPolicy.title')}</p>
            <p>{t('marketing.featured.refundPolicy.body')}</p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep(s => (s > 1 ? ((s - 1) as any) : 1))}
          disabled={step === 1 || creating}
          className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30 inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> {t('marketing.featured.purchase.back')}
        </button>
        {step < 4 ? (
          <button
            onClick={() => canNext && setStep(s => ((s + 1) as any))}
            disabled={!canNext}
            className="bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            {t('marketing.featured.purchase.next')} <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={creating || !quote || hasPaymentProvider === false}
            className="bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {creating
              ? t('marketing.featured.purchase.step4.redirecting')
              : t('marketing.featured.purchase.payNow').replace('{amount}', quote ? formatMoney(quote.cost_cents, quote.currency) : '')}
          </button>
        )}
      </div>
    </div>
  )
}
