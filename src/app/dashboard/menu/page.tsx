"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ImagePlus, Sparkles, Loader2, Wand2 } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { getTemplatesForBusinessType, getNamePlaceholder, type ItemTemplate } from '@/components/ItemTemplates'
import OptimizedImage from '@/components/OptimizedImage'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

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
  image_key?: string | null
}

function parseVariants(item: MenuItem): Variant[] {
  if (!item.variants_json) return []
  try { return JSON.parse(item.variants_json) } catch { return [] }
}

function isItemAvailable(item: MenuItem): boolean {
  if (item.is_available !== undefined) return item.is_available
  if (item.available !== undefined) return item.available === 1
  return true
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; item: MenuItem }

const CATEGORY_PRESETS: Record<string, string[]> = {
  restaurant: ['Entradas', 'Principales', 'Acompañamientos', 'Postres', 'Bebidas', 'Combos', 'Promociones'],
  store: ['Destacados', 'Nuevos', 'Ofertas', 'Accesorios', 'Indumentaria', 'Electrónica'],
  grocery: ['Frutas y verduras', 'Lácteos', 'Carnes', 'Panadería', 'Bebidas', 'Limpieza', 'Congelados'],
  pharmacy: ['Medicamentos', 'Perfumería', 'Cuidado personal', 'Bebés', 'Suplementos'],
  services: ['Consultas', 'Turnos', 'Paquetes', 'Urgencias'],
  beauty: ['Cortes', 'Color', 'Tratamientos', 'Manos y pies', 'Depilación'],
  pets: ['Alimento', 'Accesorios', 'Higiene', 'Juguetes', 'Salud'],
  transport: ['Viajes', 'Fletes', 'Encomiendas'],
  other: ['General', 'Destacados', 'Ofertas'],
}

// Map dashboard business_type → catalog v2 kind + UI labels. We keep the
// route at /dashboard/menu (existing nav target) but the page label adapts
// to whatever the active profile sells.
const BUSINESS_TYPE_LABELS: Record<string, { pageTitle: string; itemPlural: string; addLabel: string }> = {
  restaurant: { pageTitle: 'Menú', itemPlural: 'productos', addLabel: '+ Agregar producto' },
  store:      { pageTitle: 'Catálogo', itemPlural: 'productos', addLabel: '+ Agregar producto' },
  grocery:    { pageTitle: 'Catálogo', itemPlural: 'productos', addLabel: '+ Agregar producto' },
  pharmacy:   { pageTitle: 'Catálogo', itemPlural: 'productos', addLabel: '+ Agregar producto' },
  services:   { pageTitle: 'Servicios', itemPlural: 'servicios', addLabel: '+ Agregar servicio' },
  beauty:     { pageTitle: 'Servicios', itemPlural: 'servicios', addLabel: '+ Agregar servicio' },
  pets:       { pageTitle: 'Catálogo', itemPlural: 'productos', addLabel: '+ Agregar producto' },
  transport:  { pageTitle: 'Servicios', itemPlural: 'servicios', addLabel: '+ Agregar servicio' },
  other:      { pageTitle: 'Catálogo', itemPlural: 'items', addLabel: '+ Agregar item' },
}

const EMPTY_FORM = { name: '', description: '', price: '', category: '', is_available: true, imagePreview: '' }

