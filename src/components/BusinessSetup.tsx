"use client"

import { useState, useEffect } from 'react'

const BUSINESS_TYPES = [
  { id: 'restaurant', label: 'Restaurante / Comida', icon: '🍽️', desc: 'Delivery de comida, café, bar, heladería' },
  { id: 'store', label: 'Tienda / Retail', icon: '🛍️', desc: 'Ropa, electrónica, accesorios' },
  { id: 'grocery', label: 'Supermercado / Almacén', icon: '🛒', desc: 'Alimentos, bebidas, hogar' },
  { id: 'pharmacy', label: 'Farmacia / Salud', icon: '💊', desc: 'Medicamentos, perfumería' },
  { id: 'services', label: 'Servicios profesionales', icon: '💼', desc: 'Turnos, consultas, reparaciones' },
  { id: 'beauty', label: 'Belleza / Estética', icon: '💇', desc: 'Peluquería, spa, barbería' },
  { id: 'pets', label: 'Mascotas', icon: '🐾', desc: 'Pet shop, veterinaria' },
  { id: 'transport', label: 'Transporte / Viajes', icon: '🚗', desc: 'Viajes, remises, fletes' },
  { id: 'other', label: 'Otro', icon: '📦', desc: 'Cualquier otro tipo' },
]

export function BusinessSetup({ onComplete }: { onComplete: (type: string) => void }) {
  const [selected, setSelected] = useState('')

  return (
    <div className="fixed inset-0 bg-white z-[80] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">¿Qué tipo de negocio tenés?</h1>
          <p className="text-sm text-gray-500 mt-2">Esto nos permite adaptar tu panel a tus necesidades. Podés cambiarlo después.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {BUSINESS_TYPES.map(bt => (
            <button
              key={bt.id}
              onClick={() => setSelected(bt.id)}
              className={`text-center p-4 rounded-xl border-2 transition-all ${
                selected === bt.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl block">{bt.icon}</span>
              <p className="text-xs font-semibold text-gray-900 mt-2">{bt.label}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (!selected) return
            localStorage.setItem('business_type', selected)
            onComplete(selected)
          }}
          disabled={!selected}
          className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

// Nav items per business type
export function getNavForBusinessType(type: string) {
  const common = [
    { href: '/dashboard', label: 'Inicio', iconName: 'Home', exact: true, tour: 'home' },
    { href: '/dashboard/stats', label: 'Estadísticas', iconName: 'BarChart3', tour: 'stats' },
    { href: '/dashboard/marketing', label: 'Marketing', iconName: 'Megaphone', tour: 'marketing' },
    { href: '/dashboard/subscription', label: 'Suscripción', iconName: 'CreditCard', tour: 'subscription' },
    { href: '/dashboard/settings', label: 'Configuración', iconName: 'Settings', tour: 'settings' },
  ]

  switch (type) {
    case 'restaurant':
    case 'grocery':
    case 'pharmacy':
      return [
        common[0],
        { href: '/dashboard/menu', label: 'Menú', iconName: 'ShoppingBag', tour: 'menu' },
        { href: '/dashboard/orders', label: 'Pedidos', iconName: 'PackageCheck', tour: 'orders' },
        ...common.slice(1),
      ]
    case 'store':
    case 'pets':
      return [
        common[0],
        { href: '/dashboard/menu', label: 'Productos', iconName: 'ShoppingBag', tour: 'menu' },
        { href: '/dashboard/orders', label: 'Pedidos', iconName: 'PackageCheck', tour: 'orders' },
        ...common.slice(1),
      ]
    case 'services':
    case 'beauty':
      return [
        common[0],
        { href: '/dashboard/menu', label: 'Servicios', iconName: 'ShoppingBag', tour: 'menu' },
        { href: '/dashboard/orders', label: 'Reservas', iconName: 'PackageCheck', tour: 'orders' },
        ...common.slice(1),
      ]
    case 'transport':
      return [
        common[0],
        { href: '/dashboard/menu', label: 'Servicios', iconName: 'ShoppingBag', tour: 'menu' },
        { href: '/dashboard/orders', label: 'Viajes', iconName: 'PackageCheck', tour: 'orders' },
        ...common.slice(1),
      ]
    default:
      return [
        common[0],
        { href: '/dashboard/menu', label: 'Catálogo', iconName: 'ShoppingBag', tour: 'menu' },
        { href: '/dashboard/orders', label: 'Pedidos', iconName: 'PackageCheck', tour: 'orders' },
        ...common.slice(1),
      ]
  }
}
