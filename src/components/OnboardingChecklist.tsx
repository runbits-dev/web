"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Check, X, ChevronDown, ChevronRight, Sparkles, Lightbulb } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { api } from '@/lib/api'
import {
  getStepsForBusinessType,
  getSkippedSteps,
  skipStep,
  ensureStartedAt,
  daysSince,
  getSmartSuggestion,
  type OnboardingStep,
} from '@/lib/onboarding'
import { Confetti } from '@/components/Confetti'

type ResolvedStep = OnboardingStep & { done: boolean; skipped: boolean }

type ChecklistData = {
  hasItems: boolean
  hasOrders: boolean
  hasPhone: boolean
  hasAddress: boolean
  isOpen: boolean
  hasChannel: boolean
}

function resolveSteps(steps: OnboardingStep[], data: ChecklistData, skipped: Set<string>): ResolvedStep[] {
  return steps.map(s => {
    let done = false
    switch (s.id) {
      case 'profile': done = data.hasPhone || data.hasAddress; break
      case 'item':    done = data.hasItems; break
      case 'open':    done = data.isOpen; break
      case 'channel': done = data.hasChannel; break
      case 'share':   done = data.hasOrders; break // proxy: if you got an order, you shared
      default: done = false
    }
    return { ...s, done, skipped: skipped.has(s.id) }
  })
}

function useChecklistData(): { data: ChecklistData | null; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const me = await api.me()
        const restaurantId = me.restaurant_id
        let menu: any[] = []
        let orders: any[] = []
        let isOpen = false
        let hasPhone = !!me.phone
        let hasAddress = false
        let hasChannel = false

        if (restaurantId) {
          // Run requests in parallel; tolerate failures.
          const [menuRes, statsRes, restRes, ordersRes] = await Promise.all([
            api.getMenu(restaurantId).catch(() => [] as any[]),
            api.getRestaurantStats(restaurantId).catch(() => ({} as any)),
            api.getRestaurant(restaurantId).catch(() => ({} as any)),
            api.getMyOrders().catch(() => [] as any[]),
          ])
          menu = Array.isArray(menuRes) ? menuRes : []
          orders = Array.isArray(ordersRes) ? ordersRes : []
          isOpen = !!statsRes?.is_open
          if (restRes?.phone) hasPhone = true
          if (restRes?.address) hasAddress = true
          // Channel detection — if the merchant has any payment_method or whatsapp connected.
          // We treat "paid orders" as a strong signal too.
          if (Array.isArray(restRes?.payment_methods) && restRes.payment_methods.length > 0) hasChannel = true
        }

        if (!cancelled) {
          setData({
            hasItems: menu.length > 0,
            hasOrders: orders.length > 0,
            hasPhone,
            hasAddress,
            isOpen,
            hasChannel,
          })
        }
      } catch {
        if (!cancelled) setData({ hasItems: false, hasOrders: false, hasPhone: false, hasAddress: false, isOpen: false, hasChannel: false })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [tick])

  return { data, loading, refresh: () => setTick(t => t + 1) }
}

// ─── Inline (sidebar) variant ─────────────────────────────────────────────────

