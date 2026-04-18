"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

type Restaurant = {
  id: string; name: string; slug: string; description: string; category: string
  is_open: boolean; address: string; phone: string; logo_key: string | null
  avg_delivery_time_min: number; min_order_amount: number
}

type MenuItem = {
  id: string; name: string; description: string; price: number
  category: string; is_available: boolean
}

type CartItem = MenuItem & { qty: number }

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`${API}/api/restaurants/slug/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then((r: Restaurant) => {
        setRestaurant(r)
        return fetch(`${API}/api/restaurants/${r.id}/menu`)
      })
      .then(r => r.json())
      .then((items: MenuItem[]) => setMenu(items.filter(i => i.is_available)))
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  )

  if (error || !restaurant) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurante no encontrado</h1>
        <p className="text-gray-500 mb-4">El link puede estar incorrecto.</p>
        <Link href="/" className="text-emerald-600 font-medium hover:underline">Volver al inicio</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {restaurant.logo_key ? (
              <img src={`https://runbit-storage.r2.dev/${restaurant.logo_key}`} alt={restaurant.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">🍽️</div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${restaurant.is_open ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
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
                            <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-lg font-bold">+</button>
                          </>
                        ) : (
                          <button onClick={() => addToCart(item)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
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
                        <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-lg font-bold">+</button>
                      </>
                    ) : (
                      <button onClick={() => addToCart(item)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
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
            <button className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-base flex items-center justify-between px-6 hover:bg-emerald-700 transition-colors">
              <span>Ver pedido ({cartCount})</span>
              <span>${(cartTotal / 100).toFixed(0)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-gray-400">
          Powered by <a href="https://runbits.io" className="text-emerald-600 hover:underline">Runbits</a> — Tus clientes son tuyos
        </p>
      </footer>
    </div>
  )
}
