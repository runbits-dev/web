"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Package, X, ChevronRight } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING:          { label: 'Pendiente',   color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  CONFIRMED:        { label: 'Confirmado',  color: 'bg-blue-50 text-blue-700 ring-blue-200' },
  PREPARING:        { label: 'Preparando',  color: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  READY_FOR_PICKUP: { label: 'Listo',       color: 'bg-teal-50 text-teal-700 ring-teal-200' },
  PICKED_UP:        { label: 'Retirado',    color: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  IN_TRANSIT:       { label: 'En camino',   color: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELIVERED:        { label: 'Entregado',   color: 'bg-green-50 text-green-700 ring-green-200' },
  COMPLETED:        { label: 'Completado',  color: 'bg-green-50 text-green-800 ring-green-200' },
  CANCELLED:        { label: 'Cancelado',   color: 'bg-red-50 text-red-700 ring-red-200' },
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PREPARING', label: 'Preparando' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const STATUS_TIMELINE_ORDER = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
  'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED',
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  async function loadOrders() {
    setLoading(true)
    const params: Record<string, string> = {}
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (storeSearch.trim()) params.storeName = storeSearch.trim()
    try {
      const res = await api.getAdminOrders(params)
      setOrders((res as any).data || [])
      setTotal((res as any).total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOrders = orders.filter(o => {
    const matchesStore = !storeSearch.trim() ||
      (o.store_name || o.restaurant_name || '').toLowerCase().includes(storeSearch.toLowerCase())
    const matchesStatus = !statusFilter || o.status === statusFilter
    return matchesStore && matchesStatus
  })

  function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-600 ring-slate-200' }
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${cfg.color}`}>
        {cfg.label}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
        <p className="text-slate-500 text-sm mt-1">{total} pedidos en total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por comercio..."
          value={storeSearch}
          onChange={e => setStoreSearch(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
        >
          {STATUS_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
        {(dateFrom || dateTo || storeSearch || statusFilter) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setStoreSearch(''); setStatusFilter('') }}
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Orders table */}
        <div className={`${selectedOrder ? 'w-1/2' : 'w-full'} transition-all`}>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No hay pedidos</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">ID</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Comercio</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Items</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Total</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => {
                    const cfg = statusConfig[o.status] || { label: o.status, color: 'bg-slate-100 text-slate-600 ring-slate-200' }
                    const itemCount = Array.isArray(o.items) ? o.items.length : (o.item_count ?? '—')
                    const storeName = o.store_name || o.restaurant_name
                    const isSelected = selectedOrder?.id === o.id
                    return (
                      <tr key={o.id}
                        onClick={() => setSelectedOrder(isSelected ? null : o)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">#{o.id.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                          {storeName
                            ? <span className="text-slate-700 font-medium">{storeName}</span>
                            : <span className="text-slate-400">—</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">{itemCount}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">${((o.total || 0) / 100).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Order detail panel */}
        {selectedOrder && (
          <div className="w-1/2">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 font-mono">#{selectedOrder.id.slice(0, 8)}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(selectedOrder.created_at).toLocaleString('es-AR')}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-4">
                <StatusBadge status={selectedOrder.status} />
              </div>

              {/* Store */}
              {(selectedOrder.store_name || selectedOrder.restaurant_name) && (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Comercio</p>
                  <p className="text-sm font-medium text-slate-800">{selectedOrder.store_name || selectedOrder.restaurant_name}</p>
                </div>
              )}

              {/* Customer */}
              {(selectedOrder.customer_name || selectedOrder.customer_email || selectedOrder.user_name) && (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Cliente</p>
                  <p className="text-sm font-medium text-slate-800">{selectedOrder.customer_name || selectedOrder.user_name}</p>
                  {selectedOrder.customer_email && <p className="text-xs text-slate-500">{selectedOrder.customer_email}</p>}
                  {selectedOrder.delivery_address && <p className="text-xs text-slate-500 mt-1">{selectedOrder.delivery_address}</p>}
                </div>
              )}

              {/* Items */}
              {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Items</p>
                  <div className="space-y-1.5">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono w-5">{item.quantity || 1}×</span>
                          <span className="text-sm text-slate-700">{item.name || item.product_name || `Item ${i + 1}`}</span>
                        </div>
                        {item.price != null && (
                          <span className="text-xs font-semibold text-slate-800">${((item.price * (item.quantity || 1)) / 100).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price breakdown */}
              <div className="mb-4 border border-slate-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Desglose de precio</p>
                <div className="space-y-1">
                  {selectedOrder.subtotal != null && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.subtotal / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_fee != null && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Envío</span>
                      <span>${(selectedOrder.delivery_fee / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount != null && selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>-${(selectedOrder.discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total</span>
                    <span>${((selectedOrder.total || 0) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              {Array.isArray(selectedOrder.status_history) && selectedOrder.status_history.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Historial de estado</p>
                  <div className="space-y-2">
                    {selectedOrder.status_history.map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <div>
                          <StatusBadge status={h.status} />
                          {h.created_at && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(h.created_at).toLocaleString('es-AR')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Estado actual</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {STATUS_TIMELINE_ORDER.map((s, i) => {
                      const reached = STATUS_TIMELINE_ORDER.indexOf(selectedOrder.status) >= i
                      const isCurrent = selectedOrder.status === s
                      if (selectedOrder.status === 'CANCELLED' && s !== 'CANCELLED') return null
                      const cfg = statusConfig[s]
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 transition-all
                            ${isCurrent ? cfg?.color || 'bg-slate-100 text-slate-600 ring-slate-200' :
                              reached ? 'bg-green-50 text-green-600 ring-green-200' :
                              'bg-slate-50 text-slate-300 ring-slate-100'}`}>
                            {cfg?.label || s}
                          </span>
                          {i < STATUS_TIMELINE_ORDER.length - 1 && <span className="text-slate-200 text-xs">›</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
