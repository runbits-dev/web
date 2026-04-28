"use client"

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'

type Message = { id: string; sender_id: string; sender_role: string; message: string; created_at: number }

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

function RiderMap({ riderId }: { riderId: string }) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/riders/${riderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          if (data.gps) setPos({ lat: data.gps.lat, lng: data.gps.lng })
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [riderId])

  if (!pos) return (
    <div className="h-48 bg-slate-50 rounded-xl flex items-center justify-center text-sm text-slate-400">
      Esperando ubicación del repartidor...
    </div>
  )

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${pos.lng-0.01},${pos.lat-0.01},${pos.lng+0.01},${pos.lat+0.01}&layer=mapnik&marker=${pos.lat},${pos.lng}`

  return (
    <div className="space-y-2">
      <iframe
        src={mapUrl}
        className="w-full h-64 rounded-xl border border-slate-200"
        style={{ border: 0 }}
        loading="lazy"
      />
      <p className="text-xs text-slate-400 text-center">
        Lat: {pos.lat.toFixed(6)}, Lng: {pos.lng.toFixed(6)} · Actualiza cada 10s
      </p>
    </div>
  )
}

const statusConfig: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  PENDING:          { label: 'Pendiente',      color: 'bg-amber-50 text-amber-700 ring-amber-200',    next: 'CONFIRMED',        nextLabel: 'Confirmar' },
  CONFIRMED:        { label: 'Confirmado',     color: 'bg-blue-50 text-blue-700 ring-blue-200',       next: 'PREPARING',        nextLabel: 'Preparar' },
  PREPARING:        { label: 'Preparando',     color: 'bg-indigo-50 text-indigo-700 ring-indigo-200', next: 'READY_FOR_PICKUP', nextLabel: 'Listo para retiro' },
  READY_FOR_PICKUP: { label: 'Listo',          color: 'bg-teal-50 text-teal-700 ring-teal-200' },
  PICKED_UP:        { label: 'Retirado',       color: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  IN_TRANSIT:       { label: 'En camino',      color: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELIVERED:        { label: 'Entregado',      color: 'bg-green-50 text-green-700 ring-green-200',   next: 'COMPLETED',        nextLabel: 'Completar' },
  COMPLETED:        { label: 'Completado',     color: 'bg-green-50 text-green-800 ring-green-200' },
  CANCELLED:        { label: 'Cancelado',      color: 'bg-red-50 text-red-700 ring-red-200' },
}

const statusTimeline = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED',
]

function OrderDetailContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.getOrder(id),
      api.getChatMessages(id).catch(() => []),
    ]).then(([o, m]) => {
      setOrder(o)
      setMessages(m)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }, [messages])

  async function sendMessage() {
    if (!newMsg.trim() || !id) return
    setSending(true)
    try {
      const msg = await api.sendChatMessage(id, newMsg.trim())
      setMessages(prev => [...prev, msg])
      setNewMsg('')
    } catch {} finally { setSending(false) }
  }

  async function updateStatus(newStatus: string) {
    if (!id) return
    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setOrder((prev: any) => ({ ...prev, status: newStatus }))
      }
    } catch {} finally { setUpdating(false) }
  }

  async function cancelOrder() {
    if (!confirm('¿Cancelar este pedido?')) return
    await updateStatus('CANCELLED')
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
  if (!order) return <div className="p-8 text-center text-slate-400 text-sm">Pedido no encontrado</div>

  const config = statusConfig[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-600 ring-slate-200' }
  const isDelivery = order.delivery_type === 'delivery' || !!order.delivery_fee
  const currentStatusIndex = statusTimeline.indexOf(order.status)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/orders" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">← Volver a pedidos</Link>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-slate-900 font-mono">#{order.id?.slice(0, 8)}</h1>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${config.color}`}>{config.label}</span>
          {isDelivery ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200">Delivery</span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-slate-200">Retiro en local</span>
          )}
        </div>
        <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {config.next && (
          <button
            onClick={() => updateStatus(config.next!)}
            disabled={updating}
            className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : config.nextLabel}
          </button>
        )}
        {['PENDING', 'CONFIRMED'].includes(order.status) && (
          <button
            onClick={cancelOrder}
            disabled={updating}
            className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            Cancelar pedido
          </button>
        )}
      </div>

      {/* Rider tracking map */}
      {order.rider_id && ['PICKED_UP', 'IN_TRANSIT'].includes(order.status) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Seguimiento del repartidor</h2>
          <RiderMap riderId={order.rider_id} />
        </div>
      )}

      {/* Status timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Estado del pedido</h2>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {statusTimeline.map((s, i) => {
              const done = i <= currentStatusIndex
              const cfg = statusConfig[s]
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[72px]">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      done ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 text-center leading-tight ${done ? 'text-indigo-700 font-semibold' : 'text-slate-400'}`}>
                      {cfg?.label || s}
                    </span>
                  </div>
                  {i < statusTimeline.length - 1 && (
                    <div className={`h-0.5 w-6 mx-0.5 flex-shrink-0 ${i < currentStatusIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
          {order.status_history && order.status_history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Historial</p>
              {order.status_history.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="text-slate-400 font-mono">{new Date(h.created_at || h.timestamp).toLocaleString('es-AR')}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusConfig[h.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                    {statusConfig[h.status]?.label || h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order details */}
        <div className="space-y-6">
          {/* Customer info */}
          {(order.customer_name || order.customer_email || order.customer_phone || order.customer) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Cliente</h2>
              <div className="space-y-1 text-sm">
                {(order.customer_name || order.customer?.name) && (
                  <p className="text-slate-800 font-medium">{order.customer_name || order.customer?.name}</p>
                )}
                {(order.customer_email || order.customer?.email) && (
                  <p className="text-slate-500">{order.customer_email || order.customer?.email}</p>
                )}
                {(order.customer_phone || order.customer?.phone) && (
                  <p className="text-slate-500">{order.customer_phone || order.customer?.phone}</p>
                )}
                {order.delivery_address && (
                  <p className="text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-xs">Dirección: </span>{order.delivery_address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Items</h2>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-start justify-between text-sm gap-2">
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">{item.name}</span>
                      {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-slate-500 text-xs">{item.quantity} × ${((item.price || item.unit_price || 0) / 100).toFixed(2)}</p>
                      <p className="font-semibold text-slate-900">${((item.price || item.unit_price || 0) * item.quantity / 100).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin detalle de items</p>
            )}

            {/* Price breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-800">${((order.subtotal || 0) / 100).toFixed(2)}</span>
              </div>
              {(order.delivery_fee !== undefined && order.delivery_fee !== null) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Envío</span>
                  <span className="font-medium text-slate-800">${((order.delivery_fee || 0) / 100).toFixed(2)}</span>
                </div>
              )}
              {(order.platform_fee !== undefined && order.platform_fee !== null) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Comisión plataforma</span>
                  <span className="font-medium text-slate-800">${((order.platform_fee || 0) / 100).toFixed(2)}</span>
                </div>
              )}
              {(order.discount !== undefined && order.discount > 0) && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento</span>
                  <span className="font-medium">-${((order.discount || 0) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">${((order.total || 0) / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
              <p>Creado: {new Date(order.created_at).toLocaleString('es-AR')}</p>
              {order.updated_at && <p>Actualizado: {new Date(order.updated_at).toLocaleString('es-AR')}</p>}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col" style={{ height: '420px' }}>
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Chat con el cliente</h2>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Sin mensajes aún</p>
            ) : messages.map(m => (
              <div key={m.id} className={`flex ${m.sender_role === 'restaurant_owner' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                  m.sender_role === 'restaurant_owner'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                }`}>
                  {m.message}
                  <div className={`text-[10px] mt-1 ${m.sender_role === 'restaurant_owner' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 flex gap-2">
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Escribir mensaje..."
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMsg.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>}>
      <OrderDetailContent />
    </Suspense>
  )
}
