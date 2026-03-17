"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { api, type User } from '@/lib/api'

const storeNav = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠', exact: true },
  { href: '/dashboard/menu', label: 'Menú', icon: '🍽️' },
  { href: '/dashboard/orders', label: 'Pedidos', icon: '📦' },
  { href: '/dashboard/stats', label: 'Estadísticas', icon: '📊' },
  { href: '/dashboard/settings', label: 'Configuración', icon: '⚙️' },
]

const adminNav = [
  { href: '/dashboard/admin', label: 'Overview', icon: '📈', exact: true },
  { href: '/dashboard/admin/zones', label: 'Zonas', icon: '🗺️' },
  { href: '/dashboard/admin/restaurants', label: 'Restaurantes', icon: '🍽️' },
  { href: '/dashboard/admin/riders', label: 'Repartidores', icon: '🚴' },
  { href: '/dashboard/admin/orders', label: 'Pedidos', icon: '📦' },
  { href: '/dashboard/admin/agents', label: 'Agentes', icon: '👥' },
  { href: '/dashboard/admin/commissions', label: 'Comisiones', icon: '💰' },
  { href: '/dashboard/admin/payouts', label: 'Pagos', icon: '💸' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    api.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem('token'); router.push('/login') })
      .finally(() => setLoading(false))
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    )
  }

  const isSuperAdmin = user?.role === 'superadmin'
  const isAdminSection = pathname.startsWith('/dashboard/admin')
  const nav = isAdminSection ? adminNav : storeNav

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <span className="logo-runbits text-lg">runbits</span>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSuperAdmin ? 'superadmin' : (user?.store_name || 'panel')}
          </p>
        </div>

        {isSuperAdmin && (
          <div className="px-4 pt-4 flex gap-2">
            <Link href="/dashboard"
              className={`flex-1 text-center text-xs py-2 rounded-lg font-medium transition-colors ${
                !isAdminSection ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              Mi comercio
            </Link>
            <Link href="/dashboard/admin"
              className={`flex-1 text-center text-xs py-2 rounded-lg font-medium transition-colors ${
                isAdminSection ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              Admin
            </Link>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-medium text-slate-700 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="ml-64 p-8">
        <div className="max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
