"use client"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'
import { Package, Clock, Loader2 } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  PENDING:          { label: 'Pendiente',      color: 'bg-amber-50 text-amber-700 ring-amber-200',    next: 'CONFIRMED',        nextLabel: 'Confirmar' },
  CONFIRMED:        { label: 'Confirmado',     color: 'bg-blue-50 text-blue-700 ring-blue-200',       next: 'PREPARING',        nextLabel: 'Preparar' },
  PREPARING:        { label: 'Preparando',     color: 'bg-indigo-50 text-indigo-700 ring-indigo-200', next: 'READY_FOR_PICKUP', nextLabel: 'Listo' },
  READY_FOR_PICKUP: { label: 'Listo',          color: 'bg-teal-50 text-teal-700 ring-teal-200' },
  PICKED_UP:        { label: 'Retirado',       color: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  IN_TRANSIT:       { label: 'En camino',      color: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELIVERED:        { label: 'Entregado',      color: 'bg-green-50 text-green-700 ring-green-200',   next: 'COMPLETED',        nextLabel: 'Completar' },
  COMPLETED:        { label: 'Completado',     color: 'bg-green-50 text-green-800 ring-green-200' },
  CANCELLED:        { label: 'Cancelado',      color: 'bg-red-50 text-red-700 ring-red-200' },
}

const statusTabs = [
  { id: 'active', label: 'Activos', statuses: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] },
  { id: 'completed', label: 'Completados', statuses: ['COMPLETED'] },
  { id: 'cancelled', label: 'Cancelados', statuses: ['CANCELLED'] },
  { id: 'all', label: 'Todos', statuses: [] },
]

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    gain.gain.value = 0.3
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  } catch {}
}

export default function StoreOrdersPage() {
  const { activeProfile } = useProfile()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [updating, setUpdating] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [newOrderToast, setNewOrderToast] = useState(false)
  const prevOrderCountRef = useRef<number | null>(null)

  const storeId = activeProfile?.store_id

  async function loadOrders() {
    if (!storeId) { setLoading(false); return }
    const params: Record<string, string> = { restaurantId: storeId }
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    try {
      const res: any = await api.getOrders(params)
      const data: any[] = res.data || res || []
      setOrders(data)
      return data
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
    return null
  }

  useEffect(() => {
    loadOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  // Polling for new orders every 30 seconds
  useEffect(() => {
    if (!storeId) return
    const interval = setInterval(async () => {
      const params: Record<string, string> = { restaurantId: storeId }
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      try {
        const res: any = await api.getOrders(params)
        const data: any[] = res.data || res || []
        const newPendingCount = data.filter((o: any) => o.status === 'PENDING').length
        const prevCount = prevOrderCountRef.current

        if (prevCount !== null && data.length > prevCount) {
          const prevIds = new Set(orders.map((o: any) => o.id))
          const hasNewPending = data.some((o: any) => o.status === 'PENDING' && !prevIds.has(o.id))
          if (hasNewPending) {
            playNotificationSound()
            setNewOrderToast(true)
            setTimeout(() => setNewOrderToast(false), 5000)
          }
        }

        prevOrderCountRef.current = data.length
        setOrders(data)
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, dateFrom, dateTo, orders])

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`https://api.runbits.dev/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch {}
    setUpdating(null)
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('¿Cancelar este pedido?')) return
    await updateStatus(orderId, 'CANCELLED')
  }

  const activeTab = statusTabs.find(t => t.id === tab)!
  const filtered = activeTab.statuses.length > 0
    ? orders.filter(o => activeTab.statuses.includes(o.status))
    : orders

  const pendingCount = orders.filter(o => o.status === 'PENDING').length

  return (
    <div>
      {/* New order toast */}
      {newOrderToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-lg animate-bounce">
          <Clock className="w-5 h-5" />
          <span className="font-semibold text-sm">Nuevo pedido pendiente!</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
          <p className="text-slate-500 text-sm mt-1">{orders.length} pedidos en total</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{pendingCount} pendientes</span>
          </div>
        )}
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
        />
        <button
          onClick={loadOrders}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          Filtrar
        </button>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {statusTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No hay pedidos {tab !== 'all' ? `${activeTab.label.toLowerCase()}` : ''}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(o => {
              const config = statusConfig[o.status] || { label: o.status, color: 'bg-slate-100 text-slate-600 ring-slate-200' }
              return (
                <div key={o.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <a href={`/dashboard/orders/detail?id=${o.id}`} className="font-mono text-xs text-indigo-600 hover:underline">
                          #{o.id.slice(0,8)}
                        </a>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(o.created_at).toLocaleString('es-AR')}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">${(o.total / 100).toFixed(2)}</span>
                      {config.next && (
                        <button
                          onClick={() => updateStatus(o.id, config.next!)}
                          disabled={updating === o.id}
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {updating === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : config.nextLabel}
                        </button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(o.status) && (
                        <button onClick={() => cancelOrder(o.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
