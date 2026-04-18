"use client"

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

type Message = { id: string; sender_id: string; sender_role: string; message: string; created_at: number }

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PREPARING: 'bg-indigo-50 text-indigo-700',
  PICKED_UP: 'bg-purple-50 text-purple-700',
  IN_TRANSIT: 'bg-cyan-50 text-cyan-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-green-50 text-green-800',
  CANCELLED: 'bg-red-50 text-red-700',
}

function OrderDetailContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
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

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
  if (!order) return <div className="p-8 text-center text-slate-400 text-sm">Pedido no encontrado</div>

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/orders" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">← Volver a pedidos</Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">Pedido #{order.id?.slice(0, 8)}</h1>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[order.status] || 'bg-slate-100 text-slate-600'}`}>{order.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Detalle</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">${((order.subtotal || 0) / 100).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="font-medium">${((order.delivery_fee || 0) / 100).toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2"><span className="font-semibold">Total</span><span className="font-bold text-lg">${((order.total || 0) / 100).toFixed(2)}</span></div>
          </div>
          {order.items && order.items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Items</h3>
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-slate-500">${((item.price * item.quantity) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
            <p>Creado: {new Date(order.created_at).toLocaleString('es-AR')}</p>
            {order.updated_at && <p>Actualizado: {new Date(order.updated_at).toLocaleString('es-AR')}</p>}
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
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                }`}>
                  {m.message}
                  <div className={`text-[10px] mt-1 ${m.sender_role === 'restaurant_owner' ? 'text-emerald-200' : 'text-slate-400'}`}>
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
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMsg.trim()}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
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
