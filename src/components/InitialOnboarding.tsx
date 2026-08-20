"use client"

import { useState, useMemo } from 'react'
import { Package, Wrench, Layers, Search, ArrowLeft, ChevronRight, User, Store, Check } from 'lucide-react'
import { api, createFreeSubscription } from '@/lib/api'
import { toBillingBusinessType } from '@/lib/onboarding'

type BusinessCategory = {
  id: string
  label: string
  functionalType: FunctionalType
  featured: boolean
}

type FunctionalType = 'food' | 'appointment' | 'task' | 'realtime' | 'food+appointment'
type OfferType = 'products' | 'services' | 'both'
type OperationType = 'independent' | 'business'

const PRODUCT_CATEGORIES: BusinessCategory[] = [
  { id: 'restaurante', label: 'Restaurante', functionalType: 'food', featured: true },
  { id: 'pizzeria', label: 'Pizzería', functionalType: 'food', featured: true },
  { id: 'cafe', label: 'Café', functionalType: 'food', featured: true },
  { id: 'heladeria', label: 'Heladería', functionalType: 'food', featured: true },
  { id: 'panaderia', label: 'Panadería', functionalType: 'food', featured: true },
  { id: 'hamburgueseria', label: 'Hamburguesería', functionalType: 'food', featured: false },
  { id: 'sushi', label: 'Sushi', functionalType: 'food', featured: false },
  { id: 'empanadas', label: 'Empanadas', functionalType: 'food', featured: false },
  { id: 'rotiseria', label: 'Rotisería', functionalType: 'food', featured: false },
  { id: 'food-truck', label: 'Food Truck', functionalType: 'food', featured: false },
  { id: 'pasteleria', label: 'Pastelería', functionalType: 'food', featured: false },
  { id: 'bar', label: 'Bar', functionalType: 'food', featured: false },
]

const SERVICE_CATEGORIES: BusinessCategory[] = [
  { id: 'peluqueria', label: 'Peluquería', functionalType: 'appointment', featured: true },
  { id: 'barberia', label: 'Barbería', functionalType: 'appointment', featured: true },
  { id: 'medico', label: 'Médico / Consultorio', functionalType: 'appointment', featured: true },
  { id: 'dentista', label: 'Dentista', functionalType: 'appointment', featured: true },
  { id: 'spa', label: 'Spa / Masajes', functionalType: 'appointment', featured: true },
  { id: 'electricista', label: 'Electricista', functionalType: 'task', featured: true },
  { id: 'plomero', label: 'Plomero', functionalType: 'task', featured: true },
  { id: 'remis', label: 'Remis / Taxi', functionalType: 'realtime', featured: true },
  { id: 'cadeteria', label: 'Cadetería', functionalType: 'realtime', featured: true },
  { id: 'flete', label: 'Flete / Mudanza', functionalType: 'realtime', featured: true },
  { id: 'salon-unas', label: 'Salón de uñas', functionalType: 'appointment', featured: false },
  { id: 'estetica', label: 'Estética corporal', functionalType: 'appointment', featured: false },
  { id: 'profesor', label: 'Profesor particular', functionalType: 'appointment', featured: false },
  { id: 'psicologo', label: 'Psicólogo', functionalType: 'appointment', featured: false },
  { id: 'nutricionista', label: 'Nutricionista', functionalType: 'appointment', featured: false },
  { id: 'veterinaria', label: 'Veterinaria', functionalType: 'appointment', featured: false },
  { id: 'personal-trainer', label: 'Personal trainer', functionalType: 'appointment', featured: false },
  { id: 'disenador', label: 'Diseñador', functionalType: 'task', featured: false },
  { id: 'limpieza', label: 'Limpieza', functionalType: 'task', featured: false },
  { id: 'taller-mecanico', label: 'Taller mecánico', functionalType: 'task', featured: false },
  { id: 'pintor', label: 'Pintor', functionalType: 'task', featured: false },
  { id: 'fotografo', label: 'Fotógrafo', functionalType: 'task', featured: false },
  { id: 'mensajeria', label: 'Mensajería', functionalType: 'realtime', featured: false },
  { id: 'grua', label: 'Grúa', functionalType: 'realtime', featured: false },
  { id: 'servicio-otro', label: 'Otro servicio', functionalType: 'task', featured: false },
]

const BOTH_CATEGORIES: BusinessCategory[] = [
  { id: 'cafe-coworking', label: 'Café + Coworking', functionalType: 'food+appointment', featured: true },
]

