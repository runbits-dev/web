"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const FLAG_LABELS: Record<string, string> = {
  facebook_auth: 'Login con Facebook',
  apple_auth: 'Login con Apple',
  magic_link: 'Magic Link (email)',
  otp: 'OTP (SMS)',
  multi_profile: 'Multi-perfil',
  modules_marketplace: 'Marketplace de modulos',
}

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    api.getFeatureFlags()
      .then(data => setFlags(data.flags || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(flag: string) {
    const newValue = !flags[flag]
    setToggling(flag)
    try {
      await api.setFeatureFlag(flag, newValue)
      setFlags(prev => ({ ...prev, [flag]: newValue }))
      setSaved(flag)
      setTimeout(() => setSaved(null), 2000)
    } catch (e: any) {
      alert(e.message || 'Error al actualizar flag')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Feature Flags</h1>
        <p className="text-slate-500 text-sm mt-1">
          Activar o desactivar funcionalidades de la plataforma en tiempo real. Los cambios aplican inmediatamente.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando flags...</div>
        ) : Object.keys(flags).length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No se encontraron flags</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {Object.entries(flags).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{FLAG_LABELS[key] || key}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{key}</p>
                </div>
                <div className="flex items-center gap-3">
                  {saved === key && (
                    <span className="text-xs text-green-600 font-medium">Guardado</span>
                  )}
                  <button
                    onClick={() => handleToggle(key)}
                    disabled={toggling === key}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                      value ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                    aria-label={`Toggle ${key}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