export function OnboardingChecklistSidebar() {
  const { activeProfile, refreshProfiles } = useProfile()
  const [expanded, setExpanded] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const { data, loading } = useChecklistData()
  const [skipBump, setSkipBump] = useState(0)

  const steps = useMemo(() => activeProfile ? getStepsForBusinessType(activeProfile.business_type) : [], [activeProfile])
  const skipped = useMemo(() => activeProfile ? new Set(getSkippedSteps(activeProfile.id)) : new Set<string>(), [activeProfile, skipBump])
  const resolved: ResolvedStep[] = useMemo(() => data ? resolveSteps(steps, data, skipped) : [], [steps, data, skipped])

  // Persist start time once.
  useEffect(() => {
    if (activeProfile && !activeProfile.tutorial_completed) ensureStartedAt(activeProfile.id)
  }, [activeProfile?.id])

  if (!activeProfile || activeProfile.tutorial_completed) return null
  if (loading || !data) return null

  const actionable = resolved.filter(s => !s.skipped)
  const doneCount = actionable.filter(s => s.done).length
  const total = actionable.length
  if (total === 0) return null
  const allDone = doneCount === total
  const pct = Math.round((doneCount / total) * 100)

  async function completeForever() {
    if (!activeProfile) return
    try {
      await api.updateProfile(activeProfile.id, { tutorialCompleted: true })
      await refreshProfiles()
    } catch {}
  }

  async function handleAllDone() {
    setShowConfetti(true)
    // Let the confetti play before unmounting via tutorial_completed flip.
    setTimeout(() => { void completeForever() }, 2200)
  }

  return (
    <>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div className="mx-4 mb-3 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-indigo-50/50 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900">Tu primer comercio</p>
            <p className="text-[11px] text-indigo-700 font-medium">{doneCount}/{total} pasos · {pct}%</p>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>
        <div className="h-1 bg-indigo-100">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {expanded && (
          <div className="p-2 space-y-1">
            {resolved.map(step => {
              if (step.skipped) return null
              return (
                <div key={step.id} className="group relative">
                  <Link
                    href={step.href}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-colors ${step.done ? 'text-slate-400' : 'text-slate-700 hover:bg-indigo-50'}`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${step.done ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-300 text-slate-400'}`}>
                      {step.done && <Check className="w-3 h-3" />}
                    </span>
                    <span className={`truncate ${step.done ? 'line-through' : 'font-medium'}`}>{step.label}</span>
                  </Link>
                  {!step.done && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (activeProfile) {
                          skipStep(activeProfile.id, step.id)
                          setSkipBump(b => b + 1)
                        }
                      }}
                      title="Saltar este paso"
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
            {allDone && (
              <button
                onClick={handleAllDone}
                className="w-full mt-2 bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                ¡Listo! Cerrar checklist
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Full (dashboard home) variant ─────────────────────────────────────────────

export function OnboardingChecklistFull() {
  const { activeProfile, refreshProfiles } = useProfile()
  const { data, loading } = useChecklistData()
  const [skipBump, setSkipBump] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [dismissedTip, setDismissedTip] = useState(false)

  const steps = useMemo(() => activeProfile ? getStepsForBusinessType(activeProfile.business_type) : [], [activeProfile])
  const skipped = useMemo(() => activeProfile ? new Set(getSkippedSteps(activeProfile.id)) : new Set<string>(), [activeProfile, skipBump])
  const resolved: ResolvedStep[] = useMemo(() => data ? resolveSteps(steps, data, skipped) : [], [steps, data, skipped])

  useEffect(() => {
    if (activeProfile && !activeProfile.tutorial_completed) ensureStartedAt(activeProfile.id)
  }, [activeProfile?.id])

  if (!activeProfile || activeProfile.tutorial_completed) return null
  if (loading || !data) return null

  const actionable = resolved.filter(s => !s.skipped)
  const total = actionable.length
  if (total === 0) return null
  const doneCount = actionable.filter(s => s.done).length
  const pct = Math.round((doneCount / total) * 100)
  const allDone = doneCount === total

  // Smart suggestion when stalled.
  const startedAt = ensureStartedAt(activeProfile.id)
  const idle = daysSince(startedAt)
  const tip = !dismissedTip ? getSmartSuggestion({
    businessType: activeProfile.business_type,
    daysIdle: idle,
    hasItems: data.hasItems,
    hasOrders: data.hasOrders,
    hasChannel: data.hasChannel,
  }) : null

  async function finish() {
    setShowConfetti(true)
    setTimeout(async () => {
      try {
        await api.updateProfile(activeProfile!.id, { tutorialCompleted: true })
        await refreshProfiles()
      } catch {}
    }, 2200)
  }

  return (
    <>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Completá tu configuración</h2>
            <p className="text-sm text-slate-600 mt-1">Seguí estos pasos para empezar a operar.</p>
          </div>
          <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        {tip && !allDone && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-900">{tip.text}</p>
              {tip.cta && tip.href && (
                <Link href={tip.href} className="text-xs text-amber-700 font-semibold underline mt-1 inline-block">
                  {tip.cta}
                </Link>
              )}
            </div>
            <button
              onClick={() => setDismissedTip(true)}
              className="text-amber-400 hover:text-amber-700"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {resolved.map(step => {
            if (step.skipped) return null
            return (
              <div key={step.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${step.done ? 'bg-white/60' : 'bg-white shadow-sm'}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${step.done ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {step.done ? <Check className="w-4 h-4" /> : '·'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{step.label}</p>
                  {!step.done && <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>}
                </div>
                {!step.done && (
                  <>
                    <Link
                      href={step.href}
                      className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {step.cta ?? 'Completar'}
                    </Link>
                    <button
                      onClick={() => {
                        if (activeProfile) {
                          skipStep(activeProfile.id, step.id)
                          setSkipBump(b => b + 1)
                        }
                      }}
                      className="text-xs text-slate-400 hover:text-slate-700 font-medium px-2 py-1.5"
                      title="Saltar este paso"
                    >
                      Saltar
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {allDone && (
          <button
            onClick={finish}
            className="w-full mt-4 bg-indigo-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            ¡Felicitaciones! Cerrar checklist
          </button>
        )}
      </div>
    </>
  )
}
