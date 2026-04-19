"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { UtensilsCrossed, ShoppingBag, ShoppingCart, Heart, Briefcase, Scissors, PawPrint, Car, Package } from 'lucide-react'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

const BUSINESS_TYPES = [
  { id: 'restaurant', label: 'Restaurante / Comida', Icon: UtensilsCrossed, desc: 'Restaurantes, bares, cafés, heladerías, panaderías. Ideal para delivery de comida preparada.', examples: 'Ej: pizzería, hamburguesería, sushi' },
  { id: 'store', label: 'Tienda / Retail', Icon: ShoppingBag, desc: 'Ropa, electrónica, accesorios, librerías. Venta de productos físicos con envío o retiro.', examples: 'Ej: boutique, ferretería, bazar' },
  { id: 'grocery', label: 'Supermercado / Almacén', Icon: ShoppingCart, desc: 'Supermercados, almacenes, dietéticas, verdurerías. Alimentos y productos del hogar.', examples: 'Ej: almacén de barrio, dietética, vinoteca' },
  { id: 'pharmacy', label: 'Farmacia / Salud', Icon: Heart, desc: 'Farmacias, perfumerías, productos de salud y bienestar.', examples: 'Ej: farmacia, herboristería, óptica' },
  { id: 'services', label: 'Servicios profesionales', Icon: Briefcase, desc: 'Profesionales que ofrecen servicios por turno o consulta.', examples: 'Ej: consultorio, estudio contable, clases' },
  { id: 'beauty', label: 'Belleza / Estética', Icon: Scissors, desc: 'Peluquerías, barberías, spa, centros de estética. Turnos y horarios.', examples: 'Ej: peluquería, salón de uñas, masajes' },
  { id: 'pets', label: 'Mascotas', Icon: PawPrint, desc: 'Pet shops, veterinarias, peluquerías caninas. Productos y servicios.', examples: 'Ej: veterinaria, tienda de alimento' },
  { id: 'transport', label: 'Transporte / Logística', Icon: Car, desc: 'Transporte de personas o mercancía. Remises, fletes, mensajería.', examples: 'Ej: remisería, servicio de fletes' },
  { id: 'other', label: 'Otro tipo de negocio', Icon: Package, desc: 'Cualquier negocio que no encaje en las categorías anteriores.', examples: 'Ej: lavadero, gimnasio, coworking' },
]

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.loginWithGoogle(response.credential)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      localStorage.setItem('show_tutorial', 'true')
      // Skip to step 2 (business type) since Google gave us name/email
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

  async function handleRegister() {
    if (!name || !email || !password) { setError('Completá todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.register({ name, email, phone, password, role: 'restaurant_owner' })
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      localStorage.setItem('onboarding_business_type', businessType)
      localStorage.setItem('onboarding_business_name', businessName)
      localStorage.setItem('show_tutorial', 'true')
      router.push('/dashboard')
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Error al registrar')
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">Runbits</Link>
          <p className="text-sm text-gray-500 mt-2">Creá tu cuenta en 2 minutos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 max-w-xs mx-auto">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s <= step ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

          {/* Step 1: Account */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Tu cuenta</h2>
              <p className="text-sm text-gray-500 mb-5">Datos del administrador del negocio</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre completo *</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
                  <input type="email" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@minegocio.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Teléfono</label>
                  <input type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 9 11 1234-5678" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Contraseña *</label>
                  <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
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
              <button onClick={() => { if (!name || !email || !password) { setError('Completá nombre, email y contraseña'); return } setError(''); setStep(2) }} className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
                Siguiente con email →
              </button>
            </div>
          )}

          {/* Step 2: Business Type */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Tipo de negocio</h2>
              <p className="text-sm text-gray-500 mb-5">Elegí la categoría que mejor describe tu negocio. Podés agregar más tipos después.</p>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map(bt => (
                  <button
                    key={bt.id}
                    onClick={() => setBusinessType(bt.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      businessType === bt.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{bt.Icon ? <bt.Icon className='w-6 h-6 text-emerald-600' /> : null}</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{bt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bt.desc}</p>
                    {bt.examples && <p className="text-[10px] text-gray-400 mt-1">{bt.examples}</p>}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">← Atrás</button>
                <button onClick={() => { if (!businessType) { setError('Elegí un tipo de negocio'); return } setError(''); setStep(3) }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors" disabled={!businessType}>
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Business Details */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Tu negocio</h2>
              <p className="text-sm text-gray-500 mb-5">Nombre y datos básicos. Podés completar el resto después.</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  {(() => { const T = BUSINESS_TYPES.find(b => b.id === businessType); return T?.Icon ? <T.Icon className="w-6 h-6 text-emerald-600" /> : null })()}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{BUSINESS_TYPES.find(b => b.id === businessType)?.label}</p>
                    <p className="text-xs text-gray-500">{BUSINESS_TYPES.find(b => b.id === businessType)?.desc}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre del negocio *</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Ej: La Burguesa, Pet Shop Luna, Dr. García" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">← Atrás</button>
                <button onClick={handleRegister} disabled={loading || !businessName} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {loading ? 'Creando...' : 'Crear mi negocio'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          ¿Ya tenés cuenta? <Link href="/login" className="text-emerald-600 font-medium hover:underline">Iniciar sesión</Link>
        </p>
        <p className="text-center mt-2 text-xs text-gray-400">
          14 días de prueba gratis. Sin tarjeta de crédito.
        </p>
      </div>
    </main>
  )
}
