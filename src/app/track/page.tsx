"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Pedido recibido', icon: '📋' },
  { key: 'CONFIRMED', label: 'Confirmado por el local', icon: '✅' },
  { key: 'PREPARING', label: 'En preparación', icon: '👨‍🍳' },
  { key: 'PICKED_UP', label: 'Recogido por el repartidor', icon: '📦' },
  { key: 'IN_TRANSIT', label: 'En camino', icon: '🛵' },
  { key: 'DELIVERED', label: 'Entregado', icon: '🎉' },
]

const STATUS_INDEX: Record<string, number> = {}
STATUS_STEPS.forEach((s, i) => { STATUS_INDEX[s.key] = i })

function TrackContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const [order, setOrder] = useState<any>(null)
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) { setError(true); setLoading(false); return }

    const loadOrder = async () => {
      try {
        const res = await fetch(`${API}/api/orders/${orderId}`)
        if (!res.ok) { setError(true); return }
        const data = await res.json()
        setOrder(data)

        if (data.rider_id && ['PICKED_UP', 'IN_TRANSIT'].includes(data.status)) {
          try {
            const riderRes = await fetch(`${API}/api/riders/${data.rider_id}`)
            if (riderRes.ok) {
              const rider = await riderRes.json()
              if (rider.gps) setRiderPos({ lat: rider.gps.lat, lng: rider.gps.lng })
            }
          } catch {}
        }
      } catch { setError(true) }
      finally { setLoading(false) }
    }

    loadOrder()
    const interval = setInterval(loadOrder, 15000)
    return () => clearInterval(interval)
  }, [orderId])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido no encontrado</h1>
        <p className="text-gray-500 text-sm">Verificá el link de seguimiento.</p>
      </div>
    </div>
  )

  const currentStep = STATUS_INDEX[order.status] ?? 0
  const isCancelled = order.status === 'CANCELLED'
  const isCompleted = order.status === 'COMPLETED' || order.status === 'DELIVERED'
  const isInTransit = ['PICKED_UP', 'IN_TRANSIT'].includes(order.status)

  // ETA estimation
  const avgDeliveryMin = 30
  const minutesSinceConfirmed = order.confirmed_at
    ? Math.round((Date.now() - order.confirmed_at) / 60000)
    : 0
  const etaMin = Math.max(5, avgDeliveryMin - minutesSinceConfirmed)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Seguimiento de pedido</h1>
          <span className="text-xs text-gray-400 font-mono">#{orderId?.slice(0, 8)}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ETA card */}
        {!isCancelled && !isCompleted && (
          <div className="bg-emerald-600 text-white rounded-2xl p-6 text-center">
            <p className="text-sm opacity-80">Tiempo estimado de entrega</p>
            <p className="text-4xl font-bold mt-1">{etaMin} min</p>
            <p className="text-sm mt-2 opacity-70">Actualiza automáticamente cada 15s</p>
          </div>
        )}

        {isCompleted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <span className="text-4xl">🎉</span>
            <p className="text-lg font-bold text-emerald-800 mt-2">¡Pedido entregado!</p>
            <p className="text-sm text-emerald-600 mt-1">Gracias por tu compra</p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <span className="text-4xl">❌</span>
            <p className="text-lg font-bold text-red-800 mt-2">Pedido cancelado</p>
          </div>
        )}

        {/* Progress steps */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentStep
                const isCurrent = i === currentStep
                const isLast = i === STATUS_STEPS.length - 1
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                        {step.icon}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 ${isDone ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-emerald-600 mt-0.5">Estado actual</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rider map */}
        {isInTransit && riderPos && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Ubicación del repartidor</h2>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${riderPos.lng-0.008},${riderPos.lat-0.008},${riderPos.lng+0.008},${riderPos.lat+0.008}&layer=mapnik&marker=${riderPos.lat},${riderPos.lng}`}
              className="w-full h-52 rounded-xl border border-gray-200"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Resumen</h2>
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">{item.quantity}x {item.name}</span>
              <span className="text-gray-500">${((item.price * item.quantity) / 100).toFixed(0)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-200">
            <span>Total</span>
            <span>${((order.total || 0) / 100).toFixed(0)}</span>
          </div>
        </div>

        <footer className="text-center py-4">
          <p className="text-xs text-gray-400">
            Powered by <Link href="https://runbits.io" className="text-emerald-600 hover:underline">Runbits</Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  )
}