function getCategoriesForType(type: OfferType): BusinessCategory[] {
  switch (type) {
    case 'products': return PRODUCT_CATEGORIES
    case 'services': return SERVICE_CATEGORIES
    case 'both': return BOTH_CATEGORIES
  }
}

// ─── Plans ───────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free', label: 'Free', price: 0,
    description: 'Operá tu negocio sin costo',
    features: ['Catálogo ilimitado', 'Pedidos ilimitados', 'Tienda online', 'Chat con clientes', '3 cupones', '1 promo activa', 'Estadísticas básicas'],
  },
  {
    id: 'pro', label: 'Pro', price: 29,
    description: 'Herramientas para crecer',
    features: ['Todo de Free', 'Cupones y promos ilimitados', 'Dominio propio', 'Marca personalizada', 'Analytics con gráficos', '5 campañas push/mes', 'Perfiles ilimitados'],
    popular: true,
  },
  {
    id: 'business', label: 'Business', price: 99,
    description: 'Para escalar tu operación',
    features: ['Todo de Pro', 'White-label', 'Multi-sucursal (5)', '5 usuarios staff', 'Webhooks', 'Email marketing', 'Verificación de clientes'],
  },
  {
    id: 'enterprise', label: 'Enterprise', price: 249,
    description: 'Todo ilimitado + IA',
    features: ['Todo de Business', 'Asistente IA 24/7', 'WhatsApp bot', 'GPS tracking', 'API REST', 'Sucursales ilimitadas', 'Soporte dedicado'],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function InitialOnboarding({ onComplete, isFirstProfile = true }: { onComplete: () => void; isFirstProfile?: boolean }) {
  // First profile: offer → category → operation → plan → name (5 steps)
  // Additional: offer → category → operation → name (4 steps)
  const totalSteps = isFirstProfile ? 5 : 4
  const [step, setStep] = useState(1)
  const [offerType, setOfferType] = useState<OfferType | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [operationType, setOperationType] = useState<OperationType | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [profileName, setProfileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const categories = offerType ? getCategoriesForType(offerType) : []

  const filtered = useMemo(() => {
    if (!search.trim()) return categories.filter(c => c.featured)
    const q = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return categories.filter(c => {
      const label = c.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return label.includes(q)
    })
  }, [categories, search])

  const selectedCategory = categories.find(c => c.id === selected)

  async function handleConfirm() {
    if (!selectedCategory || !operationType) {
      setSaveError('Seleccioná una opción para continuar')
      return
    }
    if (isFirstProfile && !profileName.trim()) {
      setSaveError('Ingresá un nombre')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const displayName = isFirstProfile
        ? profileName.trim()
        : (operationType === 'independent' ? 'Mi perfil' : 'Mi negocio')
      const newProfile = await api.createProfile({
        businessType: selectedCategory.functionalType,
        businessCategory: selectedCategory.id,
        operationType,
        displayName,
      })
      const result = await api.switchProfile(newProfile.id)
      localStorage.setItem('token', result.token)
      // Best-effort: attach the FREE subscription carrying the vertical so the
      // new profile has a subscription row with business_type set (required by
      // billing's entitlement checks, e.g. booking_basic). A billing failure
      // must NOT block onboarding — the merchant can subscribe later.
      const restaurantId = newProfile.store_id ?? result.activeProfile?.store_id ?? null
      if (restaurantId) {
        try {
          await createFreeSubscription(restaurantId, toBillingBusinessType(selectedCategory.functionalType))
        } catch (subErr) {
          console.warn('[onboarding] free subscription create failed (non-blocking):', subErr)
        }
      }
      onComplete()
    } catch (e: any) {
      const msg = e.message || 'Error al guardar el perfil'
      setSaveError(msg)
      console.error('InitialOnboarding error:', msg)
    } finally {
      setSaving(false)
    }
  }

  // Map logical step to what shows based on isFirstProfile
  // First profile: 1=offer, 2=category, 3=operation, 4=plan, 5=name
  // Additional profile: 1=offer, 2=category, 3=operation (then save)
  const lastStep = totalSteps

  return (
    <div className="fixed inset-0 bg-white z-[80] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s === step ? 'bg-indigo-600 text-white' : s < step ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'
              }`}>{s < step ? <Check className="w-4 h-4" /> : s}</div>
              {s < totalSteps && <div className={`w-12 h-0.5 ${s < step ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* ─── Step 1: Products / Services / Both ─── */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">¿Qué ofrece tu negocio?</h1>
              <p className="text-sm text-gray-500 mt-2">Esto define cómo funciona tu panel. Podés cambiarlo después.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { type: 'products' as OfferType, label: 'Productos', desc: 'Vendo productos físicos', Icon: Package, examples: 'Comida, ropa, electrónica, alimentos' },
                { type: 'services' as OfferType, label: 'Servicios', desc: 'Ofrezco servicios o trabajos', Icon: Wrench, examples: 'Turnos, reparaciones, viajes' },
                { type: 'both' as OfferType, label: 'Ambos', desc: 'Vendo productos y ofrezco servicios', Icon: Layers, examples: 'Pet shop + peluquería, taller + repuestos' },
              ]).map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { setOfferType(opt.type); setSelected(null); setSearch(''); setStep(2) }}
                  className="text-left p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <opt.Icon className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  <p className="text-sm font-bold text-gray-900 mt-3">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{opt.examples}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Step 2: Category selection ─── */}
        {step === 2 && offerType && (
          <>
            <div className="mb-4">
              <button onClick={() => { setStep(1); setSelected(null); setSearch('') }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">¿Qué tipo de negocio tenés?</h1>
              <p className="text-sm text-gray-500 mt-2">Elegí el rubro que mejor te represente. Podés cambiarlo después.</p>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar rubro..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {filtered.map(cat => (
                <button key={cat.id} onClick={() => setSelected(cat.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${selected === cat.id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-semibold ${selected === cat.id ? 'text-indigo-700' : 'text-gray-900'}`}>{cat.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {getDashboardPreview(cat.functionalType)}
                  </p>
                </button>
              ))}
            </div>
            {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No encontramos ese rubro. Probá con otro nombre.</p>}
            <button onClick={() => { if (selected) setStep(3) }} disabled={!selected}
              className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              Siguiente
            </button>
          </>
        )}

        {/* ─── Step 3: Operation type ─── */}
        {step === 3 && (
          <>
            <div className="mb-4">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">¿Cómo operás?</h1>
              <p className="text-sm text-gray-500 mt-2">Esto adapta tu experiencia. Podés cambiarlo después.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                { type: 'independent' as OperationType, label: 'Independiente', desc: 'Trabajo solo, sin empleados ni local fijo', examples: 'Conductor, freelancer, profesor particular', Icon: User },
                { type: 'business' as OperationType, label: 'Negocio / Empresa', desc: 'Tengo un negocio, local, marca o equipo', examples: 'Tienda, restaurante, agencia, consultora', Icon: Store },
              ]).map(opt => (
                <button key={opt.type} onClick={() => setOperationType(opt.type)}
                  className={`text-left p-6 rounded-2xl border-2 transition-all group ${operationType === opt.type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                  <opt.Icon className={`w-8 h-8 transition-colors ${operationType === opt.type ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                  <p className="text-sm font-bold text-gray-900 mt-3">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{opt.examples}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (!operationType) { setSaveError('Seleccioná una opción'); return }
                if (isFirstProfile) { setStep(4) } else { setStep(4) }
              }}
              disabled={saving}
              className={`w-full mt-6 text-white py-3 rounded-xl font-semibold transition-colors ${operationType ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}>
              Siguiente
            </button>
            {saveError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-700">{saveError}</p></div>}
          </>
        )}

        {/* ─── Step 4: Plan (first profile) or Name (additional profile) ─── */}
        {step === 4 && isFirstProfile && operationType && (
          <>
            <div className="mb-4">
              <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Elegí tu plan</h1>
              <p className="text-sm text-gray-500 mt-2">
                Todos incluyen 14 días gratis. Sin tarjeta. Podés cambiar después.
              </p>
            </div>
            <div className="space-y-3">
              {PLANS.map(plan => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedPlan === plan.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan === plan.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                    {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{plan.label}</span>
                      {(plan as any).popular && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Popular</span>}
                      <span className="text-sm font-bold text-gray-900 ml-auto">
                        {plan.price === 0 ? 'Gratis' : `USD $${plan.price}/mes`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                      {plan.features.map(f => (
                        <span key={f} className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Check className="w-3 h-3 text-indigo-400" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(5)} className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Siguiente
            </button>
          </>
        )}

        {step === 4 && !isFirstProfile && (
          <>
            <div className="mb-4">
              <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {operationType === 'independent' ? 'Tu perfil' : 'Tu negocio'}
              </h1>
              <p className="text-sm text-gray-500 mt-2">Podés cambiarlo después.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-900">{selectedCategory?.label}</p>
                <p className="text-xs text-gray-500">{operationType === 'independent' ? 'Independiente' : 'Negocio'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  {operationType === 'independent' ? 'Nombre para tu perfil *' : 'Nombre del negocio *'}
                </label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={profileName} onChange={e => setProfileName(e.target.value)}
                  placeholder={operationType === 'independent' ? 'Ej: Juan Pérez Electricista' : 'Ej: La Burguesa, Pet Shop Luna'} />
              </div>
            </div>
            <button onClick={handleConfirm} disabled={saving || !profileName.trim()}
              className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : operationType === 'independent' ? 'Crear mi perfil' : 'Crear mi negocio'}
            </button>
            {saveError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-700">{saveError}</p></div>}
          </>
        )}

        {/* ─── Step 5: Name (first profile) ─── */}
        {step === 5 && isFirstProfile && (
          <>
            <div className="mb-4">
              <button onClick={() => setStep(4)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {operationType === 'independent' ? 'Tu perfil' : 'Tu negocio'}
              </h1>
              <p className="text-sm text-gray-500 mt-2">Último paso. Podés cambiarlo después.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-900">{selectedCategory?.label}</p>
                <p className="text-xs text-gray-500">
                  {operationType === 'independent' ? 'Independiente' : 'Negocio'} — Plan {PLANS.find(p => p.id === selectedPlan)?.label}
                  {selectedPlan !== 'free' ? ` (USD $${PLANS.find(p => p.id === selectedPlan)?.price}/mes)` : ' (Gratis)'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  {operationType === 'independent' ? 'Nombre para tu perfil *' : 'Nombre del negocio *'}
                </label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={profileName} onChange={e => setProfileName(e.target.value)}
                  placeholder={operationType === 'independent' ? 'Ej: Juan Pérez Electricista' : 'Ej: La Burguesa, Pet Shop Luna'} />
              </div>
            </div>
            <button onClick={handleConfirm} disabled={saving || !profileName.trim()}
              className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : operationType === 'independent' ? 'Crear mi perfil' : 'Crear mi negocio'}
            </button>
            {saveError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-700">{saveError}</p></div>}
          </>
        )}
      </div>
    </div>
  )
}

function getDashboardPreview(type: FunctionalType): string {
  switch (type) {
    case 'food': return 'Menú + Pedidos'
    case 'appointment': return 'Servicios + Turnos'
    case 'task': return 'Servicios + Trabajos'
    case 'realtime': return 'Servicios + Viajes'
    case 'food+appointment': return 'Menú + Pedidos + Turnos'
  }
}

// ─── Nav items per functional type ───────────────────────────────────────────

export function getNavForBusinessType(type: string) {
  const common = [
    { href: '/dashboard', label: 'Inicio', iconName: 'Home', exact: true, tour: 'home' },
    { href: '/dashboard/stats', label: 'Estadísticas', iconName: 'BarChart3', tour: 'stats' },
    { href: '/dashboard/marketing', label: 'Marketing', iconName: 'Megaphone', tour: 'marketing' },
    { href: '/dashboard/modules', label: 'Módulos', iconName: 'Puzzle', tour: 'modules' },
    { href: '/dashboard/support', label: 'Soporte', iconName: 'MessageSquare', tour: 'support' },
    { href: '/dashboard/subscription', label: 'Suscripción', iconName: 'CreditCard', tour: 'subscription' },
    { href: '/dashboard/settings', label: 'Configuración', iconName: 'Settings', tour: 'settings' },
  ]

  const menuItem = (label: string) => ({ href: '/dashboard/menu', label, iconName: 'ShoppingBag', tour: 'menu' })
  const ordersItem = (label: string) => ({ href: '/dashboard/orders', label, iconName: 'PackageCheck', tour: 'orders' })

  switch (type) {
    case 'food':
      return [common[0], menuItem('Menú'), ordersItem('Pedidos'), ...common.slice(1)]
    case 'appointment':
      return [common[0], menuItem('Servicios'), ordersItem('Turnos'), ...common.slice(1)]
    case 'task':
      return [common[0], menuItem('Servicios'), ordersItem('Trabajos'), ...common.slice(1)]
    case 'realtime':
      return [common[0], menuItem('Servicios'), ordersItem('Viajes'), ...common.slice(1)]
    case 'food+appointment':
      return [common[0], menuItem('Menú'), ordersItem('Pedidos'), { href: '/dashboard/bookings', label: 'Turnos', iconName: 'CalendarCheck', tour: 'bookings' }, ...common.slice(1)]
    default:
      return [common[0], menuItem('Catálogo'), ordersItem('Pedidos'), ...common.slice(1)]
  }
}
