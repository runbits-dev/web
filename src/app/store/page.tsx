"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

type Restaurant = {
  id: string; name: string; slug: string; description: string; category: string
  is_open: boolean; address: string; phone: string; logo_key: string | null
  avg_delivery_time_min: number; min_order_amount: number
  brand_color: string | null; brand_bg: string | null
}

type MenuItem = {
  id: string; name: string; description: string; price: number
  category: string; is_available: boolean
}

type CartItem = MenuItem & { qty: number }
type Rating = { id: string; rating: number; comment: string | null; created_at: number }

function StoreContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('s') || searchParams.get('slug')
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`${API}/api/restaurants/slug/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then((r: Restaurant) => {
        setRestaurant(r)
        fetch(`${API}/api/orders/restaurants/${r.id}/ratings`).then(r => r.ok ? r.json() : []).then(setRatings).catch(() => {})
        return fetch(`${API}/api/restaurants/${r.id}/menu`)
      })
      .then(r => r.json())
      .then((items: MenuItem[]) => setMenu(items.filter(i => i.is_available !== false && i.available !== 0)))
      .catch(() => setError('Restaurante no encontrado'))
      .finally(() => setLoading(false))
  }, [slug])

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId)
      if (existing && existing.qty > 1) return prev.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c)
      return prev.filter(c => c.id !== itemId)
    })
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const categories = [...new Set(menu.map(i => i.category).filter(Boolean))]
  const brandColor = restaurant?.brand_color || '#059669'
  const brandBg = restaurant?.brand_bg || '#f9fafb'

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
    </div>
  )

  if (error || !restaurant) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurante no encontrado</h1>
        <p className="text-gray-500 mb-4">El link puede estar incorrecto.</p>
        <Link href="/" className="text-[var(--brand)] font-medium hover:underline">Volver al inicio</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: brandBg, ['--brand' as string]: brandColor }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {restaurant.logo_key ? (
              <img src={`https://runbit-storage.r2.dev/${restaurant.logo_key}`} alt={restaurant.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-[var(--brand)]/15 rounded-2xl flex items-center justify-center text-2xl">🍽️</div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${restaurant.is_open ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'bg-red-100 text-red-700'}`}>
                  {restaurant.is_open ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
              {restaurant.description && <p className="text-sm text-gray-500 mt-1">{restaurant.description}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                {restaurant.category && <span>{restaurant.category}</span>}
                <span>~{restaurant.avg_delivery_time_min} min</span>
                {restaurant.min_order_amount > 0 && <span>Mín ${(restaurant.min_order_amount / 100).toFixed(0)}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Menu by category */}
        {categories.length > 0 ? categories.map(cat => {
          const items = menu.filter(i => i.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">{cat}</h2>
              <div className="space-y-2">
                {items.map(item => {
                  const inCart = cart.find(c => c.id === item.id)
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                        <p className="text-sm font-semibold text-gray-900 mt-1">${(item.price / 100).toFixed(0)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {inCart ? (
                          <>
                            <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg font-bold">−</button>
                            <span className="text-sm font-semibold w-5 text-center">{inCart.qty}</span>
                            <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand)] text-white hover:opacity-90 text-lg font-bold">+</button>
                          </>
                        ) : (
                          <button onClick={() => addToCart(item)} className="px-4 py-2 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-colors">
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }) : (
          <div className="space-y-2">
            {menu.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
                    <p className="text-sm font-semibold text-gray-900 mt-1">${(item.price / 100).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inCart ? (
                      <>
                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg font-bold">−</button>
                        <span className="text-sm font-semibold w-5 text-center">{inCart.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand)] text-white hover:opacity-90 text-lg font-bold">+</button>
                      </>
                    ) : (
                      <button onClick={() => addToCart(item)} className="px-4 py-2 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-colors">
                        Agregar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {menu.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">Este restaurante aún no tiene menú disponible.</p>
          </div>
        )}
      </div>

      {/* Floating cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-gray-200 shadow-xl">
          <div className="max-w-3xl mx-auto">
            <button className="w-full bg-[var(--brand)] text-white py-3.5 rounded-xl font-semibold text-base flex items-center justify-between px-6 hover:opacity-90 transition-colors">
              <span>Ver pedido ({cartCount})</span>
              <span>${(cartTotal / 100).toFixed(0)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Ratings */}
      {ratings.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Calificaciones ({ratings.length})</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl font-bold text-gray-900">
              {(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)}
            </span>
            <div className="text-yellow-400 text-xl">
              {'★'.repeat(Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length))}
              {'☆'.repeat(5 - Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length))}
            </div>
          </div>
          <div className="space-y-3">
            {ratings.slice(0, 5).map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-AR')}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-gray-400">
          Powered by <a href="https://runbits.io" className="text-[var(--brand)] hover:underline">Runbits</a> — Tus clientes son tuyos
        </p>
      </footer>
    </div>
  )
}

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
      </div>
    }>
      <StoreContent />
    </Suspense>
  )
}
