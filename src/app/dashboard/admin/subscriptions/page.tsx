"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700 ring-slate-200',
  growth: 'bg-blue-50 text-blue-700 ring-blue-200',
  pro: 'bg-violet-50 text-violet-700 ring-violet-200',
  enterprise: 'bg-amber-50 text-amber-700 ring-amber-200',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  trialing: 'bg-blue-50 text-blue-700 ring-blue-200',
  past_due: 'bg-amber-50 text-amber-700 ring-amber-200',
  canceled: 'bg-red-50 text-red-600 ring-red-200',
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSubscriptions().then(setSubscriptions).finally(() => setLoading(false))
  }, [])

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
          <p className="text-2xl font-bold text-emerald-600">{subscriptions.filter(s => s.status === 'active').length}</p>
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
                <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Restaurante</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Mensual</th>
                <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Próximo cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{s.restaurant_name || s.restaurant_id?.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${PLAN_COLORS[s.plan] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{s.plan}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{s.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">
                    {s.monthly_amount ? `$${(s.monthly_amount / 100).toFixed(0)}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 text-xs">
                    {s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString('es-AR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
