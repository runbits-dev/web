"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => { api.me().then(setUser) }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
        <h2 className="font-semibold text-slate-900 mb-4">Tu cuenta</h2>
        <div className="space-y-3">
          <div><p className="text-xs text-slate-500 mb-1">Nombre</p><p className="text-sm font-medium text-slate-900">{user?.name || '—'}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Email</p><p className="text-sm font-medium text-slate-900">{user?.email || '—'}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Rol</p><p className="text-sm font-medium text-slate-900">{user?.role || '—'}</p></div>
        </div>
      </div>
    </div>
  )
}
