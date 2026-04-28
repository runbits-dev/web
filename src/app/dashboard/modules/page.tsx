"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { MODULES, MODULE_CATEGORIES, getModulesForType, isModuleIncludedInPlan, isModuleAvailableForPlan, type Module } from '@/lib/modules'
import { Check, Lock, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useProfile } from '@/context/ProfileContext'

export default function ModulesPage() {
  const { activeProfile } = useProfile()
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [activeModules, setActiveModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const businessType = activeProfile?.business_type ?? 'goods'

  useEffect(() => {
    api.me().then(u => {
      if (u.restaurant_id) {
        api.getModules(u.restaurant_id)
          .then(mods => setActiveModules(mods.map((m: any) => m.module_id)))
          .catch(() => {})

        api.getSubscriptionLimits(u.restaurant_id)
          .then(data => setCurrentPlan(data.plan || 'free'))
          .catch(() => {})
      }
    }).finally(() => setLoading(false))
  }, [])

  const availableModules = getModulesForType(businessType)

  const filtered = filter === 'all'
    ? availableModules
    : availableModules.filter(m => m.category === filter)

  async function handleActivate(moduleId: string) {
    setActivating(moduleId)
    try {
      const user = await api.me()
      if (user.restaurant_id) {
        await api.activateModule(user.restaurant_id, moduleId)
        setActiveModules(prev => [...prev, moduleId])
      }
    } catch (e: any) {
      alert(e.message || 'Error al activar módulo')
    }
    setActivating(null)
  }

  async function handleDeactivate(moduleId: string) {
    setActivating(moduleId)
    try {
      const user = await api.me()
      if (user.restaurant_id) {
        await api.deactivateModule(user.restaurant_id, moduleId)
        setActiveModules(prev => prev.filter(id => id !== moduleId))
      }
    } catch (e: any) {
      alert(e.message || 'Error al desactivar módulo')
    }
    setActivating(null)
  }

  function getModuleStatus(mod: Module): 'included' | 'active' | 'available' | 'upgrade' {
    if (isModuleIncludedInPlan(mod, currentPlan)) return 'included'
    if (activeModules.includes(mod.id)) return 'active'
    if (isModuleAvailableForPlan(mod, currentPlan)) return 'available'
    return 'upgrade'
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Módulos</h1>
        <p className="text-slate-500 text-sm mt-1">Ampliá las funcionalidades de tu negocio con módulos adicionales.</p>
        <p className="text-xs text-slate-400 mt-1">
          Plan actual: <span className="font-semibold text-slate-600 capitalize">{currentPlan}</span>
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
        {MODULE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(mod => {
          const status = getModuleStatus(mod)
          return (
            <div key={mod.id} className={`bg-white rounded-2xl border p-5 flex flex-col ${
              status === 'included' || status === 'active'
                ? 'border-indigo-200 bg-indigo-50/30'
                : 'border-slate-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                {status === 'included' && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Incluido
                  </span>
                )}
                {status === 'active' && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Activo
                  </span>
                )}
                {status === 'upgrade' && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {mod.minPlan}+
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex-1">{mod.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  {mod.price === 0 ? 'Incluido en plan' : `USD $${mod.price}/mes`}
                </span>
                {status === 'included' && (
                  <span className="text-xs text-indigo-600 font-medium">Activo</span>
                )}
                {status === 'active' && (
                  <button
                    onClick={() => handleDeactivate(mod.id)}
                    disabled={activating === mod.id}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    {activating === mod.id ? '...' : 'Desactivar'}
                  </button>
                )}
                {status === 'available' && (
                  <button
                    onClick={() => handleActivate(mod.id)}
                    disabled={activating === mod.id}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    {activating === mod.id ? 'Activando...' : 'Activar'}
                  </button>
                )}
                {status === 'upgrade' && (
                  <Link
                    href="/dashboard/subscription"
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                  >
                    Upgrade <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No hay módulos disponibles en esta categoría para tu tipo de negocio.
        </div>
      )}
    </div>
  )
}
