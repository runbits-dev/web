"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type VariantOption = { name: string; priceDelta?: number }
type Variant = { name: string; required?: boolean; options: VariantOption[] }

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  is_available: boolean
  available?: number
  category?: string
  variants_json?: string | null
}

function parseVariants(item: MenuItem): Variant[] {
  if (!item.variants_json) return []
  try { return JSON.parse(item.variants_json) } catch { return [] }
}

function isItemAvailable(item: MenuItem): boolean {
  if (isItemAvailable(item) !== undefined) return isItemAvailable(item)
  if (item.available !== undefined) return item.available === 1
  return true
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; item: MenuItem }

const EMPTY_FORM = { name: '', description: '', price: '', category: '', is_available: true }

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    api.me().then(u => {
      if (u.restaurant_id) {
        setRestaurantId(u.restaurant_id)
        api.getMenu(u.restaurant_id).then(setItems).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setModal({ mode: 'create' })
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description || '',
      price: (item.price / 100).toFixed(2),
      category: item.category || '',
      is_available: isItemAvailable(item),
    })
    setError(null)
    setModal({ mode: 'edit', item })
  }

  async function handleSave() {
    if (!restaurantId) return
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum < 0) { setError('Precio inválido'); return }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Math.round(priceNum * 100),
        category: form.category.trim() || undefined,
        is_available: form.is_available,
      }
      if (modal.mode === 'create') {
        const created = await api.createMenuItem(restaurantId, payload)
        setItems(prev => [...prev, created])
      } else if (modal.mode === 'edit') {
        const updated = await api.updateMenuItem(restaurantId, modal.item.id, payload)
        setItems(prev => prev.map(i => i.id === modal.item.id ? updated : i))
      }
      setModal({ mode: 'closed' })
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: MenuItem) {
    if (!restaurantId) return
    try {
      const updated = await api.updateMenuItem(restaurantId, item.id, { is_available: !isItemAvailable(item) })
      setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    } catch {}
  }

  async function handleDelete(itemId: string) {
    if (!restaurantId) return
    try {
      await api.deleteMenuItem(restaurantId, itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
      setDeleteConfirm(null)
    } catch {}
  }

  const isOpen = modal.mode !== 'closed'

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menú</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} productos</p>
        </div>
        {restaurantId && (
          <button
            onClick={openCreate}
            className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
          >
            + Agregar producto
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : !restaurantId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-700 text-sm">Tu cuenta no tiene un restaurante asociado aún.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <p className="text-slate-400 text-sm">No hay productos en el menú</p>
          <button onClick={openCreate} className="mt-4 text-sm text-slate-900 font-semibold underline">Agregar el primero</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{item.name}</p>
                {item.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{item.description}</p>}
                {item.category && <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-slate-900">${(item.price / 100).toFixed(2)}</span>
                <button
                  onClick={() => handleToggle(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isItemAvailable(item)
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {isItemAvailable(item) ? 'Disponible' : 'No disponible'}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-5">
              {modal.mode === 'create' ? 'Agregar producto' : 'Editar producto'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre *</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Hamburguesa clásica"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Descripción</label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Precio ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Categoría</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="Ej: Principales"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={form.is_available}
                  onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="is_available" className="text-sm text-slate-700">Disponible para pedidos</label>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal({ mode: 'closed' })}
                className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="font-semibold text-slate-900 mb-2">¿Eliminar producto?</p>
            <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
