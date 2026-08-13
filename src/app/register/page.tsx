"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useI18n } from '@/i18n'
import { Package, Wrench, Layers, Search, ArrowLeft, ChevronRight, Check, User, Store } from 'lucide-react'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

// ─── Business categories ────────────────────────────────────────────────────

type OfferType = 'products' | 'services' | 'both'
type FunctionalType = 'food' | 'appointment' | 'task' | 'realtime' | 'food+appointment'
type OperationType = 'independent' | 'business'
type BusinessCategory = { id: string; functionalType: FunctionalType; featured: boolean }

const PRODUCT_CATEGORIES: BusinessCategory[] = [
  { id: 'restaurante', functionalType: 'food', featured: true },
  { id: 'pizzeria', functionalType: 'food', featured: true },
  { id: 'cafe', functionalType: 'food', featured: true },
  { id: 'heladeria', functionalType: 'food', featured: true },
  { id: 'panaderia', functionalType: 'food', featured: true },
  { id: 'hamburgueseria', functionalType: 'food', featured: false },
  { id: 'sushi', functionalType: 'food', featured: false },
  { id: 'rotiseria', functionalType: 'food', featured: false },
]

const SERVICE_CATEGORIES: BusinessCategory[] = [
  { id: 'peluqueria', functionalType: 'appointment', featured: true },
  { id: 'barberia', functionalType: 'appointment', featured: true },
  { id: 'medico', functionalType: 'appointment', featured: true },
  { id: 'dentista', functionalType: 'appointment', featured: true },
  { id: 'spa', functionalType: 'appointment', featured: true },
  { id: 'electricista', functionalType: 'task', featured: true },
  { id: 'plomero', functionalType: 'task', featured: true },
  { id: 'remis', functionalType: 'realtime', featured: true },
  { id: 'cadeteria', functionalType: 'realtime', featured: true },
  { id: 'flete', functionalType: 'realtime', featured: true },
  { id: 'profesor', functionalType: 'appointment', featured: false },
  { id: 'psicologo', functionalType: 'appointment', featured: false },
  { id: 'disenador', functionalType: 'task', featured: false },
  { id: 'limpieza', functionalType: 'task', featured: false },
  { id: 'taller-mecanico', functionalType: 'task', featured: false },
  { id: 'servicio-otro', functionalType: 'task', featured: false },
]

const BOTH_CATEGORIES: BusinessCategory[] = [
  { id: 'cafe-coworking', functionalType: 'food+appointment', featured: true },
]

function getCategoriesForType(type: OfferType): BusinessCategory[] {
  switch (type) {
    case 'products': return PRODUCT_CATEGORIES
    case 'services': return SERVICE_CATEGORIES
    case 'both': return BOTH_CATEGORIES
  }
}

// ─── Plans ───────────────────────────────────────────────────────────────────

const PLAN_IDS = ['free', 'pro', 'business', 'enterprise'] as const
const PLAN_PRICES: Record<string, number> = { free: 0, pro: 29, business: 99, enterprise: 249 }
const PLAN_FEATURE_COUNT: Record<string, number> = { free: 7, pro: 7, business: 7, enterprise: 7 }
const PLAN_POPULAR: Record<string, boolean> = { free: false, pro: true, business: false, enterprise: false }

