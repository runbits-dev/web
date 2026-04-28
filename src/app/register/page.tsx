"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Package, Wrench, Layers, Search, ArrowLeft, ChevronRight, Check, User, Store } from 'lucide-react'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

// ─── Business categories ────────────────────────────────────────────────────

type OfferType = 'products' | 'services' | 'both'
type FunctionalType = 'food' | 'goods' | 'appointment' | 'task' | 'realtime' | 'food+appointment' | 'goods+appointment' | 'goods+task'
type OperationType = 'independent' | 'business'
type BusinessCategory = { id: string; label: string; functionalType: FunctionalType; featured: boolean }

const PRODUCT_CATEGORIES: BusinessCategory[] = [
  { id: 'restaurante', label: 'Restaurante', functionalType: 'food', featured: true },
  { id: 'pizzeria', label: 'Pizzería', functionalType: 'food', featured: true },
  { id: 'cafe', label: 'Café', functionalType: 'food', featured: true },
  { id: 'heladeria', label: 'Heladería', functionalType: 'food', featured: true },
  { id: 'panaderia', label: 'Panadería', functionalType: 'food', featured: true },
  { id: 'almacen', label: 'Almacén', functionalType: 'goods', featured: true },
  { id: 'farmacia', label: 'Farmacia', functionalType: 'goods', featured: true },
  { id: 'tienda-ropa', label: 'Tienda de ropa', functionalType: 'goods', featured: true },
  { id: 'ferreteria', label: 'Ferretería', functionalType: 'goods', featured: true },
  { id: 'pet-shop', label: 'Pet Shop', functionalType: 'goods', featured: true },
  { id: 'hamburgueseria', label: 'Hamburguesería', functionalType: 'food', featured: false },
  { id: 'sushi', label: 'Sushi', functionalType: 'food', featured: false },
  { id: 'rotiseria', label: 'Rotisería', functionalType: 'food', featured: false },
  { id: 'vinoteca', label: 'Vinoteca', functionalType: 'goods', featured: false },
  { id: 'dietetica', label: 'Dietética', functionalType: 'goods', featured: false },
  { id: 'libreria', label: 'Librería', functionalType: 'goods', featured: false },
  { id: 'bazar', label: 'Bazar', functionalType: 'goods', featured: false },
  { id: 'electronica', label: 'Electrónica', functionalType: 'goods', featured: false },
  { id: 'producto-otro', label: 'Otro producto', functionalType: 'goods', featured: false },
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
  { id: 'profesor', label: 'Profesor particular', functionalType: 'appointment', featured: false },
  { id: 'psicologo', label: 'Psicólogo', functionalType: 'appointment', featured: false },
  { id: 'disenador', label: 'Diseñador', functionalType: 'task', featured: false },
  { id: 'limpieza', label: 'Limpieza', functionalType: 'task', featured: false },
  { id: 'taller-mecanico', label: 'Taller mecánico', functionalType: 'task', featured: false },
  { id: 'servicio-otro', label: 'Otro servicio', functionalType: 'task', featured: false },
]

const BOTH_CATEGORIES: BusinessCategory[] = [
  { id: 'pet-shop-peluqueria', label: 'Pet Shop + Peluquería canina', functionalType: 'goods+appointment', featured: true },
  { id: 'salon-productos', label: 'Salón + Productos', functionalType: 'goods+appointment', featured: true },
  { id: 'farmacia-turnos', label: 'Farmacia + Turnos', functionalType: 'goods+appointment', featured: true },
  { id: 'taller-repuestos', label: 'Taller + Repuestos', functionalType: 'goods+task', featured: true },
  { id: 'veterinaria-petshop', label: 'Veterinaria + Pet Shop', functionalType: 'goods+appointment', featured: true },
  { id: 'ambos-otro', label: 'Otro mixto', functionalType: 'goods+appointment', featured: true },
]

function getCategoriesForType(type: OfferType): BusinessCategory[] {
  switch (type) {
    case 'products': return PRODUCT_CATEGORIES
    case 'services': return SERVICE_CATEGORIES
    case 'both': return BOTH_CATEGORIES
  }
}

function getDashboardPreview(type: FunctionalType): string {
  switch (type) {
    case 'food': return 'Menú + Pedidos'
    case 'goods': return 'Catálogo + Pedidos'
    case 'appointment': return 'Servicios + Turnos'
    case 'task': return 'Servicios + Trabajos'
    case 'realtime': return 'Servicios + Viajes'
    case 'food+appointment': return 'Menú + Pedidos + Turnos'
    case 'goods+appointment': return 'Catálogo + Pedidos + Turnos'
    case 'goods+task': return 'Catálogo + Pedidos + Trabajos'
  }
}

