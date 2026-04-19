"use client"

import { useState } from 'react'
import { UtensilsCrossed, ShoppingBag, ShoppingCart, Heart, Briefcase, Scissors, PawPrint, Car, Package, type LucideIcon } from 'lucide-react'

type BType = { id: string; label: string; Icon: LucideIcon; desc: string; examples: string }

const BUSINESS_TYPES: BType[] = [
  { id: 'restaurant', label: 'Restaurante / Comida', Icon: UtensilsCrossed, desc: 'Restaurantes, bares, cafés, heladerías, panaderías.', examples: 'Ej: pizzería, hamburguesería, sushi' },
  { id: 'store', label: 'Tienda / Retail', Icon: ShoppingBag, desc: 'Ropa, electrónica, accesorios, librerías.', examples: 'Ej: boutique, ferretería, bazar' },
  { id: 'grocery', label: 'Supermercado / Almacén', Icon: ShoppingCart, desc: 'Alimentos, bebidas, productos del hogar.', examples: 'Ej: almacén, dietética, vinoteca' },
  { id: 'pharmacy', label: 'Farmacia / Salud', Icon: Heart, desc: 'Farmacias, perfumerías, productos de salud.', examples: 'Ej: farmacia, herboristería, óptica' },
  { id: 'services', label: 'Servicios profesionales', Icon: Briefcase, desc: 'Servicios por turno o consulta.', examples: 'Ej: consultorio, estudio contable, clases' },
  { id: 'beauty', label: 'Belleza / Estética', Icon: Scissors, desc: 'Peluquerías, barberías, spa, estética.', examples: 'Ej: peluquería, salón de uñas, masajes' },
  { id: 'pets', label: 'Mascotas', Icon: PawPrint, desc: 'Pet shops, veterinarias, peluquerías caninas.', examples: 'Ej: veterinaria, tienda de alimento' },
  { id: 'transport', label: 'Transporte / Logística', Icon: Car, desc: 'Transporte de personas o mercadería.', examples: 'Ej: remisería, fletes, mensajería' },
  { id: 'other', label: 'Otro tipo de negocio', Icon: Package, desc: 'Cualquier negocio que no encaje arriba.', examples: 'Ej: lavadero, gimnasio, coworking' },
]

export function BusinessSetup({ onComplete }: { onComplete: (type: string) => void }) {
  const [selected, setSelected] = useState('')

  return (
    <div className="fixed inset-0 bg-white z-[80] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">¿Qué tipo de negocio tenés?</h1>
          <p className="text-sm text-gray-500 mt-2">Esto nos permite adaptar tu panel a tus necesidades. Podés cambiarlo después.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {BUSINESS_TYPES.map(bt => (
            <button
              key={bt.id}
              onClick={() => setSelected(bt.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selected === bt.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <bt.Icon className={`w-6 h-6 ${selected === bt.id ? 'text-emerald-600' : 'text-gray-400'}`} />
              <p className="text-xs font-semibold text-gray-900 mt-2">{bt.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{bt.desc}</p>
              <p className="text-[9px] text-gray-300 mt-0.5">{bt.examples}</p>
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