// ─── Component ───────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useI18n()
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
      const label = t(`register.categories.${c.id}`).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return label.includes(q)
    })
  }, [categories, categorySearch, t])

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
      setError(t('register.errorGoogleRegister'))
    } finally { setLoading(false) }
  }, [t])

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
    if (!businessName.trim()) { setError(t('register.errorName')); return }
    setLoading(true)
    setError('')
    try {
      if (!isGoogleUser) {
        if (!name || !email || !password) { setError(t('register.errorFields')); return }
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
      setError(e?.message || t('register.errorRegister'))
    } finally { setLoading(false) }
  }

  const totalSteps = 6

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">Runbits</Link>
          <p className="text-sm text-gray-500 mt-2">{t('register.subtitle')}</p>
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
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('register.step1.title')}</h2>
              <p className="text-sm text-gray-500 mb-5">{t('register.step1.subtitle')}</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('register.nameLabel')}</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder={t('register.namePlaceholder')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('register.emailLabel')}</label>
                  <input type="email" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('register.emailPlaceholder')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('register.phoneLabel')}</label>
                  <input type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('register.phonePlaceholder')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('register.passwordLabel')}</label>
                  <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('register.passwordPlaceholder')} />
                </div>
              </div>
              {GOOGLE_CLIENT_ID && (
                <>
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">{t('register.orRegisterWith')}</span></div>
                  </div>
                  <div id="google-register-btn" className="flex justify-center mb-4" />
                </>
              )}
              <button onClick={() => { if (!name || !email || !password) { setError(t('register.completeFields')); return }; setError(''); setStep(2) }} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                {t('register.next')}
              </button>
            </div>
          )}

          {/* ─── Step 2: Offer type ─── */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('register.step2.title')}</h2>
              <p className="text-sm text-gray-500 mb-5">{t('register.step2.subtitle')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { type: 'products' as OfferType, labelKey: 'register.step2.products', descKey: 'register.step2.productsDesc', Icon: Package },
                  { type: 'services' as OfferType, labelKey: 'register.step2.services', descKey: 'register.step2.servicesDesc', Icon: Wrench },
                  { type: 'both' as OfferType, labelKey: 'register.step2.both', descKey: 'register.step2.bothDesc', Icon: Layers },
                ]).map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => { setOfferType(opt.type); setSelectedCategory(null); setCategorySearch(''); setStep(3) }}
                    className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                  >
                    <opt.Icon className="w-7 h-7 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <p className="text-sm font-bold text-gray-900 mt-2">{t(opt.labelKey)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t(opt.descKey)}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> {t('register.back')}
              </button>
            </div>
          )}

          {/* ─── Step 3: Business category ─── */}
          {step === 3 && offerType && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('register.step3.title')}</h2>
              <p className="text-sm text-gray-500 mb-4">{t('register.step3.subtitle')}</p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder={t('register.step3.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredCategories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`text-left p-3 rounded-xl border-2 transition-all ${selectedCategory === cat.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-sm font-semibold ${selectedCategory === cat.id ? 'text-indigo-700' : 'text-gray-900'}`}>{t(`register.categories.${cat.id}`)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      {t(`register.dashboardPreview.${cat.functionalType}`)}
                    </p>
                  </button>
                ))}
              </div>
              {filteredCategories.length === 0 && <p className="text-center text-sm text-gray-400 py-6">{t('register.step3.notFound')}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> {t('register.back')}
                </button>
                <button onClick={() => { if (!selectedCategory) return; setStep(4) }} disabled={!selectedCategory} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {t('register.next')}
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Operation type ─── */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('register.step4.title')}</h2>
              <p className="text-sm text-gray-500 mb-5">{t('register.step4.subtitle')}</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  {
                    type: 'independent' as OperationType,
                    labelKey: 'register.step4.independent',
                    descKey: 'register.step4.independentDesc',
                    examplesKey: 'register.step4.independentExamples',
                    Icon: User,
                  },
                  {
                    type: 'business' as OperationType,
                    labelKey: 'register.step4.business',
                    descKey: 'register.step4.businessDesc',
                    examplesKey: 'register.step4.businessExamples',
                    Icon: Store,
                  },
                ]).map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => { setOperationType(opt.type); setSelectedPlan('free'); setStep(5) }}
                    className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                  >
                    <opt.Icon className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <p className="text-sm font-bold text-gray-900 mt-3">{t(opt.labelKey)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t(opt.descKey)}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{t(opt.examplesKey)}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> {t('register.back')}
              </button>
            </div>
          )}

          {/* ─── Step 5: Plan selection ─── */}
          {step === 5 && operationType && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('register.step5.title')}</h2>
              <p className="text-sm text-gray-500 mb-5">
                {t('register.step5.subtitle')}
              </p>
              <div className="space-y-3">
                {PLAN_IDS.map(planId => {
                  const price = PLAN_PRICES[planId]
                  const featureCount = PLAN_FEATURE_COUNT[planId]
                  const isPopular = PLAN_POPULAR[planId]
                  return (
                    <button
                      key={planId}
                      onClick={() => setSelectedPlan(planId)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        selectedPlan === planId
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedPlan === planId ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {selectedPlan === planId && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{t(`register.plans.${planId}.name`)}</span>
                          {isPopular && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{t('register.step5.popular')}</span>}
                          <span className="text-sm font-bold text-gray-900 ml-auto">
                            {price === 0 ? t('register.step5.free') : `USD $${price}${t('register.step5.perMonth')}`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{t(`register.plans.${planId}.desc`)}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                          {Array.from({ length: featureCount }, (_, i) => (
                            <span key={i} className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Check className="w-3 h-3 text-indigo-400" /> {t(`register.plans.${planId}.f${i + 1}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> {t('register.back')}
                </button>
                <button onClick={() => setStep(6)} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  {t('register.next')}
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 6: Business name ─── */}
          {step === 6 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {operationType === 'independent' ? t('register.summary.titleProfile') : t('register.summary.titleBusiness')}
              </h2>
              <p className="text-sm text-gray-500 mb-5">{t('register.lastStep')}</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{chosenCategory ? t(`register.categories.${chosenCategory.id}`) : ''}</p>
                      <p className="text-xs text-gray-500">
                        {operationType === 'independent' ? t('register.summary.independent') : t('register.summary.business')} — Plan {t(`register.plans.${selectedPlan}.name`)}
                        {selectedPlan !== 'free' ? ` (USD $${PLAN_PRICES[selectedPlan]}${t('register.step5.perMonth')})` : ` (${t('register.step5.free')})`}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    {operationType === 'independent' ? t('register.summary.profileNameLabel') : t('register.summary.businessNameLabel')}
                  </label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder={operationType === 'independent' ? t('register.summary.profileNamePlaceholder') : t('register.summary.businessNamePlaceholder')}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(5)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> {t('register.back')}
                </button>
                <button onClick={handleRegister} disabled={loading || !businessName} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? t('register.creating') : operationType === 'independent' ? t('register.createProfile') : t('register.createBusiness')}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          {t('register.alreadyHaveAccount')} <Link href="/login" className="text-indigo-600 font-medium hover:underline">{t('register.login')}</Link>
        </p>
      </div>
    </main>
  )
}
