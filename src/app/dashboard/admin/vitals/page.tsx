"use client"

/**
 * /dashboard/admin/vitals
 *
 * Admin dashboard for the Core Web Vitals (CLS, INP, LCP, FCP, TTFB) shipped
 * by runbits-app and runbits-web. Backed by D1 `runbits-analytics` via the
 * worker of the same name (route: api.runbits.dev/api/vitals/*).
 *
 * Layout:
 *   - 4 cards across the top: LCP, INP, CLS, FCP — each shows p75 + threshold
 *     pass/fail color. (TTFB is shown in the dropdown but excluded from cards
 *     because Google does not include it in the CWV pass criterion.)
 *   - Date range selector: last 24h / 7d / 30d.
 *   - Metric selector + "Top 10 worst URLs" table for the picked metric.
 *
 * Thresholds (web.dev — Core Web Vitals "good" cutoffs at p75):
 *   LCP  < 2500 ms
 *   INP  < 200 ms
 *   CLS  < 0.1   (unitless)
 *   FCP  < 1800 ms
 *   TTFB < 800 ms
 */

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Activity, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

type Metric = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB'

type Percentiles = {
  metric: string
  since: number
  count: number
  p50: number | null
  p75: number | null
  p95: number | null
}

type ByUrlRow = {
  url: string
  samples: number
  avg_value: number
  min_value: number
  max_value: number
}

// Threshold at which p75 still counts as "good" per web.dev. Values are in the
// same unit each metric reports (ms for most; unitless ratio for CLS).
const THRESHOLDS: Record<Metric, { good: number; poor: number; unit: string; label: string }> = {
  LCP:  { good: 2500, poor: 4000, unit: 'ms', label: 'Largest Contentful Paint' },
  INP:  { good: 200,  poor: 500,  unit: 'ms', label: 'Interaction to Next Paint' },
  CLS:  { good: 0.1,  poor: 0.25, unit: '',   label: 'Cumulative Layout Shift' },
  FCP:  { good: 1800, poor: 3000, unit: 'ms', label: 'First Contentful Paint' },
  TTFB: { good: 800,  poor: 1800, unit: 'ms', label: 'Time to First Byte' },
}

const RANGES: Array<{ key: '24h' | '7d' | '30d'; label: string; ms: number }> = [
  { key: '24h', label: 'Últimas 24h', ms: 24 * 60 * 60 * 1000 },
  { key: '7d',  label: 'Últimos 7 días',  ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '30d', label: 'Últimos 30 días', ms: 30 * 24 * 60 * 60 * 1000 },
]