// ─── Plans ───────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: 0,
    description: 'Operá tu negocio sin costo',
    features: ['Catálogo ilimitado', 'Pedidos ilimitados', 'Tienda online', 'Chat con clientes', '3 cupones', '1 promo activa', 'Estadísticas básicas'],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 29,
    description: 'Herramientas para crecer',
    features: ['Todo de Free', 'Cupones y promos ilimitados', 'Dominio propio', 'Marca personalizada', 'Analytics con gráficos', '5 campañas push/mes', 'Perfiles ilimitados'],
    popular: true,
  },
  {
    id: 'business',
    label: 'Business',
    price: 99,
    description: 'Para escalar tu operación',
    features: ['Todo de Pro', 'White-label', 'Multi-sucursal (5)', '5 usuarios staff', 'Webhooks', 'Email marketing', 'Verificación de clientes'],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    price: 249,
    description: 'Todo ilimitado + IA',
    features: ['Todo de Business', 'Asistente IA 24/7', 'WhatsApp bot', 'GPS tracking', 'API REST', 'Sucursales ilimitadas', 'Soporte dedicado'],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // Step 1: Account
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  // Step 2: Offer type
  const [offerType, setOfferType] = useState<OfferType | null>(null)

  // Step 3: Business category
  const [categorySearch, setCategorySearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Step 4: Operation type
  const [operationType, setOperationType] = useState<OperationType | null>(null)

  // Step 5: Plan
  const [selectedPlan, setSelectedPlan] = useState('free')

  // Step 6: Business name
  const [businessName, setBusinessName] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  const categories = offerType ? getCategoriesForType(offerType) : []
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories.filter(c => c.featured)
    const q = categorySearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return categories.filter(c => {
      const label = c.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return label.includes(q)
    })
  }, [categories, categorySearch])

  const chosenCategory = categories.find(c => c.id === selectedCategory)

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.loginGoogle(response.credential)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      localStorage.setItem('show_tutorial', 'true')
      setName(res.user?.name || '')
      setEmail(res.user?.email || '')
      setStep(2)
    } catch {
      setError('Error al registrar con Google')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        })
        setGoogleReady(true)
      }
    }
    document.head.appendChild(script)
  }, [handleGoogleCredential])

  useEffect(() => {
    if (googleReady && step === 1) {
      const btn = document.getElementById('google-register-btn')
      if (btn && (window as any).google) {
        (window as any).google.accounts.id.renderButton(btn, {
          type: 'standard', theme: 'outline', size: 'large', width: 380, text: 'signup_with',
        })
      }
    }
  }, [googleReady, step])

  const isGoogleUser = typeof window !== 'undefined' && !!localStorage.getItem('token')

  async function handleRegister() {
    if (!chosenCategory || !operationType) return
    if (!businessName.trim()) { setError('Ingresá un nombre'); return }
    setLoading(true)
    setError('')
    try {
      if (!isGoogleUser) {
        if (!name || !email || !password) { setError('Completá todos los campos'); return }
        const res = await api.register({ name, email, phone, password, role: 'restaurant_owner' })
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
      }
      const profile = await api.createProfile({
        businessType: chosenCategory.functionalType,
        businessCategory: chosenCategory.id,
        operationType,
        displayName: businessName.trim(),
      })
      const switchResult = await api.switchProfile(profile.id)
      localStorage.setItem('token', switchResult.token)
      localStorage.setItem('show_tutorial', 'true')
      router.push('/dashboard')
    } catch (e: any) {
      setError(e?.message || 'Error al registrar')
    } finally { setLoading(false) }
  }

  const totalSteps = 6

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">Runbits</Link>
          <p className="text-sm text-gray-500 mt-2">Creá tu cuenta en minutos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-0.5 mb-8 max-w-md mx-auto">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex-1 flex items-center gap-0.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                s <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{s}</div>
              {s < totalSteps && <div className={`flex-1 h-0.5 ${s < step ? 'bg-indigo-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

          {/* ─── Step 1: Account ─── */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Tu cuenta</h2>
              <p className="text-sm text-gray-500 mb-5">Datos de acceso a la plataforma</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre completo *</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
                  <input type="email" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@minegocio.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Teléfono</label>
                  <input type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 9 11 1234-5678" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Contraseña *</label>
                  <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                </div>
              </div>
              {GOOGLE_CLIENT_ID && (
                <>
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">o registrate con</span></div>
                  </div>
                  <div id="google-register-btn" className="flex justify-center mb-4" />
                </>
              )}
              <button onClick={() => { if (!name || !email || !password) { setError('Completá nombre, email y contraseña'); return }; setError(''); setStep(2) }} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Siguiente
              </button>
            </div>
          )}

          {/* ─── Step 2: Offer type ─── */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">¿Qué ofrecés?</h2>
              <p className="text-sm text-gray-500 mb-5">Esto define cómo funciona tu panel. Podés cambiarlo después.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { type: 'products' as OfferType, label: 'Productos', desc: 'Vendo productos físicos', Icon: Package },
                  { type: 'services' as OfferType, label: 'Servicios', desc: 'Ofrezco servicios o trabajos', Icon: Wrench },
                  { type: 'both' as OfferType, label: 'Ambos', desc: 'Productos y servicios', Icon: Layers },
                ]).map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => { setOfferType(opt.type); setSelectedCategory(null); setCategorySearch(''); setStep(3) }}
                    className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                  >
                    <opt.Icon className="w-7 h-7 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <p className="text-sm font-bold text-gray-900 mt-2">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Atrás
              </button>
            </div>
          )}

          {/* ─── Step 3: Business category ─── */}
          {step === 3 && offerType && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">¿Qué tipo de negocio?</h2>
              <p className="text-sm text-gray-500 mb-4">Elegí el rubro que mejor te represente. Podés cambiarlo después.</p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Buscar rubro..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredCategories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`text-left p-3 rounded-xl border-2 transition-all ${selectedCategory === cat.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-sm font-semibold ${selectedCategory === cat.id ? 'text-indigo-700' : 'text-gray-900'}`}>{cat.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      {getDashboardPreview(cat.functionalType)}
                    </p>
                  </button>
                ))}
              </div>
              {filteredCategories.length === 0 && <p className="text-center text-sm text-gray-400 py-6">No encontramos ese rubro.</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Atrás
                </button>
                <button onClick={() => { if (!selectedCategory) return; setStep(4) }} disabled={!selectedCategory} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Operation type ─── */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">¿Cómo operás?</h2>
              <p className="text-sm text-gray-500 mb-5">Esto adapta tu experiencia y los planes disponibles. Podés cambiarlo después.</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  {
                    type: 'independent' as OperationType,
                    label: 'Independiente',
                    desc: 'Trabajo solo, sin empleados ni local fijo',
                    examples: 'Conductor, freelancer, profesor particular, autónomo',
                    Icon: User,
                  },
                  {
                    type: 'business' as OperationType,
                    label: 'Negocio / Empresa',
                    desc: 'Tengo un negocio, local, marca o equipo',
                    examples: 'Tienda, restaurante, agencia, consultora, salón',
                    Icon: Store,
                  },
                ]).map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => { setOperationType(opt.type); setSelectedPlan('free'); setStep(5) }}
                    className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                  >
                    <opt.Icon className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <p className="text-sm font-bold text-gray-900 mt-3">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{opt.examples}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Atrás
              </button>
            </div>
          )}

          {/* ─── Step 5: Plan selection ─── */}
          {step === 5 && operationType && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Elegí tu plan</h2>
              <p className="text-sm text-gray-500 mb-5">
                Todos los planes incluyen 14 días gratis. Sin tarjeta de crédito. Podés cambiar de plan después.
              </p>
              <div className="space-y-3">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      selectedPlan === plan.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPlan === plan.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
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
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Atrás
                </button>
                <button onClick={() => setStep(6)} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 6: Business name ─── */}
          {step === 6 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {operationType === 'independent' ? 'Tu perfil' : 'Tu negocio'}
              </h2>
              <p className="text-sm text-gray-500 mb-5">Último paso. Podés cambiarlo después.</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{chosenCategory?.label}</p>
                      <p className="text-xs text-gray-500">
                        {operationType === 'independent' ? 'Independiente' : 'Negocio'} — Plan {PLANS.find(p => p.id === selectedPlan)?.label}
                        {selectedPlan !== 'free' ? ` (USD $${PLANS.find(p => p.id === selectedPlan)?.price}/mes)` : ' (Gratis)'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    {operationType === 'independent' ? 'Nombre para tu perfil *' : 'Nombre del negocio *'}
                  </label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder={operationType === 'independent' ? 'Ej: Juan Pérez Electricista, Ana Diseño' : 'Ej: La Burguesa, Pet Shop Luna, Dr. García'}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(5)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Atrás
                </button>
                <button onClick={handleRegister} disabled={loading || !businessName} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Creando...' : operationType === 'independent' ? 'Crear mi perfil' : 'Crear mi negocio'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          ¿Ya tenés cuenta? <Link href="/login" className="text-indigo-600 font-medium hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </main>
  )
}