export default function MenuPage() {
  const { activeProfile } = useProfile()
  const storeId = activeProfile?.store_id
  const businessType = activeProfile?.business_type
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const bt = activeProfile?.business_type ?? 'other'
  const presetCats = CATEGORY_PRESETS[bt] || CATEGORY_PRESETS.other
  const existingCats = [...new Set(items.map(i => i.category).filter(Boolean))]
  const allCategories = [...new Set([...presetCats, ...existingCats])]

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
    setSelectedFile(null)
    setError(null)
    setModal({ mode: 'create' })
  }

  function applyTemplate(tpl: ItemTemplate) {
    setForm({
      name: tpl.name,
      description: tpl.description,
      price: tpl.price.toFixed(2),
      category: tpl.category ?? '',
      is_available: true,
      imagePreview: '',
    })
    setSelectedFile(null)
    setError(null)
    setModal({ mode: 'create' })
  }

  const templates = getTemplatesForBusinessType(businessType)

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description || '',
      price: (item.price / 100).toFixed(2),
      category: item.category || '',
      is_available: isItemAvailable(item),
      imagePreview: item.image_key ? `https://runbits-storage.r2.dev/${item.image_key}` : '',
    })
    setSelectedFile(null)
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
      let imageKey = (modal.mode === 'edit' ? modal.item.image_key : null) ?? null
      if (selectedFile && storeId) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const token = localStorage.getItem('token')
        const uploadRes = await fetch(`${API_BASE}/api/stores/${storeId}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        })
        if (uploadRes.ok) {
          const { key } = await uploadRes.json()
          imageKey = key
        }
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Math.round(priceNum * 100),
        category: form.category.trim() || undefined,
        is_available: form.is_available,
        image_key: imageKey ?? undefined,
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

  async function generateDescription() {
    if (!form.name) return
    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/stores/${storeId}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, category: form.category, type: businessType }),
      })
      const data = await res.json()
      if (data.description) setForm(f => ({ ...f, description: data.description }))
    } catch {}
    setGenerating(false)
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
      <div className="mb-8 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{BUSINESS_TYPE_LABELS[bt]?.pageTitle ?? 'Catálogo'}</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} {BUSINESS_TYPE_LABELS[bt]?.itemPlural ?? 'items'}</p>
        </div>
        {restaurantId && (
          <div className="flex items-center gap-2">
            {templates.length > 0 && items.length > 0 && (
              <details className="relative">
                <summary className="list-none cursor-pointer bg-white border border-slate-200 text-slate-700 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                  <span>Templates</span>
                </summary>
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-2 max-h-72 overflow-y-auto">
                  {templates.map(tpl => (
                    <button
                      key={tpl.label}
                      onClick={() => applyTemplate(tpl)}
                      className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <p className="text-xs font-semibold text-slate-900">{tpl.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </details>
            )}
            <button
              onClick={openCreate}
              className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
            >
              {BUSINESS_TYPE_LABELS[bt]?.addLabel ?? '+ Agregar item'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : !restaurantId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-700 text-sm">Tu cuenta no tiene un restaurante asociado aún.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12">
          <div className="text-center">
            <p className="text-slate-700 font-semibold">Empezá con un template</p>
            <p className="text-slate-400 text-sm mt-1">Elegí uno y editalo a tu gusto. O empezá de cero.</p>
          </div>
          {templates.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
              {templates.map(tpl => (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  className="text-left p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  <Wand2 className="w-4 h-4 text-indigo-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-900">{tpl.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold mt-1">${tpl.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
          <div className="text-center mt-6">
            <button onClick={openCreate} className="text-sm text-slate-900 font-semibold underline">
              Empezar de cero
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
              {item.image_key ? (
                <OptimizedImage src={`https://runbits-storage.r2.dev/${item.image_key}`} alt={item.name} width={96} widths={[96, 192]} sizes="48px" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : null}
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
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
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
                  placeholder={getNamePlaceholder(businessType)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600">Descripción</label>
                  <button type="button" onClick={generateDescription} disabled={generating || !form.name}
                    className="text-xs text-indigo-600 font-medium hover:underline disabled:opacity-50 flex items-center gap-1">
                    {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {generating ? 'Generando...' : 'Generar con IA'}
                  </button>
                </div>
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
                  <select
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={form.category}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        const custom = prompt('Nombre de la nueva categoría:')
                        if (custom) setForm(f => ({ ...f, category: custom.trim() }))
                      } else {
                        setForm(f => ({ ...f, category: e.target.value }))
                      }
                    }}
                  >
                    <option value="">Sin categoría</option>
                    {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="__custom__">+ Crear nueva categoría...</option>
                  </select>
                </div>
              </div>
              {/* Photo upload */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Foto del producto</label>
                <div className="flex items-center gap-3">
                  {form.imagePreview ? (
                    <img src={form.imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400"><ImagePlus className="w-6 h-6" /></div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedFile(file)
                          const reader = new FileReader()
                          reader.onload = () => setForm(f => ({ ...f, imagePreview: reader.result as string }))
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG o WebP. Máximo 5MB.</p>
                  </div>
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
