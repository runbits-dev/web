"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, CheckCircle, ChefHat, Package, Bike, PartyPopper } from 'lucide-react'
import { useI18n } from '@/i18n'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Pedido recibido', Icon: ClipboardList },
  { key: 'CONFIRMED', label: 'Confirmado por el local', Icon: CheckCircle },
  { key: 'PREPARING', label: 'En preparación', Icon: ChefHat },
  { key: 'PICKED_UP', label: 'Recogido por el repartidor', Icon: Package },
  { key: 'IN_TRANSIT', label: 'En camino', Icon: Bike },
  { key: 'DELIVERED', label: 'Entregado', Icon: PartyPopper },
]

const STATUS_INDEX: Record<string, number> = {}
STATUS_STEPS.forEach((s, i) => { STATUS_INDEX[s.key] = i })

function TrackContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const [order, setOrder] = useState<any>(null)
  // Live rider position comes exclusively from the public /tracking endpoint.
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null)
  const [trackable, setTrackable] = useState(false)
  // Distinguishes "no successful /tracking response yet" from "server said trackable:false".
  const [trackLoaded, setTrackLoaded] = useState(false)
  const [trackError, setTrackError] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [whiteLabel, setWhiteLabel] = useState(false)

  // Order summary + status (auth-free, order-scoped). Polled for status changes.
  useEffect(() => {
    if (!orderId) { setError(true); setLoading(false); return }

    const loadOrder = async () => {
      try {
        const res = await fetch(`${API}/api/orders/${orderId}`)
        if (!res.ok) { setError(true); return }
        const data = await res.json()
        setOrder(data)

        if (data.restaurant_id) {
          fetch(`${API}/api/subscriptions/${data.restaurant_id}/limits`)
            .then(r => r.ok ? r.json() : null)
            .then(limitsData => { if (limitsData?.limits?.whiteLabel) setWhiteLabel(true) })
            .catch(() => {})
        }
      } catch { setError(true) }
      finally { setLoading(false) }
    }

    loadOrder()
    const interval = setInterval(loadOrder, 15000)
    return () => clearInterval(interval)
  }, [orderId])

  // Live tracking (public endpoint, no auth). The rider pushes ~every 30s, so
  // we poll at the same cadence. A failed refetch keeps the last known position.
  useEffect(() => {
    if (!orderId) return

    const loadTracking = async () => {
      try {
        const res = await fetch(`${API}/api/orders/${orderId}/tracking`)
        if (!res.ok) { setTrackError(true); return }
        const data = await res.json()
        setTrackable(Boolean(data?.trackable))
        const pos = data?.position
        if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number') {
          setRiderPos({ lat: pos.lat, lng: pos.lng })
        }
        setTrackLoaded(true)
        setTrackError(false)
      } catch {
        // Resilient: keep the last known position, just flag the stale update.
        setTrackError(true)
      }
    }

    loadTracking()
    const interval = setInterval(loadTracking, 30000)
    return () => clearInterval(interval)
  }, [orderId])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
          <div className="bg-indigo-600 text-white rounded-2xl p-6 text-center">
            <p className="text-sm opacity-80">Tiempo estimado de entrega</p>
            <p className="text-4xl font-bold mt-1">{etaMin} min</p>
            <p className="text-sm mt-2 opacity-70">Actualiza automáticamente cada 15s</p>
          </div>
        )}

        {isCompleted && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center">
            <PartyPopper className="w-10 h-10 text-indigo-600 mx-auto" />
            <p className="text-lg font-bold text-indigo-800 mt-2">¡Pedido entregado!</p>
            <p className="text-sm text-indigo-600 mt-1">Gracias por tu compra</p>
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
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}>
                        <step.Icon className="w-4 h-4" />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 ${isDone ? 'bg-indigo-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-indigo-600 mt-0.5">Estado actual</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Live tracking states (mutually exclusive) */}
        {!isCancelled && !isCompleted && (
          <>
            {/* Trackable + position available → map (persists last-known position) */}
            {trackable && riderPos && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">{t('track.mapTitle')}</h2>
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${riderPos.lng-0.008},${riderPos.lat-0.008},${riderPos.lng+0.008},${riderPos.lat+0.008}&layer=mapnik&marker=${riderPos.lat},${riderPos.lng}`}
                  className="w-full h-52 rounded-xl border border-gray-200"
                  style={{ border: 0 }}
                  loading="lazy"
                />
                {trackError && (
                  <p className="text-xs text-amber-600 mt-2">{t('track.updateError')}</p>
                )}
              </div>
            )}

            {/* Trackable but no position yet → locating the rider */}
            {trackable && !riderPos && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">{t('track.locating')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('track.locatingHint')}</p>
                {trackError && (
                  <p className="text-xs text-amber-600 mt-2">{t('track.updateError')}</p>
                )}
              </div>
            )}

            {/* Loaded and server says not trackable → order hasn't left */}
            {trackLoaded && !trackable && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <Bike className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">{t('track.notInTransit')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('track.notInTransitHint')}</p>
              </div>
            )}

            {/* No successful tracking response yet + error → neutral retry state (never "no salió") */}
            {!trackLoaded && trackError && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-3" />
                <p className="text-sm text-amber-600">{t('track.statusUnavailable')}</p>
              </div>
            )}

            {/* No successful tracking response yet, no error → loading */}
            {!trackLoaded && !trackError && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('track.loadingStatus')}</p>
              </div>
            )}
          </>
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

        {/* Footer — hidden for white-label */}
        {!whiteLabel && (
          <footer className="text-center py-4">
            <p className="text-xs text-gray-400">
              Powered by <Link href="https://runbits.io" className="text-indigo-600 hover:underline">Runbits</Link>
            </p>
          </footer>
        )}
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  )
}
