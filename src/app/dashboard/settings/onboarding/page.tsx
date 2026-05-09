"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Check } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { api } from '@/lib/api'
import {
  getStepsForBusinessType,
  getSkippedSteps,
  unskipAll,
  type OnboardingStep,
} from '@/lib/onboarding'

export default function OnboardingSettingsPage() {
  const { activeProfile, refreshProfiles } = useProfile()
  const [skipped, setSkipped] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (activeProfile) setSkipped(getSkippedSteps(activeProfile.id))
  }, [activeProfile?.id])

  const steps: OnboardingStep[] = useMemo(
    () => activeProfile ? getStepsForBusinessType(activeProfile.business_type) : [],
    [activeProfile]
  )

  if (!activeProfile) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-slate-500">Necesitás un perfil activo.</p>
      </div>
    )
  }

  async function reactivate() {
    if (!activeProfile) return
    setSaving('reactivate')
    try {
      unskipAll(activeProfile.id)
      await api.updateProfile(activeProfile.id, { tutorialCompleted: false, tutorialStep: 0 })
      await refreshProfiles()
      setSkipped([])
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch {}
    setSaving(null)
  }

  async function dismissForever() {
    if (!activeProfile) return
    setSaving('dismiss')
    try {
      await api.updateProfile(activeProfile.id, { tutorialCompleted: true })
      await refreshProfiles()
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch {}
    setSaving(null)
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/settings" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver a configuración
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Onboarding</h1>
        <p className="text-slate-500 text-sm mt-1">Gestioná los pasos de bienvenida para tu comercio.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Estado actual</h2>
        <p className="text-sm text-slate-500 mb-4">
          {activeProfile.tutorial_completed
            ? 'Tu checklist de onboarding está cerrado.'
            : `Tenés un onboarding activo con ${steps.length} pasos.`}
        </p>

        <ul className="space-y-2 mt-4">
          {steps.map(s => {
            const isSkipped = skipped.includes(s.id)
            return (
              <li key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isSkipped ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isSkipped ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-indigo-700'}`}>
                  {isSkipped ? '—' : '·'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isSkipped ? 'line-through' : 'text-slate-900'}`}>{s.label}</p>
                  <p className="text-xs text-slate-400">{s.description}</p>
                </div>
                {isSkipped && <span className="text-xs text-slate-400">Saltado</span>}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900 mb-1">Acciones</h2>
          <p className="text-sm text-slate-500">Reactivá el checklist o cerralo definitivamente.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reactivate}
            disabled={saving === 'reactivate'}
            className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4 inline-block mr-2 align-text-bottom" />
            Reactivar onboarding
          </button>
          <button
            onClick={dismissForever}
            disabled={saving === 'dismiss' || activeProfile.tutorial_completed}
            className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Saltar onboarding completo
          </button>
        </div>

        {done && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
            <Check className="w-4 h-4" /> Cambios guardados
          </div>
        )}
      </div>
    </div>
  )
}