const CARD_METRICS: Metric[] = ['LCP', 'INP', 'CLS', 'FCP']
const ALL_METRICS: Metric[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']

function formatValue(metric: Metric, value: number | null): string {
  if (value === null || value === undefined) return '—'
  if (metric === 'CLS') return value.toFixed(3)
  // ms metrics: show integer ms below 10s, otherwise seconds with 2 decimals.
  if (value >= 10_000) return `${(value / 1000).toFixed(2)} s`
  return `${Math.round(value)} ms`
}

function ratingColor(metric: Metric, value: number | null): { bg: string; text: string; ring: string; icon: string } {
  if (value === null) return { bg: 'bg-slate-50', text: 'text-slate-500', ring: 'ring-slate-200', icon: 'text-slate-400' }
  const t = THRESHOLDS[metric]
  if (value <= t.good) return { bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-200',  icon: 'text-green-600' }
  if (value <= t.poor) return { bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200',  icon: 'text-amber-600' }
  return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', icon: 'text-red-600' }
}

function ratingLabel(metric: Metric, value: number | null): string {
  if (value === null) return 'Sin datos'
  const t = THRESHOLDS[metric]
  if (value <= t.good) return 'Bueno'
  if (value <= t.poor) return 'Mejorable'
  return 'Pobre'
}

export default function AdminVitalsPage() {
  const [rangeKey, setRangeKey] = useState<'24h' | '7d' | '30d'>('7d')
  const [percentiles, setPercentiles] = useState<Record<Metric, Percentiles | null>>({
    LCP: null, INP: null, CLS: null, FCP: null, TTFB: null,
  })
  const [loadingCards, setLoadingCards] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedMetric, setSelectedMetric] = useState<Metric>('LCP')
  const [byUrl, setByUrl] = useState<ByUrlRow[]>([])
  const [loadingByUrl, setLoadingByUrl] = useState(false)

  const range = RANGES.find(r => r.key === rangeKey) ?? RANGES[1]
  const since = Date.now() - range.ms

  // Fetch percentiles for all metrics at once when the range changes.
  useEffect(() => {
    let alive = true
    setLoadingCards(true)
    setError(null)
    Promise.all(
      ALL_METRICS.map(m => api.getVitalsPercentiles(m, since).catch(() => null))
    ).then(results => {
      if (!alive) return
      const next: Record<Metric, Percentiles | null> = {
        LCP: null, INP: null, CLS: null, FCP: null, TTFB: null,
      }
      ALL_METRICS.forEach((m, i) => { next[m] = results[i] })
      setPercentiles(next)
      setLoadingCards(false)
    }).catch(e => {
      if (!alive) return
      setError(e?.message || 'Error cargando métricas')
      setLoadingCards(false)
    })
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey])

  // Re-fetch the "by URL" table when range or selected metric changes.
  useEffect(() => {
    let alive = true
    setLoadingByUrl(true)
    api.getVitalsByUrl(selectedMetric, since, 10)
      .then(res => { if (alive) setByUrl(res.data || []) })
      .catch(() => { if (alive) setByUrl([]) })
      .finally(() => { if (alive) setLoadingByUrl(false) })
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, selectedMetric])

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Web Vitals
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Métricas Core Web Vitals reportadas desde runbits.app y runbits.io.
            Muestreadas al 10% para limitar volumen. Los percentiles abajo son p75.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg ring-1 ring-slate-200 p-1">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                r.key === rangeKey
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 ring-1 ring-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Core Web Vitals cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARD_METRICS.map(metric => {
          const p = percentiles[metric]
          const p75 = p?.p75 ?? null
          const colors = ratingColor(metric, p75)
          const t = THRESHOLDS[metric]
          return (
            <div key={metric} className={`rounded-2xl ring-1 ${colors.ring} ${colors.bg} p-5`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{metric}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.label}</div>
                </div>
                {p75 !== null && p75 <= t.good && (
                  <CheckCircle2 className={`w-5 h-5 ${colors.icon}`} />
                )}
                {p75 !== null && p75 > t.good && (
                  <AlertTriangle className={`w-5 h-5 ${colors.icon}`} />
                )}
              </div>
              <div className={`mt-4 text-3xl font-bold ${colors.text}`}>
                {loadingCards ? '…' : formatValue(metric, p75)}
              </div>
              <div className="mt-2 text-xs font-medium flex items-center justify-between">
                <span className={colors.text}>{ratingLabel(metric, p75)}</span>
                <span className="text-slate-500">p75</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                <div>
                  <div className="font-mono">{formatValue(metric, p?.p50 ?? null)}</div>
                  <div>p50</div>
                </div>
                <div>
                  <div className="font-mono">{formatValue(metric, p?.p95 ?? null)}</div>
                  <div>p95</div>
                </div>
                <div>
                  <div className="font-mono">{p?.count ?? '—'}</div>
                  <div>muestras</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-current/10 text-[10px] text-slate-500">
                Umbral bueno: ≤ {formatValue(metric, t.good)}
              </div>
            </div>
          )
        })}
      </div>

      {/* TTFB summary (not a CWV but useful) */}
      {percentiles.TTFB && percentiles.TTFB.count > 0 && (
        <div className="mb-8 rounded-xl ring-1 ring-slate-200 bg-white p-4 flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold text-slate-700">TTFB (informativo)</span>
            <span className="text-slate-500 ml-2">— Time to First Byte, no es CWV.</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-slate-500 text-xs">
              p50 <span className="font-mono ml-1 text-slate-700">{formatValue('TTFB', percentiles.TTFB.p50)}</span>
            </div>
            <div className="text-slate-500 text-xs">
              p75 <span className="font-mono ml-1 text-slate-700">{formatValue('TTFB', percentiles.TTFB.p75)}</span>
            </div>
            <div className="text-slate-500 text-xs">
              p95 <span className="font-mono ml-1 text-slate-700">{formatValue('TTFB', percentiles.TTFB.p95)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top worst URLs */}
      <div className="rounded-2xl ring-1 ring-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Top 10 URLs más lentas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              URLs ordenadas por promedio descendente. Mínimo 3 muestras por URL.
            </p>
          </div>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as Metric)}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-50 ring-1 ring-slate-200 text-slate-700 font-medium"
          >
            {ALL_METRICS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {loadingByUrl ? (
          <div className="p-8 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : byUrl.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Sin datos para {selectedMetric} en este rango.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2 font-medium">URL</th>
                <th className="text-right px-5 py-2 font-medium">Promedio</th>
                <th className="text-right px-5 py-2 font-medium">Min</th>
                <th className="text-right px-5 py-2 font-medium">Max</th>
                <th className="text-right px-5 py-2 font-medium">Muestras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byUrl.map(row => {
                const colors = ratingColor(selectedMetric, row.avg_value)
                return (
                  <tr key={row.url} className="hover:bg-slate-50/50">
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-700 truncate max-w-[420px]">
                      {row.url}
                    </td>
                    <td className={`px-5 py-2.5 text-right font-mono ${colors.text} font-semibold`}>
                      {formatValue(selectedMetric, row.avg_value)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-slate-500 text-xs">
                      {formatValue(selectedMetric, row.min_value)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-slate-500 text-xs">
                      {formatValue(selectedMetric, row.max_value)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-slate-500 text-xs">
                      {row.samples}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
