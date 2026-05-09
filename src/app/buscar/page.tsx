"use client"

import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'
import { FooterLocaleBar } from '@/components/FooterLocaleBar'
import { api } from '@/lib/api'

type Item = {
  id: string
  store_id: string
  kind: string
  name: string
  slug?: string
  description?: string | null
  price_cents: number
  currency: string
  rating_avg?: number | null
  rating_count?: number
  created_at: number
}

type Category = {
  id: string
  slug: string
  name_es: string
  name_en: string
  icon_emoji?: string | null
  kind_filter?: string | null
  parent_id?: string | null
}

const KIND_LABELS: Record<string, { es: string; emoji: string }> = {
  food: { es: 'Comida', emoji: '🍽️' },
  physical: { es: 'Productos', emoji: '🛍️' },
  service: { es: 'Servicios', emoji: '🛠️' },
  rental: { es: 'Alquileres', emoji: '🏘️' },
  experience: { es: 'Experiencias', emoji: '🎭' },
}

function formatPrice(cents: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${(cents / 100).toFixed(2)}`
}

export default function BuscarPage() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [kind, setKind] = useState<string>('')
  const [categorySlug, setCategorySlug] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [items, setItems] = useState<Item[]>([])
  const [facets, setFacets] = useState<any>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // debounce text input to avoid per-keystroke fetches
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  // load categories once (filtered by kind when selected)
  useEffect(() => {
    api.getCategories({ kind: kind || undefined })
      .then(r => setCategories((r.data as Category[]) || []))
      .catch(() => setCategories([]))
  }, [kind])

  // perform search whenever filters change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.searchCatalog({
      q: debouncedQ || undefined,
      kind: kind || undefined,
      category: categorySlug || undefined,
      min_price: minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined,
      max_price: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined,
      limit: 24,
    })
      .then(res => {
        if (cancelled) return
        setItems(res.items as Item[])
        setFacets(res.facets || null)
        setNextCursor(res.next_cursor)
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
        setFacets(null)
        setNextCursor(null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQ, kind, categorySlug, minPrice, maxPrice])

  function clearFilters() {
    setQ('')
    setKind('')
    setCategorySlug('')
    setMinPrice('')
    setMaxPrice('')
  }

  // Render only the categories whose kind matches the selected kind (or all when no kind).
  const visibleCats = useMemo(() => {
    if (!kind) return categories.filter(c => !c.parent_id) // top-level only when no kind
    return categories.filter(c => c.kind_filter === kind)
  }, [categories, kind])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <LandingNavbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Explorar Runbits</h1>
          <p className="text-slate-500 text-sm mt-1">Comida, productos, servicios, alquileres y experiencias.</p>
        </header>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar pizza, peluquería, alquiler de cancha..."
            className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-2xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Limpiar"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Kind chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(KIND_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setKind(kind === k ? '' : k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                kind === k
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="mr-1">{v.emoji}</span>{v.es}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar filters */}
          <aside className="bg-white rounded-2xl border border-slate-200 p-4 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Filtros</h2>
              {(q || kind || categorySlug || minPrice || maxPrice) && (
                <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-900">
                  Limpiar
                </button>
              )}
            </div>

            <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
            <select
              value={categorySlug}
              onChange={e => setCategorySlug(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4"
            >
              <option value="">Todas</option>
              {visibleCats.map(c => (
                <option key={c.id} value={c.slug}>
                  {c.icon_emoji ? `${c.icon_emoji} ` : ''}{c.name_es}
                </option>
              ))}
            </select>

            <label className="block text-xs font-semibold text-slate-600 mb-1">Precio mínimo</label>
            <input
              type="number" min="0" step="1"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 mb-3"
            />
            <label className="block text-xs font-semibold text-slate-600 mb-1">Precio máximo</label>
            <input
              type="number" min="0" step="1"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="9999"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />

            {facets && facets.categories && Object.keys(facets.categories).length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-slate-600 mb-2">Top categorías</h3>
                <ul className="space-y-1">
                  {Object.entries(facets.categories).slice(0, 8).map(([slug, count]) => (
                    <li key={slug}>
                      <button
                        onClick={() => setCategorySlug(slug)}
                        className={`w-full text-left text-xs px-2 py-1 rounded-lg transition-colors ${categorySlug === slug ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        {slug} <span className="text-[10px] opacity-60">({count as number})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Results grid */}
          <section>
            {loading && (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Buscando...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500 text-sm">Sin resultados. Probá con otros términos o quitá filtros.</p>
              </div>
            )}
            {!loading && items.length > 0 && (
              <>
                <p className="text-xs text-slate-500 mb-4">{items.length} resultado{items.length === 1 ? '' : 's'}{nextCursor ? '+' : ''}</p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map(item => (
                    <article key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{KIND_LABELS[item.kind]?.emoji ?? '📦'}</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{KIND_LABELS[item.kind]?.es ?? item.kind}</span>
                        </div>
                        <span className="text-base font-bold text-slate-900">{formatPrice(item.price_cents, item.currency)}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 leading-tight mb-1 line-clamp-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                      )}
                      {item.rating_avg != null && (item.rating_count ?? 0) > 0 && (
                        <div className="mt-2 text-xs text-amber-600">★ {item.rating_avg.toFixed(1)} <span className="text-slate-400">({item.rating_count})</span></div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <FooterLocaleBar />
    </div>
  )
}
