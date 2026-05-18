"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { api, type User } from '@/lib/api'
import { ProfileProvider, useProfile } from '@/context/ProfileContext'
import { UserProvider, useUser } from '@/context/UserContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toast'
import { Tutorial } from '@/components/Tutorial'
// HelpWidget removed — replaced by /dashboard/support page
import { InitialOnboarding, getNavForBusinessType } from '@/components/InitialOnboarding'
import { ProfileSelector } from '@/components/ProfileSelector'
import { ProfileSwitcher } from '@/components/ProfileSwitcher'
import { OnboardingChecklistSidebar } from '@/components/OnboardingChecklist'
import { OnboardingHelpButton } from '@/components/OnboardingHelpButton'
import { Home, ShoppingBag, PackageCheck, BarChart3, Megaphone, CreditCard, Settings, LayoutDashboard, MapPin, Store, Bike, ClipboardList, Users, DollarSign, Wallet, Receipt, Map, CalendarCheck, Puzzle, Menu, MessageSquare, Bot, Activity } from 'lucide-react'

const storeNav = [
  { href: '/dashboard', label: 'Inicio', Icon: Home, exact: true, tour: 'home' },
  { href: '/dashboard/menu', label: 'Catálogo', Icon: ShoppingBag, tour: 'menu' },
  { href: '/dashboard/orders', label: 'Pedidos', Icon: PackageCheck, tour: 'orders' },
  { href: '/dashboard/stats', label: 'Estadísticas', Icon: BarChart3, tour: 'stats' },
  { href: '/dashboard/marketing', label: 'Marketing', Icon: Megaphone, tour: 'marketing' },
  { href: '/dashboard/modules', label: 'Módulos', Icon: Puzzle, tour: 'modules' },
  { href: '/dashboard/support', label: 'Soporte', Icon: MessageSquare, tour: 'support' },
  { href: '/dashboard/subscription', label: 'Suscripción', Icon: CreditCard, tour: 'subscription' },
  { href: '/dashboard/settings', label: 'Configuración', Icon: Settings, tour: 'settings' },
]

const adminNav = [
  { href: '/dashboard/admin', label: 'Overview', Icon: LayoutDashboard, exact: true },
  { href: '/dashboard/admin/users', label: 'Usuarios', Icon: Users },
  { href: '/dashboard/admin/restaurants', label: 'Comercios', Icon: Store },
  { href: '/dashboard/admin/orders', label: 'Pedidos', Icon: ClipboardList },
  { href: '/dashboard/admin/subscriptions', label: 'Suscripciones', Icon: Receipt },
  { href: '/dashboard/admin/flags', label: 'Feature Flags', Icon: Settings },
  { href: '/dashboard/admin/featured-pricing', label: 'Pricing Destacados', Icon: DollarSign },
  { href: '/dashboard/admin/sales', label: 'Sales Agent', Icon: Megaphone },
  { href: '/dashboard/admin/vitals', label: 'Web Vitals', Icon: Activity },
  { href: '/dashboard/admin/monitoring', label: 'Monitoring & Alerts', Icon: Activity },
  { href: '/dashboard/admin/pulse', label: 'Pulse', Icon: Activity, badge: 'NEW' },
  { href: '/dashboard/runtics', label: 'Runtics', Icon: Bot },
  { href: '/dashboard/roadmap', label: 'Roadmap', Icon: Map },
  { href: '/dashboard/settings', label: 'Mi cuenta', Icon: Settings },
]

