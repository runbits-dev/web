"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const BUSINESS_TYPES = [
  { id: 'restaurant', label: 'Restaurante / Comida', icon: '🍽️', desc: 'Delivery de comida, café, panadería, heladería' },
  { id: 'store', label: 'Tienda / Retail', icon: '🛍️', desc: 'Ropa, electrónica, accesorios, productos físicos' },
  { id: 'grocery', label: 'Supermercado / Almacén', icon: '🛒', desc: 'Alimentos, bebidas, productos del hogar' },
  { id: 'pharmacy', label: 'Farmacia / Salud', icon: '💊', desc: 'Medicamentos, perfumería, productos de salud' },
  { id: 'services', label: 'Servicios profesionales', icon: '💼', desc: 'Turnos, consultas, reparaciones, clases' },
  { id: 'beauty', label: 'Belleza / Estética', icon: '💇', desc: 'Peluquería, spa, manicura, barbería' },
  { id: 'pets', label: 'Mascotas', icon: '🐾', desc: 'Pet shop, veterinaria, peluquería canina' },
  { id: 'other', label: 'Otro', icon: '📦', desc: 'Cualquier otro tipo de negocio' },
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
              <button onClick={() => { if (!name || !email || !password) { setError('Completá nombre, email y contraseña'); return } setError(''); setStep(2) }} className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
                Siguiente →
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
                    <span className="text-2xl">{bt.icon}</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{bt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bt.desc}</p>
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
                  <span className="text-2xl">{BUSINESS_TYPES.find(b => b.id === businessType)?.icon}</span>
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
