"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Info, Sparkles, ChevronRight } from 'lucide-react'

type Coupon = { id: string; code: string; discount_type: string; discount_value: number; min_order: number; max_uses: number; used_count: number; expires_at: string | null; restaurant_id: string }
type Promotion = { id: string; name?: string; title?: string; description?: string; type?: string; config?: string | Record<string, any>; discount_type?: string; discount_value?: number; starts_at: string | number; ends_at: string | number; restaurant_id: string; active?: number; is_active?: boolean }

export default function MarketingPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [tab, setTab] = useState<'coupons' | 'promotions'>('coupons')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Coupon form
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxUses, setMaxUses] = useState('')

  // Promotion form
  const [promoTitle, setPromoTitle] = useState('')
  const [promoDesc, setPromoDesc] = useState('')
  const [promoDiscountType, setPromoDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [promoDiscountValue, setPromoDiscountValue] = useState('')
  const [promoStart, setPromoStart] = useState('')
  const [promoEnd, setPromoEnd] = useState('')

  useEffect(() => {
    api.me().then(u => {
      if (u.restaurant_id) {
        setRestaurantId(u.restaurant_id)
        Promise.all([
          api.getCoupons(u.restaurant_id).catch(() => []),
          api.getAllPromotions(u.restaurant_id).catch(() => []),
        ]).then(([c, p]) => { setCoupons(Array.isArray(c) ? c : []); setPromotions(Array.isArray(p) ? p : []) })
          .catch(() => {})
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function createCoupon() {
    if (!restaurantId || !code.trim() || !discountValue) return
    setSaving(true)
    try {
      const c = await api.createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrder: minOrder ? Number(minOrder) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        restaurantId,
      })
      setCoupons(prev => [...prev, c])
      setShowForm(false)
      setCode(''); setDiscountValue(''); setMinOrder(''); setMaxUses('')
    } catch {} finally { setSaving(false) }
  }

  async function deleteCoupon(id: string) {
    try {
      await api.deleteCoupon(id)
      setCoupons(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  async function createPromotion() {
    if (!restaurantId || !promoTitle.trim() || !promoDiscountValue || !promoStart || !promoEnd) return
    setSaving(true)
    try {
      const p = await api.createPromotion({
        title: promoTitle.trim(),
        description: promoDesc.trim(),
        discountType: promoDiscountType,
        discountValue: Number(promoDiscountValue),
        startsAt: promoStart,
        endsAt: promoEnd,
        restaurantId,
      })
      setPromotions(prev => [...prev, p])
      setShowForm(false)
      setPromoTitle(''); setPromoDesc(''); setPromoDiscountValue(''); setPromoStart(''); setPromoEnd('')
    } catch {} finally { setSaving(false) }
  }

  async function deletePromotion(id: string) {
    try {
      await api.deletePromotion(id)
      setPromotions(prev => prev.filter(p => p.id !== id))
    } catch {}
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
  if (!restaurantId) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
      <p className="text-amber-700 text-sm">Tu cuenta no tiene un restaurante asociado aún.</p>
    </div>
  )

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
          <p className="text-slate-500 text-sm mt-1">Cupones y promociones para tus clientes</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm) }}
          className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
        >
          + {tab === 'coupons' ? 'Nuevo cupón' : 'Nueva promo'}
        </button>
      </div>

      {/* Featured slots CTA */}
      <Link
        href="/dashboard/marketing/featured"
        className="block bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6 hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Slots destacados (marketplace)</p>
              <p className="text-xs text-slate-500 mt-0.5">Promocioná tus items en el marketplace de Runbits para multiplicar tu alcance.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
        </div>
      </Link>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab('coupons'); setShowForm(false) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'coupons' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Cupones ({coupons.length})
        </button>
        <button
          onClick={() => { setTab('promotions'); setShowForm(false) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'promotions' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Promociones ({promotions.length})
        </button>
      </div>

      {/* Create form */}
      {showForm && tab === 'coupons' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            <Info className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Un <strong>cupón</strong> es un código que tus clientes ingresan al hacer un pedido para obtener un descuento. Ej: "BIENVENIDO" para un 10% off en la primera compra.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Código *</label>
              <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="DESCUENTO20" value={code} onChange={e => setCode(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Lo que el cliente escribe para activar el descuento. Sin espacios, en mayúsculas.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipo de descuento</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">{discountType === 'percentage' ? 'Ej: 20 = 20% de descuento sobre el total' : 'Ej: 500 = $500 de descuento sobre el total'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Valor del descuento *</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder={discountType === 'percentage' ? '20' : '500'} value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">{discountType === 'percentage' ? 'Porcentaje a descontar (sin el símbolo %)' : 'Monto en pesos a descontar'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Pedido mínimo ($)</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="0" value={minOrder} onChange={e => setMinOrder(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">El cliente necesita un pedido mayor a este monto para usar el cupón. Dejá en 0 para sin mínimo.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createCoupon} disabled={saving} className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700">
              {saving ? 'Guardando...' : 'Crear cupón'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500">Cancelar</button>
          </div>
        </div>
      )}

      {showForm && tab === 'promotions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            <Info className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Una <strong>promoción</strong> es una oferta visible en tu tienda con fecha de inicio y fin. Los clientes la ven automáticamente sin necesidad de ingresar un código. Ideal para happy hour, ofertas del día, o temporadas.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Título *</label>
              <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Happy Hour -30%" value={promoTitle} onChange={e => setPromoTitle(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">El nombre que ven tus clientes en la tienda. Que sea claro y atractivo.</p>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Descripción</label>
              <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="30% off en hamburguesas de 18 a 21hs" value={promoDesc} onChange={e => setPromoDesc(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Detalle de la oferta. Qué productos aplica, condiciones, etc.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipo de descuento</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={promoDiscountType} onChange={e => setPromoDiscountType(e.target.value as any)}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">{promoDiscountType === 'percentage' ? 'Descuento en porcentaje sobre el total del pedido' : 'Monto fijo que se descuenta del total'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Valor del descuento *</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={promoDiscountValue} onChange={e => setPromoDiscountValue(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">{promoDiscountType === 'percentage' ? 'Ej: 30 = 30% off' : 'Ej: 1000 = $1000 de descuento'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Fecha y hora de inicio *</label>
              <input type="datetime-local" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={promoStart} onChange={e => setPromoStart(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Cuándo empieza a verse la promoción en tu tienda</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Fecha y hora de fin *</label>
              <input type="datetime-local" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={promoEnd} onChange={e => setPromoEnd(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Cuándo deja de verse. Después de esta fecha se desactiva sola.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createPromotion} disabled={saving} className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700">
              {saving ? 'Guardando...' : 'Crear promoción'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500">Cancelar</button>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === 'coupons' && (
        <div className="space-y-3">
          {coupons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <p className="text-slate-400 text-sm">No hay cupones. Creá el primero para atraer clientes.</p>
            </div>
          ) : coupons.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-slate-900 text-lg">{c.code}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `$${c.discount_value} off`}
                  {c.min_order > 0 && ` · mín $${c.min_order}`}
                  {c.max_uses > 0 && ` · ${c.used_count}/${c.max_uses} usos`}
                </p>
              </div>
              <button onClick={() => deleteCoupon(c.id)} className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50">Eliminar</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'promotions' && (
        <div className="space-y-3">
          {promotions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <p className="text-slate-400 text-sm">No hay promociones activas.</p>
            </div>
          ) : promotions.map(p => {
            const config = typeof p.config === 'string' ? JSON.parse(p.config) : (p.config || {})
            return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{p.name || p.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {config.discountType === 'percentage' ? `${config.discountValue}% off` : `$${config.discountValue} off`}
                  {config.description && ` · ${config.description}`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(p.starts_at).toLocaleDateString('es-AR')} → {new Date(p.ends_at).toLocaleDateString('es-AR')}
                </p>
              </div>
              <button onClick={() => deletePromotion(p.id)} className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50">Eliminar</button>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
