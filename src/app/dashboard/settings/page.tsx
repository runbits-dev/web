"use client"

import { useEffect, useState } from 'react'
import { api, User } from '@/lib/api'

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DEFAULT_HOURS = { open: '09:00', close: '22:00', closed: false }

const DEFAULT_OPENING_HOURS = {
  monday: { ...DEFAULT_HOURS },
  tuesday: { ...DEFAULT_HOURS },
  wednesday: { ...DEFAULT_HOURS },
  thursday: { ...DEFAULT_HOURS },
  friday: { ...DEFAULT_HOURS },
  saturday: { ...DEFAULT_HOURS },
  sunday: { open: '10:00', close: '20:00', closed: false },
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [restaurant, setRestaurant] = useState<any | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  // Profile form
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Restaurant form
  const [editingRestaurant, setEditingRestaurant] = useState(false)
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    is_open: false,
    opening_hours: DEFAULT_OPENING_HOURS as Record<string, { open: string; close: string; closed: boolean }>,
  })
  const [savingRestaurant, setSavingRestaurant] = useState(false)
  const [restaurantSuccess, setRestaurantSuccess] = useState(false)
  const [restaurantError, setRestaurantError] = useState<string | null>(null)

  useEffect(() => {
    api.me().then(u => {
      setUser(u)
      setProfileForm({ name: u.name || '', phone: u.phone || '' })
      if (u.restaurant_id) {
        setRestaurantId(u.restaurant_id)
        api.getRestaurant(u.restaurant_id).then(r => {
          setRestaurant(r)
          setRestaurantForm({
            name: r.name || '',
            address: r.address || '',
            phone: r.phone || '',
            description: r.description || '',
            is_open: r.is_open ?? false,
            opening_hours: r.opening_hours || DEFAULT_OPENING_HOURS,
          })
        }).catch(() => {})
      }
    })
  }, [])

  async function saveProfile() {
    if (!profileForm.name.trim()) { setProfileError('El nombre es obligatorio'); return }
    setSavingProfile(true)
    setProfileError(null)
    try {
      const updated = await api.updateProfile({ name: profileForm.name.trim(), phone: profileForm.phone.trim() || undefined })
      setUser(updated)
      setEditingProfile(false)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (e: any) {
      setProfileError(e.message || 'Error al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveRestaurant() {
    if (!restaurantId) return
    if (!restaurantForm.name.trim()) { setRestaurantError('El nombre es obligatorio'); return }
    setSavingRestaurant(true)
    setRestaurantError(null)
    try {
      const updated = await api.updateRestaurant(restaurantId, {
        name: restaurantForm.name.trim(),
        address: restaurantForm.address.trim(),
        phone: restaurantForm.phone.trim(),
        description: restaurantForm.description.trim(),
        is_open: restaurantForm.is_open,
        opening_hours: restaurantForm.opening_hours,
      })
      setRestaurant(updated)
      setEditingRestaurant(false)
      setRestaurantSuccess(true)
      setTimeout(() => setRestaurantSuccess(false), 3000)
    } catch (e: any) {
      setRestaurantError(e.message || 'Error al guardar')
    } finally {
      setSavingRestaurant(false)
    }
  }

  const roleLabel: Record<string, string> = {
    superadmin: 'Superadmin',
    restaurant_owner: 'Dueño de restaurante',
    rider: 'Repartidor',
    customer: 'Cliente',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
      </div>

      {/* ── Perfil de usuario ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Tu cuenta</h2>
          {!editingProfile && (
            <button
              onClick={() => { setProfileForm({ name: user?.name || '', phone: user?.phone || '' }); setProfileError(null); setProfileSuccess(false); setEditingProfile(true) }}
              className="text-sm text-slate-500 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {profileSuccess && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <p className="text-sm text-emerald-700 font-medium">Cambios guardados correctamente</p>
          </div>
        )}

        {editingProfile ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre *</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Teléfono</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="text-sm text-slate-400">{user?.email || '—'} <span className="text-xs">(no editable)</span></p>
            </div>
            {profileError && <p className="text-sm text-red-500">{profileError}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditingProfile(false)} className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={saveProfile} disabled={savingProfile} className="flex-1 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50">
                {savingProfile ? 'Guardando...' : 'Guardar'}
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

      {/* ── Configuración del restaurante ── */}
      {restaurantId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Tu restaurante</h2>
            {!editingRestaurant && (
              <button
                onClick={() => { setRestaurantError(null); setRestaurantSuccess(false); setEditingRestaurant(true) }}
                className="text-sm text-slate-500 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Editar
              </button>
            )}
          </div>

          {restaurantSuccess && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <p className="text-sm text-emerald-700 font-medium">Restaurante actualizado correctamente</p>
            </div>
          )}

          {editingRestaurant ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre del local *</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={restaurantForm.name}
                    onChange={e => setRestaurantForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Teléfono del local</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={restaurantForm.phone}
                    onChange={e => setRestaurantForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Dirección</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={restaurantForm.address}
                  onChange={e => setRestaurantForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Av. Corrientes 1234, CABA"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Descripción</label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  rows={2}
                  value={restaurantForm.description}
                  onChange={e => setRestaurantForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Breve descripción del restaurante..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_open"
                  checked={restaurantForm.is_open}
                  onChange={e => setRestaurantForm(f => ({ ...f, is_open: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="is_open" className="text-sm text-slate-700 font-medium">Abierto ahora</label>
              </div>

              {/* Horarios */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Horarios de apertura</p>
                <div className="space-y-2">
                  {Object.entries(restaurantForm.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 w-24 shrink-0">{DAY_LABELS[day]}</span>
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={e => setRestaurantForm(f => ({
                          ...f,
                          opening_hours: { ...f.opening_hours, [day]: { ...hours, closed: !e.target.checked } }
                        }))}
                        className="rounded"
                      />
                      {!hours.closed ? (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={e => setRestaurantForm(f => ({
                              ...f,
                              opening_hours: { ...f.opening_hours, [day]: { ...hours, open: e.target.value } }
                            }))}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <span className="text-slate-400 text-sm">—</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={e => setRestaurantForm(f => ({
                              ...f,
                              opening_hours: { ...f.opening_hours, [day]: { ...hours, close: e.target.value } }
                            }))}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {restaurantError && <p className="text-sm text-red-500">{restaurantError}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditingRestaurant(false)} className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={saveRestaurant} disabled={savingRestaurant} className="flex-1 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50">
                  {savingRestaurant ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500 mb-1">Nombre</p><p className="text-sm font-medium text-slate-900">{restaurant?.name || '—'}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Teléfono</p><p className="text-sm font-medium text-slate-900">{restaurant?.phone || '—'}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Dirección</p><p className="text-sm font-medium text-slate-900">{restaurant?.address || '—'}</p></div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Estado</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${restaurant?.is_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${restaurant?.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {restaurant?.is_open ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
              </div>
              {restaurant?.description && (
                <div><p className="text-xs text-slate-500 mb-1">Descripción</p><p className="text-sm text-slate-700">{restaurant.description}</p></div>
              )}
              {restaurant?.opening_hours && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Horarios</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(restaurant.opening_hours as Record<string, any>).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-20">{DAY_LABELS[day]}</span>
                        {hours.closed
                          ? <span className="text-slate-400 italic text-xs">Cerrado</span>
                          : <span className="text-slate-700">{hours.open} – {hours.close}</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ayuda */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Ayuda</h2>
        <button
          onClick={() => { localStorage.removeItem('tutorial_dismissed'); localStorage.removeItem('tutorial_step'); window.location.href = '/dashboard' }}
          className="text-sm text-emerald-600 font-medium hover:underline"
        >
          🔄 Ver tutorial de nuevo
        </button>
      </div>
    </div>
  )
}
