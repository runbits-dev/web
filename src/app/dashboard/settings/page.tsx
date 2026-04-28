"use client"

import { useEffect, useState } from 'react'
import { api, User } from '@/lib/api'
import { RotateCcw, Pencil, Plus, Check as CheckIcon, ShieldCheck } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useUser } from '@/context/UserContext'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

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
  const { activeProfile, profiles, switchProfile, refreshProfiles } = useProfile()
  const { user, refreshUser } = useUser()
  const [restaurant, setRestaurant] = useState<any | null>(null)
  const restaurantId = user?.restaurant_id || null
  const [restaurantLoading, setRestaurantLoading] = useState(!!user?.restaurant_id)
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(!!user?.totp_enabled)
  const [twoFASetup, setTwoFASetup] = useState<{ secret: string; otpAuthUrl: string } | null>(null)
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFAError, setTwoFAError] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableError, setDisableError] = useState('')

  // Stripe Connect
  const [connectStatus, setConnectStatus] = useState<{ connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; accountId?: string } | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)

  // Profile form
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
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
    if (!user?.restaurant_id) return
    api.getRestaurant(user.restaurant_id).then(r => {
      setRestaurant(r)
      setRestaurantForm({
        name: r.name || '',
        address: r.address || '',
        phone: r.phone || '',
        description: r.description || '',
        is_open: r.is_open ?? false,
        opening_hours: r.opening_hours || DEFAULT_OPENING_HOURS,
      })
    }).catch(() => {}).finally(() => setRestaurantLoading(false))
    api.getConnectStatus(user.restaurant_id).then(setConnectStatus).catch(() => {})
  }, [user?.restaurant_id])

  async function startSetup() {
    setTwoFALoading(true)
    setTwoFAError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/auth/2fa/setup`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setTwoFASetup(await res.json())
    } catch { setTwoFAError('Error al iniciar setup') }
    setTwoFALoading(false)
  }

  async function confirmSetup() {
    setTwoFALoading(true)
    setTwoFAError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/auth/2fa/verify-setup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: twoFACode }),
      })
      if (res.ok) { setTwoFAEnabled(true); setTwoFASetup(null); setTwoFACode('') }
      else { const d = await res.json(); setTwoFAError(d.error || 'Código incorrecto') }
    } catch { setTwoFAError('Error de conexión') }
    setTwoFALoading(false)
  }

  async function disable2FA() {
    setTwoFALoading(true)
    setDisableError('')
    try {
      const token = localStorage.getItem('token')
      const payload: { code: string; password?: string } = { code: disableCode }
      if (disablePassword) payload.password = disablePassword
      const res = await fetch(`${API_BASE}/api/auth/2fa/disable`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.ok) { setTwoFAEnabled(false); setDisableCode(''); setDisablePassword('') }
      else { const d = await res.json(); setDisableError(d.error || 'Error al desactivar') }
    } catch { setDisableError('Error de conexión') }
    setTwoFALoading(false)
  }

  async function handleConnectOnboard() {
    if (!restaurantId || !user) return
    setConnectLoading(true)
    try {
      const { url } = await api.startConnectOnboarding(restaurantId, restaurant?.name || '', user.email)
      window.location.href = url
    } catch (e: any) {
      alert(e.message || 'Error al iniciar onboarding')
    } finally {
      setConnectLoading(false)
    }
  }

  async function saveProfile() {
    if (!profileForm.name.trim()) { setProfileError('El nombre es obligatorio'); return }
    setSavingProfile(true)
    setProfileError(null)
    try {
      await api.updateAccount({ name: profileForm.name.trim(), phone: profileForm.phone.trim() || undefined })
      await refreshUser()
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

  if (!user || restaurantLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    )
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
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
            <p className="text-sm text-indigo-700 font-medium">Cambios guardados correctamente</p>
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
            <h2 className="font-semibold text-slate-900">Tu negocio</h2>
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
            <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
              <p className="text-sm text-indigo-700 font-medium">Negocio actualizado correctamente</p>
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
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${restaurant?.is_open ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${restaurant?.is_open ? 'bg-indigo-500' : 'bg-slate-300'}`} />
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

      {/* Perfiles */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Mis perfiles</h2>
          <Link
            href="/dashboard?new-profile=1"
            className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Agregar perfil
          </Link>
        </div>
        <div className="space-y-3">
          {profiles.map(p => (
            <ProfileCard key={p.id} profile={p} isActive={p.id === activeProfile?.id} isOnly={profiles.length <= 1} onSwitch={() => switchProfile(p.id)} onUpdate={refreshProfiles} />
          ))}
        </div>
      </div>

      {/* Pagos */}
      {restaurantId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
          <h2 className="font-semibold text-slate-900 mb-4">Pagos</h2>
          {connectStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-900">Pagos activos</span>
              </div>
              <p className="text-xs text-slate-500">Los pagos de tus clientes se depositan en tu cuenta de Stripe.</p>
              {!connectStatus.chargesEnabled && (
                <p className="text-xs text-amber-600">Stripe está verificando tu cuenta. Los pagos se habilitarán pronto.</p>
              )}
              {connectStatus.accountId && (
                <p className="text-xs text-slate-400">Cuenta: {connectStatus.accountId.slice(0, 8)}••••{connectStatus.accountId.slice(-4)}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500 mb-4">Conectá tu cuenta de Stripe para recibir pagos de tus clientes.</p>
              <button onClick={handleConnectOnboard} disabled={connectLoading}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {connectLoading ? 'Procesando...' : 'Activar pagos'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seguridad */}
      {twoFAEnabled ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
          <h2 className="font-semibold text-slate-900 mb-4">Seguridad</h2>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">2FA activado</p>
              <p className="text-xs text-slate-400">Tu cuenta está protegida con autenticación en dos pasos.</p>
            </div>
          </div>
          <div className="space-y-3">
            <input type="text" inputMode="numeric" maxLength={6} value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Código authenticator" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            <input type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)}
              placeholder="Contraseña" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            {disableError && <p className="text-sm text-red-500">{disableError}</p>}
            <button onClick={disable2FA} disabled={twoFALoading || disableCode.length !== 6}
              className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
              Desactivar 2FA
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
          <h2 className="font-semibold text-slate-900 mb-4">Seguridad</h2>
          <div className="mb-4">
            <p className="text-sm text-slate-600">Autenticación en dos pasos (2FA)</p>
            <p className="text-xs text-slate-400 mt-1">Agregá una capa extra de seguridad a tu cuenta usando Google Authenticator o similar.</p>
          </div>

          {!twoFASetup ? (
            <button onClick={startSetup} disabled={twoFALoading} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
              Activar 2FA
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-700 text-center py-4">Ingresá este código en tu app authenticator:</p>
              <code className="block text-center bg-slate-100 px-4 py-3 rounded-xl text-lg font-mono tracking-wider">{twoFASetup.secret}</code>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Código de verificación</label>
                <input type="text" inputMode="numeric" maxLength={6} value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-[0.3em]" />
              </div>
              {twoFAError && <p className="text-sm text-red-500">{twoFAError}</p>}
              <button onClick={confirmSetup} disabled={twoFALoading || twoFACode.length !== 6}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {twoFALoading ? 'Verificando...' : 'Confirmar y activar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ayuda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Ayuda</h2>
        <button
          onClick={async () => {
            if (activeProfile) {
              await api.updateProfile(activeProfile.id, { tutorialCompleted: false, tutorialStep: 0 })
              window.location.href = '/dashboard'
            }
          }}
          className="text-sm text-indigo-600 font-medium hover:underline"
        >
          <RotateCcw className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Ver tutorial de nuevo
        </button>
      </div>
    </div>
  )
}

function ProfileCard({ profile, isActive, isOnly, onSwitch, onUpdate }: { profile: any; isActive: boolean; isOnly: boolean; onSwitch: () => void; onUpdate: () => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.display_name)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await api.updateProfile(profile.id, { displayName: name.trim() })
      await onUpdate()
      setEditing(false)
    } catch {}
    setSaving(false)
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Estás seguro de que querés eliminar "${profile.display_name}"?\n\nSe van a eliminar todos los datos de este perfil: catálogo, pedidos, configuración, módulos y suscripción.\n\nSi tiene un plan de pago activo, se cancelará automáticamente.\n\nEsta acción no se puede deshacer.`
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      // Cancel subscription if profile has a store_id
      if (profile.store_id) {
        try {
          const sub = await fetch(`/api/subscriptions/${profile.store_id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }).then(r => r.ok ? r.json() : null)
          if (sub?.id && sub.status !== 'cancelled') {
            await fetch(`/api/subscriptions/${sub.id}/cancel`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
          }
        } catch {}
      }
      await api.deleteProfile(profile.id)
      await onUpdate()
      if (isActive) window.location.reload()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar el perfil')
    }
    setDeleting(false)
  }

  return (
    <div className={`p-3 rounded-xl border-2 transition-all ${isActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
              <button onClick={save} disabled={saving} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {saving ? '...' : 'Guardar'}
              </button>
              <button onClick={() => { setName(profile.display_name); setEditing(false) }} className="text-xs text-slate-500 hover:text-slate-700">
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{profile.display_name}</p>
                <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-indigo-600">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-500 capitalize">{profile.business_category} — {profile.operation_type === 'independent' ? 'Independiente' : 'Negocio'}</p>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-2 shrink-0">
            {isActive ? (
              <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Activo</span>
            ) : (
              <button onClick={onSwitch} className="text-xs text-indigo-600 font-medium hover:underline">Cambiar</button>
            )}
            {!isOnly && (
              <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50">
                {deleting ? '...' : 'Eliminar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
