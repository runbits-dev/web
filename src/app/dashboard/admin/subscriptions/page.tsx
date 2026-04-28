"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ChevronDown, ChevronRight, Loader2, X } from 'lucide-react'

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700 ring-slate-200',
  pro: 'bg-blue-50 text-blue-700 ring-blue-200',
  business: 'bg-violet-50 text-violet-700 ring-violet-200',
  enterprise: 'bg-amber-50 text-amber-700 ring-amber-200',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  trialing: 'bg-blue-50 text-blue-700 ring-blue-200',
  past_due: 'bg-amber-50 text-amber-700 ring-amber-200',
  canceled: 'bg-red-50 text-red-600 ring-red-200',
}

const PLAN_OPTIONS = ['free', 'pro', 'business', 'enterprise']

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

function getHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('token') : '')}` }
}

type ExpandedData = {
  modules: any[] | null
  billing: any | null
  modulesLoading: boolean
  billingLoading: boolean
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<Record<string, ExpandedData>>({})
  const [planChanging, setPlanChanging] = useState<string | null>(null)
  const [extendingTrial, setExtendingTrial] = useState<string | null>(null)
  const [extendDays, setExtendDays] = useState(14)
  const [extendLoading, setExtendLoading] = useState(false)
  const [extendSuccess, setExtendSuccess] = useState<string | null>(null)

  useEffect(() => {
    api.getSubscriptions().then(setSubscriptions).finally(() => setLoading(false))
  }, [])

  async function loadExpandedData(s: any) {
    const storeId = s.restaurant_id || s.store_id || s.id
    if (!storeId) return

    setExpandedData(prev => ({
      ...prev,
      [s.id]: { modules: null, billing: null, modulesLoading: true, billingLoading: true },
    }))

    // Load modules and billing in parallel
    const [modulesRes, billingRes] = await Promise.allSettled([
      api.getModules(storeId),
      fetch(`${API_BASE}/api/subscriptions/${storeId}/billing`, { headers: getHeaders() }).then(r => r.ok ? r.json() : null),
    ])

    setExpandedData(prev => ({
      ...prev,
      [s.id]: {
        modules: modulesRes.status === 'fulfilled' ? (modulesRes.value as any[]) : [],
        billing: billingRes.status === 'fulfilled' ? billingRes.value : null,
        modulesLoading: false,
        billingLoading: false,
      },
    }))
  }

  function toggleExpand(s: any) {
    if (expanded === s.id) {
      setExpanded(null)
    } else {
      setExpanded(s.id)
      if (!expandedData[s.id]) {
        loadExpandedData(s)
      }
    }
  }

  async function changePlan(s: any, newPlan: string) {
    const currentPlan = s.plan
    if (newPlan === currentPlan) return

    const plans = PLAN_OPTIONS
    const currentIdx = plans.indexOf(currentPlan)
    const newIdx = plans.indexOf(newPlan)
    const endpoint = newIdx > currentIdx ? 'upgrade' : 'downgrade'

    setPlanChanging(s.id)
    try {
      await fetch(`${API_BASE}/api/subscriptions/${s.id}/${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ plan: newPlan }),
      })
      // Refresh subscriptions list
      const fresh = await api.getSubscriptions()
      setSubscriptions(fresh)
      // Clear expanded data so it re-fetches
      setExpandedData(prev => {
        const next = { ...prev }
        delete next[s.id]
        return next
      })
    } catch (e) {
      console.error('Failed to change plan', e)
    }
    setPlanChanging(null)
  }

  async function extendTrial(subId: string) {
    setExtendLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscriptions/${subId}/extend-trial`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ days: extendDays }),
      })
      if (res.ok) {
        const fresh = await api.getSubscriptions()
        setSubscriptions(fresh)
        setExtendingTrial(null)
        setExtendSuccess(subId)
        setTimeout(() => setExtendSuccess(null), 3000)
      } else {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
        alert(err.error || 'Error al extender trial')
      }
    } catch {
      alert('Error al extender trial')
    }
    setExtendLoading(false)
  }

  const byPlan = subscriptions.reduce((acc: Record<string, number>, s) => {
    acc[s.plan] = (acc[s.plan] || 0) + 1
    return acc
  }, {})

  const mrr = subscriptions
    .filter(s => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => sum + (s.monthly_amount || 0), 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Subscripciones</h1>
        <p className="text-slate-500 text-sm mt-1">{subscriptions.length} comercios</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">MRR</p>
          <p className="text-2xl font-bold text-slate-900">${(mrr / 100).toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Activas</p>
          <p className="text-2xl font-bold text-indigo-600">{subscriptions.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Vencidas</p>
          <p className="text-2xl font-bold text-amber-600">{subscriptions.filter(s => s.status === 'past_due').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Canceladas</p>
          <p className="text-2xl font-bold text-red-500">{subscriptions.filter(s => s.status === 'canceled').length}</p>
        </div>
      </div>

      {/* Plan breakdown */}
      {Object.keys(byPlan).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-3">Por plan</p>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(byPlan).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${PLAN_COLORS[plan] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{plan}</span>
                <span className="text-sm font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <p className="text-slate-400 text-sm">No hay subscripciones</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3.5 w-8"></th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Restaurante</th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Mensual</th>
                <th className="text-right px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Próximo cobro</th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cambiar plan</th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Trial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map(s => {
                const isExpanded = expanded === s.id
                const data = expandedData[s.id]

                return (
                  <>
                    <tr key={s.id}
                      onClick={() => toggleExpand(s)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50' : ''}`}>
                      <td className="px-4 py-4 text-slate-400">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-indigo-500" />
                          : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">{s.restaurant_name || s.restaurant_id?.slice(0, 8)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${PLAN_COLORS[s.plan] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{s.plan}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">
                        {s.monthly_amount ? `$${(s.monthly_amount / 100).toFixed(0)}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-400 text-xs">
                        {s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString('es-AR') : '—'}
                      </td>
                      {/* Change plan */}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <select
                            value={s.plan}
                            onChange={e => changePlan(s, e.target.value)}
                            disabled={planChanging === s.id}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {PLAN_OPTIONS.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          {planChanging === s.id && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                        </div>
                      </td>
                      {/* Extend trial */}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        {s.status === 'trialing' ? (
                          extendingTrial === s.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={extendDays}
                                onChange={e => setExtendDays(Number(e.target.value))}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] text-slate-400">días</span>
                              <button
                                onClick={() => extendTrial(s.id)}
                                disabled={extendLoading}
                                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {extendLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                Confirmar
                              </button>
                              <button
                                onClick={() => setExtendingTrial(null)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : extendSuccess === s.id ? (
                            <span className="text-xs text-green-600 font-semibold">Trial extendido</span>
                          ) : (
                            <button
                              onClick={() => { setExtendingTrial(s.id); setExtendDays(14) }}
                              className="text-xs text-indigo-600 border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 font-semibold transition-colors"
                            >
                              Extender trial
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${s.id}-detail`} className="bg-indigo-50/50">
                        <td colSpan={8} className="px-6 pb-5 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Active modules */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                              <h4 className="text-xs font-semibold text-slate-600 mb-3">Módulos activos</h4>
                              {data?.modulesLoading ? (
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
                                </div>
                              ) : !data?.modules || data.modules.length === 0 ? (
                                <p className="text-xs text-slate-400">Sin módulos activos</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {data.modules.map((m: any, i: number) => (
                                    <span key={i}
                                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ring-1
                                        ${m.is_active || m.status === 'active'
                                          ? 'bg-green-50 text-green-700 ring-green-200'
                                          : 'bg-slate-50 text-slate-400 ring-slate-200'}`}>
                                      {m.name || m.module_id || m.id}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Payment history */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                              <h4 className="text-xs font-semibold text-slate-600 mb-3">Últimos pagos</h4>
                              {data?.billingLoading ? (
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
                                </div>
                              ) : (() => {
                                const invoices: any[] = data?.billing?.invoices || data?.billing?.payments || data?.billing || []
                                const last3 = Array.isArray(invoices) ? invoices.slice(0, 3) : []
                                if (last3.length === 0) return <p className="text-xs text-slate-400">Sin historial de pagos</p>
                                return (
                                  <div className="space-y-2">
                                    {last3.map((inv: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                                        <div>
                                          <p className="text-xs font-medium text-slate-700">
                                            {inv.date || inv.created_at || inv.invoice_date
                                              ? new Date(inv.date || inv.created_at || inv.invoice_date).toLocaleDateString('es-AR')
                                              : `Pago #${i + 1}`}
                                          </p>
                                          {inv.description && <p className="text-[10px] text-slate-400">{inv.description}</p>}
                                        </div>
                                        <span className={`text-xs font-semibold ${
                                          inv.status === 'paid' || inv.status === 'succeeded' ? 'text-green-700' :
                                          inv.status === 'failed' ? 'text-red-600' : 'text-slate-700'
                                        }`}>
                                          {inv.amount != null ? `$${(inv.amount / 100).toFixed(2)}` : '—'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