function ImpersonationBanner() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const { user } = useUser()

  useEffect(() => {
    const originalToken = localStorage.getItem('originalToken')
    setVisible(!!originalToken)
    if (originalToken && user?.email) {
      setEmail(user.email)
    }
  }, [user])

  if (!visible) return null

  function returnToAdmin() {
    const originalToken = localStorage.getItem('originalToken')
    if (originalToken) {
      localStorage.setItem('token', originalToken)
      localStorage.removeItem('originalToken')
      window.location.href = '/dashboard/admin/users'
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-sm font-semibold flex items-center justify-center gap-3 py-2 px-4 shadow-md">
      <span>Estás viendo como {email || 'otro usuario'}</span>
      <button
        onClick={returnToAdmin}
        className="bg-amber-800 text-white text-xs px-3 py-1 rounded-lg hover:bg-amber-900 transition-colors font-semibold"
      >
        Volver a admin
      </button>
    </div>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: userLoading } = useUser()
  const [showSetupNew, setShowSetupNew] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { activeProfile, profiles, loading: profileLoading, switchProfile, refreshProfiles } = useProfile()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    if (!userLoading && !user) {
      localStorage.removeItem('token')
      router.push('/login')
    }
  }, [userLoading, user])

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new-profile') === '1') {
      setShowSetupNew(true)
      window.history.replaceState({}, '', pathname)
    }
  }, [pathname])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const loading = userLoading || profileLoading || !user

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    )
  }

  const isSuperAdmin = user?.role === 'superadmin'

  // Superadmin: skip onboarding, redirect to admin if on store pages
  if (isSuperAdmin) {
    if (!pathname.startsWith('/dashboard/admin') && !pathname.startsWith('/dashboard/roadmap') && !pathname.startsWith('/dashboard/settings') && !pathname.startsWith('/dashboard/runtics')) {
      router.push('/dashboard/admin')
      return null
    }
  }

  // No profiles at all → show initial onboarding (5 steps with plan + name)
  if (!isSuperAdmin && !activeProfile && profiles.length === 0 && !showSetupNew) {
    return (
      <InitialOnboarding
        isFirstProfile={true}
        onComplete={() => {
          window.location.reload()
        }}
      />
    )
  }

  // Has profiles but none active → show ProfileSelector
  if (!activeProfile && profiles.length > 0 && !showSetupNew) {
    return (
      <ProfileSelector
        profiles={profiles}
        onSelect={(id) => switchProfile(id)}
        onCreateNew={() => setShowSetupNew(true)}
      />
    )
  }

  // User triggered "create new profile" from ProfileSelector (3 steps, no plan/name)
  if (showSetupNew) {
    return (
      <InitialOnboarding
        isFirstProfile={false}
        onComplete={() => {
          window.location.reload()
        }}
      />
    )
  }

  const isAdminSection = pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/roadmap') || pathname.startsWith('/dashboard/runtics')
  const businessType = activeProfile?.business_type ?? null
  const dynamicStoreNav = businessType ? getNavForBusinessType(businessType) : storeNav
  const nav = isSuperAdmin ? adminNav : (isAdminSection ? adminNav : dynamicStoreNav)

  return (
    <div className="min-h-screen bg-slate-50">
      <ImpersonationBanner />
      {/* Hamburger button — mobile only */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white rounded-lg p-2 shadow-md border border-slate-200"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay — mobile only, when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100">
          <span className="logo-runbits logo-runbits-dark text-lg">RunBits</span>
          {(isSuperAdmin || user?.store_name) && (
            <p className="text-xs text-slate-400 mt-0.5">
              {isSuperAdmin ? 'Administrador' : user?.store_name}
            </p>
          )}
        </div>

        {!isSuperAdmin && (
          <ProfileSwitcher />
        )}

        {!isSuperAdmin && !isAdminSection && (
          <OnboardingChecklistSidebar />
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const active = (item as any).exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                data-tour={(item as any).tour || undefined}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                {(() => {
                  const iconMap: Record<string, any> = { Home, ShoppingBag, PackageCheck, BarChart3, Megaphone, CreditCard, Settings, LayoutDashboard, MapPin, Store, Bike, ClipboardList, Users, DollarSign, Wallet, Receipt, Map, CalendarCheck, Puzzle, MessageSquare }
                  const IconComp = ('Icon' in item && (item as any).Icon) ? (item as any).Icon : ('iconName' in item ? iconMap[(item as any).iconName] : null)
                  return IconComp ? <IconComp className="w-5 h-5" /> : null
                })()}
                <span className="flex-1">{item.label}</span>
                {(item as any).badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {(item as any).badge}
                  </span>
                )}
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

      <main className="lg:ml-64 pt-16 lg:pt-8 px-4 pb-4 lg:px-8 lg:pb-8">
        <ErrorBoundary>
          <div className="max-w-6xl">{children}</div>
        </ErrorBoundary>
      </main>
      <Tutorial />
      {/* HelpWidget removed — support is now at /dashboard/support */}
      {!isSuperAdmin && !isAdminSection && <OnboardingHelpButton />}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProfileProvider>
        <ToastProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </ToastProvider>
      </ProfileProvider>
    </UserProvider>
  )
}
