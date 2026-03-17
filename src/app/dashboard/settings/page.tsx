"use client"

import { useEffect, useState } from 'react'
import { api, User } from '@/lib/api'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.me().then(u => {
      setUser(u)
      setForm({ name: u.name || '', phone: u.phone || '' })
    })
  }, [])

  function startEdit() {
    if (!user) return
    setForm({ name: user.name || '', phone: user.phone || '' })
    setError(null)
    setSuccess(false)
    setEditing(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const updated = await api.updateProfile({ name: form.name.trim(), phone: form.phone.trim() || undefined })
      setUser(updated)
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel: Record<string, string> = {
    superadmin: 'Superadmin',
    restaurant_owner: 'Dueño de restaurante',
    rider: 'Repartidor',
    customer: 'Cliente',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Tu cuenta</h2>
          {!editing && (
            <button
              onClick={startEdit}
              className="text-sm text-slate-500 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <p className="text-sm text-emerald-700 font-medium">Cambios guardados correctamente</p>
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre *</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Teléfono</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="text-sm text-slate-400">{user?.email || '—'} <span className="text-xs">(no editable)</span></p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div><p className="text-xs text-slate-500 mb-1">Nombre</p><p className="text-sm font-medium text-slate-900">{user?.name || '—'}</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Email</p><p className="text-sm font-medium text-slate-900">{user?.email || '—'}</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Teléfono</p><p className="text-sm font-medium text-slate-900">{user?.phone || '—'}</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Rol</p><p className="text-sm font-medium text-slate-900">{user?.role ? (roleLabel[user.role] || user.role) : '—'}</p></div>
          </div>
        )}
      </div>
    </div>
  )
}
