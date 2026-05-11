"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type PricingRow = {
  placement: string
  cost_per_day_cents: number
  currency: string
  min_days: number
  max_days: number
  description: string | null
  active: boolean
}

const PLACEMENT_LABELS: Record<string, string> = {
  home_top: 'Home (carousel destacados)',
  category_top: 'Top de categoría',
  search_promoted: 'Resultados de búsqueda',
}

const ALL_PLACEMENTS = ['home_top', 'category_top', 'search_promoted'] as const

function emptyRow(placement: string): PricingRow {
  return {
    placement,
    cost_per_day_cents: 0,
    currency: 'USD',
    min_days: 1,
    max_days: 30,
    description: null,
    active: false,
  }
}

export default function AdminFeaturedPricingPage() {
  const router = useRouter()
  const [rows, setRows] = useState<PricingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [savingPlacement, setSavingPlacement] = useState<string | null>(null)
  const [savedPlacement, setSavedPlacement] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.me()
      .then(user => {
        if (user.role !== 'superadmin') {
          router.push('/dashboard')
          return
        }
        setAuthorized(true)
        return api.getFeaturedPricingAdmin()
      })
      .then(data => {
        if (!data) return
        // Backfill any missing placements with empty rows so the editor shows
        // all 3 placements even if a row was never inserted.
        const byPlacement = new Map<string, PricingRow>()
        for (const p of data.placements) byPlacement.set(p.placement, p)
        const merged = ALL_PLACEMENTS.map(p => byPlacement.get(p) ?? emptyRow(p))
        setRows(merged)
      })
      .catch((e: any) => setError(e?.message || 'Error al cargar pricing'))
      .finally(() => setLoading(false))
  }, [router])

  function updateRow(placement: string, patch: Partial<PricingRow>) {
    setRows(prev => prev.map(r => r.placement === placement ? { ...r, ...patch } : r))
    setSavedPlacement(null)
  }

  async function handleSave(placement: string) {
    const row = rows.find(r => r.placement === placement)
    if (!row) return
    setSavingPlacement(placement)
    setError(null)
    try {
      if (row.min_days < 1) throw new Error('min_days debe ser >= 1')
      if (row.max_days < row.min_days) throw new Error('max_days debe ser >= min_days')
      if (row.cost_per_day_cents < 0) throw new Error('cost_per_day_cents debe ser >= 0')
      const updated = await api.updateFeaturedPricing(placement, {
        cost_per_day_cents: row.cost_per_day_cents,
        currency: row.currency,
        min_days: row.min_days,
        max_days: row.max_days,
        description: row.description ?? null,
        active: row.active,
      })
      setRows(prev => prev.map(r => r.placement === placement ? { ...r, ...updated } : r))
      setSavedPlacement(placement)
      setTimeout(() => setSavedPlacement(null), 2500)
    } catch (e: any) {
      setError(e?.message || 'Error al guardar')
    } finally {
      setSavingPlacement(null)
    }
  }

  if (!authorized && !loading) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pricing — Slots destacados</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configurá el precio por día y los límites de duración para cada placement del marketplace.
          Los cambios afectan SOLO las compras nuevas — los slots ya activos mantienen su precio original (snapshot).
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          Cargando pricing...
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(row => {
            const label = PLACEMENT_LABELS[row.placement] || row.placement
            const isSaving = savingPlacement === row.placement
            const isSaved = savedPlacement === row.placement
            return (
              <div
                key={row.placement}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{label}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{row.placement}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-medium text-slate-600">
                      {row.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateRow(row.placement, { active: !row.active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        row.active ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      aria-label="Toggle active"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          row.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>

                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Precio por día (centavos)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.cost_per_day_cents}
                      onChange={(e) => updateRow(row.placement, { cost_per_day_cents: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      {(row.cost_per_day_cents / 100).toFixed(2)} {row.currency} / día
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Moneda</label>
                    <select
                      value={row.currency}
                      onChange={(e) => updateRow(row.placement, { currency: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                      <option value="EUR">EUR</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mín. días</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.min_days}
                      onChange={(e) => updateRow(row.placement, { min_days: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Máx. días</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.max_days}
                      onChange={(e) => updateRow(row.placement, { max_days: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Descripción (visible para merchants)
                    </label>
                    <input
                      type="text"
                      value={row.description ?? ''}
                      onChange={(e) => updateRow(row.placement, { description: e.target.value || null })}
                      maxLength={500}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Carousel destacados en home (impacto máximo)"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                  {isSaved && (
                    <span className="text-xs text-emerald-600 font-medium">Guardado</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSave(row.placement)}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">Nota</p>
        <p>
          Bajar el precio NO afecta a los slots ya activos: el sistema guarda un snapshot
          del precio al momento de la compra (campo <code className="font-mono text-xs">featured_items.cost_cents</code>).
          Solo las compras nuevas verán el precio actualizado.
        </p>
      </div>
    </div>
  )
}
