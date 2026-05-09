"use client"

/**
 * OnboardingHelpButton — floating button that asks the merchant-onboarding
 * agent for a contextual tip based on the current store state. The button is
 * hidden if the merchant has already completed onboarding (tutorial_completed)
 * or if the agent reports no tip is relevant.
 *
 * The tip is rendered as a small panel with:
 *   - headline (short hook)
 *   - body (2-4 sentences)
 *   - optional CTA button (linking to a whitelisted dashboard route)
 *
 * Output sanitization:
 *   - cta_href is whitelisted server-side against the playbook's hrefs
 *   - tip text is rendered as plain text (whitespace-pre-wrap, no HTML)
 *   - we still validate cta_href starts with `/dashboard/` before rendering
 *     as a link (defense in depth)
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sparkles, X, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { api } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

type Tip = {
  headline: string
  body: string
  next_step_id?: string | null
  cta_label?: string | null
  cta_href?: string | null
  tone?: 'encouraging' | 'neutral' | 'urgent'
}

type Metrics = {
  items_count?: number
  orders_count?: number
  has_payment_channel?: boolean
  has_whatsapp?: boolean
  is_open?: boolean
  profile_complete?: boolean
  days_since_signup?: number
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function isSafeAppHref(href: string | null | undefined): href is string {
  if (!href) return false
  // Defense-in-depth: only allow dashboard-internal hrefs. Server-side already
  // whitelists against the playbook, but we re-validate here so an attacker
  // who somehow bypassed that can't get a foreign URL rendered as a link.
  return typeof href === 'string' && href.startsWith('/dashboard/')
}

export function OnboardingHelpButton() {
  const { activeProfile } = useProfile()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tip, setTip] = useState<Tip | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)

  // Hide if the merchant has already completed onboarding, or in the absence
  // of an active profile.
  if (!activeProfile || activeProfile.tutorial_completed || hidden) return null

  async function loadMetrics(): Promise<{ metrics: Metrics; current_step: string | null }> {
    let metrics: Metrics = {}
    let current_step: string | null = null
    try {
      const me = await api.me().catch(() => null)
      const restaurantId = me?.restaurant_id
      if (restaurantId) {
        const [menuRes, statsRes, restRes, ordersRes] = await Promise.all([
          api.getMenu(restaurantId).catch(() => [] as unknown[]),
          api.getRestaurantStats(restaurantId).catch(() => ({} as Record<string, unknown>)),
          api.getRestaurant(restaurantId).catch(() => ({} as Record<string, unknown>)),
          api.getMyOrders().catch(() => [] as unknown[]),
        ])
        const menu = Array.isArray(menuRes) ? menuRes : []
        const orders = Array.isArray(ordersRes) ? ordersRes : []
        const stats = (statsRes ?? {}) as Record<string, unknown>
        const rest = (restRes ?? {}) as Record<string, unknown>
        metrics.items_count = menu.length
        metrics.orders_count = orders.length
        metrics.is_open = !!stats.is_open
        const hasPhone = !!rest.phone || !!me?.phone
        const hasAddress = !!rest.address
        metrics.profile_complete = hasPhone && hasAddress
        metrics.has_payment_channel = Array.isArray(rest.payment_methods) && (rest.payment_methods as unknown[]).length > 0
        // Identify the most actionable next step from the local checklist.
        if (!metrics.profile_complete) current_step = 'profile'
        else if ((metrics.items_count ?? 0) === 0) current_step = activeProfile?.business_type === 'food' ? 'menu' : 'catalog'
        else if (!metrics.has_payment_channel) current_step = 'payment'
        else if (!metrics.is_open) current_step = 'open'
        else if ((metrics.orders_count ?? 0) === 0) current_step = 'share'
      }
    } catch {
      /* ignore — pass minimal metrics */
    }
    return { metrics, current_step }
  }

  async function askForTip() {
    setOpen(true)
    setLoading(true)
    setError(null)
    setTip(null)
    try {
      const { metrics, current_step } = await loadMetrics()
      const token = getToken()
      const res = await fetch(`${API}/api/runtics/onboarding/help`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          current_step: current_step ?? undefined,
          business_type: activeProfile?.business_type,
          business_category: activeProfile?.business_category ?? undefined,
          metrics,
        }),
      })
      if (res.status === 429) {
        setError('Hiciste muchas consultas seguidas. Probá de nuevo en unos minutos.')
      } else if (!res.ok) {
        setError('No pude generar un tip ahora.')
      } else {
        const data = (await res.json()) as { ok: boolean; tip: Tip | null }
        if (data.ok && data.tip) {
          setTip(data.tip)
        } else {
          // Agent reported no relevant tip → close panel quietly.
          setOpen(false)
          setHidden(true)
        }
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={askForTip}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl text-sm font-semibold"
        title="Pedir un tip de Runi"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Tip de Runi</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-100 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">Runi — Tu asistente</p>
                <p className="text-[10px] text-slate-400">Tip personalizado para tu comercio</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 shrink-0"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pensando un tip para vos…</span>
              </div>
            )}

            {error && !loading && (
              <div className="space-y-3">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={askForTip}
                  className="text-xs flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reintentar
                </button>
              </div>
            )}

            {tip && !loading && (
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-2">{tip.headline.slice(0, 120)}</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{tip.body.slice(0, 800)}</p>

                {tip.cta_href && tip.cta_label && isSafeAppHref(tip.cta_href) && (
                  <Link
                    href={tip.cta_href}
                    onClick={() => setOpen(false)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    {tip.cta_label.slice(0, 30)}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}

                <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
                  <span>Sugerencia generada por IA</span>
                  <button
                    onClick={askForTip}
                    className="flex items-center gap-1 hover:text-slate-600"
                    title="Pedir otro tip"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Otro tip
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
