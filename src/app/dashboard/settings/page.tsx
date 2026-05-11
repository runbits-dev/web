"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { api, User } from '@/lib/api'
import {
  RotateCcw,
  Pencil,
  Plus,
  Check as CheckIcon,
  ShieldCheck,
  Fingerprint,
  Key,
  Activity,
  Smartphone,
  AlertTriangle,
  Copy,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useUser } from '@/context/UserContext'
import Link from 'next/link'
import { useI18n } from '@/i18n'
import { registerPasskey, isPasskeySupported, type RegisteredPasskey } from '@/lib/webauthn'
import { QRCodeSVG } from 'qrcode.react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

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
  const { t } = useI18n()
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
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)

  // Security: passkeys
  const [passkeys, setPasskeys] = useState<RegisteredPasskey[]>([])
  const [passkeysLoading, setPasskeysLoading] = useState(false)
  const [showAddPasskey, setShowAddPasskey] = useState(false)
  const [newPasskeyName, setNewPasskeyName] = useState('')
  const [passkeyError, setPasskeyError] = useState('')
  const [passkeyBusy, setPasskeyBusy] = useState(false)

  // Security: sessions
  type SessionRow = { tokenId: string; createdAt: number | null; ip: string | null; userAgent: string | null; isCurrentSession: boolean }
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsExpanded, setSessionsExpanded] = useState(false)

  // Security: audit log
  type AuditEntry = { id: string; action: string; ip: string | null; created_at: number; metadata: string | null }
  const [auditEvents, setAuditEvents] = useState<AuditEntry[]>([])
  const [auditExpanded, setAuditExpanded] = useState(false)

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
  // 0005_multi_currency: full list of LATAM-relevant currencies + USD/EUR.
  // The store charges in `default_currency`; `supported_currencies` is a
  // display-only allowlist surfaced to the buyer for preview.
  const SUPPORTED_CCYS = ['USD', 'ARS', 'BRL', 'CLP', 'MXN', 'PEN', 'COP', 'UYU', 'EUR'] as const
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    is_open: false,
    opening_hours: DEFAULT_OPENING_HOURS as Record<string, { open: string; close: string; closed: boolean }>,
    default_currency: 'USD' as string,
    supported_currencies: [] as string[],
  })
  const [savingRestaurant, setSavingRestaurant] = useState(false)
  const [restaurantSuccess, setRestaurantSuccess] = useState(false)
  const [restaurantError, setRestaurantError] = useState<string | null>(null)
  const [convertCcy, setConvertCcy] = useState<string>('USD')
  const [convertingCcy, setConvertingCcy] = useState(false)
  const [convertResult, setConvertResult] = useState<{ items_updated: number; variants_updated: number } | null>(null)

  useEffect(() => {
    if (!user?.restaurant_id) return
    api.getRestaurant(user.restaurant_id).then(r => {
      setRestaurant(r)
      let supported: string[] = []
      try {
        if (typeof r.supported_currencies === 'string' && r.supported_currencies.trim()) {
          const parsed = JSON.parse(r.supported_currencies)
          if (Array.isArray(parsed)) supported = parsed.filter((x): x is string => typeof x === 'string')
        } else if (Array.isArray(r.supported_currencies)) {
          supported = r.supported_currencies.filter((x: unknown): x is string => typeof x === 'string')
        }
      } catch { /* leave empty */ }
      setRestaurantForm({
        name: r.name || '',
        address: r.address || '',
        phone: r.phone || '',
        description: r.description || '',
        is_open: r.is_open ?? false,
        opening_hours: r.opening_hours || DEFAULT_OPENING_HOURS,
        default_currency: (r.default_currency || 'USD').toUpperCase(),
        supported_currencies: supported,
      })
    }).catch(() => {}).finally(() => setRestaurantLoading(false))
    api.getConnectStatus(user.restaurant_id).then(setConnectStatus).catch(() => {})
  }, [user?.restaurant_id])

  const loadPasskeys = useCallback(async () => {
    setPasskeysLoading(true)
    try {
      const res = await authedFetch('/api/auth/webauthn/credentials')
      if (res.ok) {
        const data = await res.json() as { credentials: RegisteredPasskey[] }
        setPasskeys(data.credentials || [])
      }
    } catch {} finally { setPasskeysLoading(false) }
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const res = await authedFetch('/api/auth/sessions')
      if (res.ok) {
        const data = await res.json() as { sessions: SessionRow[] }
        setSessions(data.sessions || [])
      }
    } catch {}
  }, [])

  const loadAudit = useCallback(async () => {
    try {
      const res = await authedFetch('/api/auth/audit-log')
      if (res.ok) {
        const data = await res.json() as { events: AuditEntry[] }
        setAuditEvents((data.events || []).slice(0, 30))
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!user) return
    loadPasskeys()
    loadSessions()
    loadAudit()
  }, [user, loadPasskeys, loadSessions, loadAudit])

  async function handleAddPasskey() {
    if (!newPasskeyName.trim()) return
    setPasskeyBusy(true)
    setPasskeyError('')
    try {
      await registerPasskey(newPasskeyName.trim())
      setNewPasskeyName('')
      setShowAddPasskey(false)
      await loadPasskeys()
    } catch (e: any) {
      setPasskeyError(e?.message || t('settingsSecurity.passkeysError'))
    } finally {
      setPasskeyBusy(false)
    }
  }

  async function handleRevokePasskey(id: string) {
    const res = await authedFetch(`/api/auth/webauthn/credentials/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) await loadPasskeys()
  }

  async function handleCloseSession(tokenId: string) {
    const res = await authedFetch(`/api/auth/sessions/${encodeURIComponent(tokenId)}`, { method: 'DELETE' })
    if (res.ok) await loadSessions()
  }

  async function handleCloseAllSessions() {
    const res = await authedFetch('/api/auth/logout-all', { method: 'POST' })
    if (res.ok) {
      // current session is gone too — boot to /login
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
  }

  async function regenerateBackupCodes(password: string, code: string) {
    const res = await authedFetch('/api/auth/2fa/regenerate-backup-codes', {
      method: 'POST',
      body: JSON.stringify({ password, code }),
    })
    if (res.ok) {
      const data = await res.json() as { backupCodes: string[] }
      setBackupCodes(data.backupCodes)
    } else {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || 'Error')
    }
  }

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
      if (res.ok) {
        const data = await res.json() as { enabled?: boolean; backupCodes?: string[] }
        setTwoFAEnabled(true); setTwoFASetup(null); setTwoFACode('')
        if (data.backupCodes?.length) setBackupCodes(data.backupCodes)
      } else { const d = await res.json(); setTwoFAError(d.error || 'Código incorrecto') }
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

  // Bulk re-denominate every item in the store from `convertCcy` to the new
  // default_currency. Calls the dedicated endpoint added in 0005_multi_currency.
  async function runConvertCurrency() {
    if (!restaurantId) return
    setConvertingCcy(true)
    setConvertResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/items/convert-currency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
        },
        body: JSON.stringify({ from: convertCcy.toUpperCase(), to: restaurantForm.default_currency }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(detail || `HTTP ${res.status}`)
      }
      const payload = await res.json() as { items_updated: number; variants_updated: number }
      setConvertResult({ items_updated: payload.items_updated, variants_updated: payload.variants_updated })
    } catch (e: any) {
      setRestaurantError(e.message || 'Error en la conversión')
    } finally {
      setConvertingCcy(false)
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
        // 0005_multi_currency
        defaultCurrency: restaurantForm.default_currency,
        supportedCurrencies: restaurantForm.supported_currencies,
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

              {/* ── Multi-currency (0005) ── */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Moneda</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Moneda de cobro *</label>
                    <select
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={restaurantForm.default_currency}
                      onChange={e => setRestaurantForm(f => ({ ...f, default_currency: e.target.value }))}
                    >
                      {SUPPORTED_CCYS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Cobramos a tus compradores en esta moneda.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Monedas de visualización</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SUPPORTED_CCYS.map(c => {
                        const active = restaurantForm.supported_currencies.includes(c)
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setRestaurantForm(f => ({
                              ...f,
                              supported_currencies: active
                                ? f.supported_currencies.filter(x => x !== c)
                                : [...f.supported_currencies, c],
                            }))}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                              active
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {c}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Los compradores pueden previsualizar precios en cualquiera. El cargo siempre va en {restaurantForm.default_currency}.</p>
                  </div>
                </div>

                {/* Warning when changing default_currency away from current restaurant value */}
                {restaurant && (restaurant.default_currency || 'USD').toUpperCase() !== restaurantForm.default_currency.toUpperCase() && (
                  <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                    <p className="font-semibold mb-1">Vas a cambiar la moneda de {(restaurant.default_currency || 'USD').toUpperCase()} a {restaurantForm.default_currency}.</p>
                    <p>Los precios de tus productos siguen en {(restaurant.default_currency || 'USD').toUpperCase()}. Después de guardar, podés convertirlos masivamente con el botón debajo o editarlos uno por uno.</p>
                  </div>
                )}

                {/* Bulk currency converter */}
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Conversión masiva de precios</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Convertir todos los items de</span>
                    <select
                      value={convertCcy}
                      onChange={e => setConvertCcy(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                    >
                      {SUPPORTED_CCYS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="text-xs text-slate-500">a {restaurantForm.default_currency}</span>
                    <button
                      type="button"
                      onClick={runConvertCurrency}
                      disabled={convertingCcy || convertCcy === restaurantForm.default_currency}
                      className="ml-auto text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                    >
                      {convertingCcy ? 'Convirtiendo...' : 'Convertir ahora'}
                    </button>
                  </div>
                  {convertResult && (
                    <p className="text-[11px] text-emerald-700 mt-2">
                      ✓ {convertResult.items_updated} items y {convertResult.variants_updated} variantes convertidas.
                    </p>
                  )}
                </div>
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
      <SecuritySection
        user={user as any}
        twoFAEnabled={twoFAEnabled}
        twoFASetup={twoFASetup}
        twoFACode={twoFACode}
        setTwoFACode={setTwoFACode}
        twoFAError={twoFAError}
        twoFALoading={twoFALoading}
        startSetup={startSetup}
        confirmSetup={confirmSetup}
        disableCode={disableCode}
        setDisableCode={setDisableCode}
        disablePassword={disablePassword}
        setDisablePassword={setDisablePassword}
        disableError={disableError}
        disable2FA={disable2FA}
        passkeys={passkeys}
        passkeysLoading={passkeysLoading}
        showAddPasskey={showAddPasskey}
        setShowAddPasskey={setShowAddPasskey}
        newPasskeyName={newPasskeyName}
        setNewPasskeyName={setNewPasskeyName}
        passkeyError={passkeyError}
        passkeyBusy={passkeyBusy}
        handleAddPasskey={handleAddPasskey}
        handleRevokePasskey={handleRevokePasskey}
        sessions={sessions}
        sessionsExpanded={sessionsExpanded}
        setSessionsExpanded={setSessionsExpanded}
        handleCloseSession={handleCloseSession}
        handleCloseAllSessions={handleCloseAllSessions}
        auditEvents={auditEvents}
        auditExpanded={auditExpanded}
        setAuditExpanded={setAuditExpanded}
        backupCodes={backupCodes}
        setBackupCodes={setBackupCodes}
        regenerateBackupCodes={regenerateBackupCodes}
      />

      {backupCodes && (
        <BackupCodesModal codes={backupCodes} onClose={() => setBackupCodes(null)} />
      )}

      {/* Ayuda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <h2 className="font-semibold text-slate-900">Ayuda</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            onClick={async () => {
              if (activeProfile) {
                await api.updateProfile(activeProfile.id, { tutorialCompleted: false, tutorialStep: 0 })
                window.location.href = '/dashboard'
              }
            }}
            className="text-sm text-indigo-600 font-medium hover:underline text-left"
          >
            <RotateCcw className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Ver tutorial de nuevo
          </button>
          <a
            href="/dashboard/settings/onboarding"
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Gestionar onboarding
          </a>
        </div>
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

// ── Security section: score header + collapsible rows ──────────────────────

type SecuritySectionProps = {
  user: any
  twoFAEnabled: boolean
  twoFASetup: { secret: string; otpAuthUrl: string } | null
  twoFACode: string
  setTwoFACode: (v: string) => void
  twoFAError: string
  twoFALoading: boolean
  startSetup: () => void
  confirmSetup: () => void
  disableCode: string
  setDisableCode: (v: string) => void
  disablePassword: string
  setDisablePassword: (v: string) => void
  disableError: string
  disable2FA: () => void
  passkeys: RegisteredPasskey[]
  passkeysLoading: boolean
  showAddPasskey: boolean
  setShowAddPasskey: (v: boolean) => void
  newPasskeyName: string
  setNewPasskeyName: (v: string) => void
  passkeyError: string
  passkeyBusy: boolean
  handleAddPasskey: () => void
  handleRevokePasskey: (id: string) => void
  sessions: Array<{ tokenId: string; createdAt: number | null; ip: string | null; userAgent: string | null; isCurrentSession: boolean }>
  sessionsExpanded: boolean
  setSessionsExpanded: (v: boolean) => void
  handleCloseSession: (tokenId: string) => void
  handleCloseAllSessions: () => void
  auditEvents: Array<{ id: string; action: string; ip: string | null; created_at: number; metadata: string | null }>
  auditExpanded: boolean
  setAuditExpanded: (v: boolean) => void
  backupCodes: string[] | null
  setBackupCodes: (v: string[] | null) => void
  regenerateBackupCodes: (password: string, code: string) => Promise<void>
}

function SecuritySection(p: SecuritySectionProps) {
  const { t } = useI18n()
  const [twoFAOpen, setTwoFAOpen] = useState(false)
  const [passkeysOpen, setPasskeysOpen] = useState(false)
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenPassword, setRegenPassword] = useState('')
  const [regenCode, setRegenCode] = useState('')
  const [regenError, setRegenError] = useState('')
  const [regenBusy, setRegenBusy] = useState(false)

  const emailVerified = !!(p.user?.email_verified ?? p.user?.emailVerified ?? p.user?.email)
  const passwordOk = !!p.user?.email // assume password set if account exists
  const has2FA = p.twoFAEnabled
  const hasPasskey = p.passkeys.length > 0
  const sessionsActive = p.sessions.length > 0
  const auditAvailable = p.auditEvents.length > 0
  const hasBackupCodes = has2FA // backup codes ship with 2FA enable

  const score = useMemo(() => {
    const items = [emailVerified, passwordOk, has2FA, hasBackupCodes, hasPasskey, sessionsActive, auditAvailable]
    const total = items.length
    const ok = items.filter(Boolean).length
    return Math.round((ok / total) * 100)
  }, [emailVerified, passwordOk, has2FA, hasBackupCodes, hasPasskey, sessionsActive, auditAvailable])

  const scoreColor = score >= 90 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  const scoreEmoji = score >= 90 ? '🟢' : score >= 60 ? '🟡' : '🔴'
  const hint = !has2FA ? t('settingsSecurity.scoreHintLow') : !hasPasskey ? t('settingsSecurity.scoreHintMid') : t('settingsSecurity.scoreHintHigh')

  function fmt(ts: number | null) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl overflow-hidden">
      {/* Header card */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">{t('settingsSecurity.title')}</h2>
          <span className="text-xs text-slate-500">{scoreEmoji}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm text-slate-600">{t('settingsSecurity.scoreTitle')}:</span>
          <span className="text-2xl font-bold text-slate-900">{score}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div className={`h-full ${scoreColor} transition-all`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        <Row icon={<CheckIcon className="w-4 h-4" />} ok={emailVerified} label={t('settingsSecurity.scoreEmail')} />
        <Row icon={<CheckIcon className="w-4 h-4" />} ok={passwordOk} label={t('settingsSecurity.scorePassword')} />

        {/* 2FA */}
        <div>
          <button
            onClick={() => setTwoFAOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${has2FA ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {has2FA ? <CheckIcon className="w-3 h-3" /> : <span className="text-[10px]">○</span>}
              </span>
              <span className="text-sm text-slate-700">{t('settingsSecurity.score2FA')}</span>
            </div>
            <span className="text-sm text-indigo-600 font-medium">
              {has2FA ? t('settingsSecurity.actionView') : t('settingsSecurity.actionActivate')}
            </span>
          </button>
          {twoFAOpen && (
            <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
              {!p.twoFAEnabled && !p.twoFASetup && (
                <button onClick={p.startSetup} disabled={p.twoFALoading}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {t('settingsSecurity.actionActivate')}
                </button>
              )}
              {p.twoFASetup && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">Escaneá el QR con tu app authenticator (Google Authenticator, Authy, 1Password):</p>
                  <div className="flex justify-center bg-white border border-slate-200 rounded-xl p-4">
                    <QRCodeSVG value={p.twoFASetup.otpAuthUrl} size={192} level="M" includeMargin={false} />
                  </div>
                  <p className="text-xs text-slate-500 text-center">O ingresá manualmente este código:</p>
                  <code className="block bg-white border border-slate-200 px-4 py-3 rounded-xl text-base font-mono tracking-wider text-center break-all">{p.twoFASetup.secret}</code>
                  <input type="text" inputMode="numeric" maxLength={6} value={p.twoFACode}
                    onChange={e => p.setTwoFACode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-[0.3em]" />
                  {p.twoFAError && <p className="text-sm text-red-500">{p.twoFAError}</p>}
                  <button onClick={p.confirmSetup} disabled={p.twoFALoading || p.twoFACode.length !== 6}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                    {p.twoFALoading ? 'Verificando...' : 'Confirmar y activar'}
                  </button>
                </div>
              )}
              {p.twoFAEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">2FA activado</span>
                  </div>
                  <input type="text" inputMode="numeric" maxLength={6} value={p.disableCode}
                    onChange={e => p.setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Código authenticator"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                  <input type="password" value={p.disablePassword}
                    onChange={e => p.setDisablePassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                  {p.disableError && <p className="text-sm text-red-500">{p.disableError}</p>}
                  <button onClick={p.disable2FA} disabled={p.twoFALoading || p.disableCode.length !== 6}
                    className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
                    Desactivar 2FA
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Backup codes */}
        <div>
          <button
            onClick={() => setRegenOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${hasBackupCodes ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {hasBackupCodes ? <CheckIcon className="w-3 h-3" /> : <span className="text-[10px]">○</span>}
              </span>
              <span className="text-sm text-slate-700">{t('settingsSecurity.scoreBackupCodes')}</span>
            </div>
            {hasBackupCodes && <span className="text-sm text-indigo-600 font-medium">{t('settingsSecurity.actionConfigure')}</span>}
          </button>
          {regenOpen && hasBackupCodes && (
            <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
              <p className="text-xs text-slate-500">{t('settingsSecurity.backupCodesWarning')}</p>
              <input type="password" value={regenPassword} onChange={e => setRegenPassword(e.target.value)}
                placeholder="Contraseña" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input type="text" value={regenCode} onChange={e => setRegenCode(e.target.value)}
                placeholder="Código TOTP o backup" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              {regenError && <p className="text-sm text-red-500">{regenError}</p>}
              <button
                onClick={async () => {
                  setRegenBusy(true); setRegenError('')
                  try { await p.regenerateBackupCodes(regenPassword, regenCode); setRegenPassword(''); setRegenCode('') }
                  catch (e: any) { setRegenError(e?.message || 'Error') }
                  finally { setRegenBusy(false) }
                }}
                disabled={regenBusy || !regenPassword || !regenCode}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {regenBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settingsSecurity.backupCodesRegenerate')}
              </button>
            </div>
          )}
        </div>

        {/* Passkeys */}
        <div>
          <button
            onClick={() => setPasskeysOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${hasPasskey ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {hasPasskey ? <CheckIcon className="w-3 h-3" /> : <span className="text-[10px]">○</span>}
              </span>
              <Fingerprint className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">{t('settingsSecurity.passkeysTitle')}</span>
            </div>
            <span className="text-sm text-indigo-600 font-medium">
              {hasPasskey ? t('settingsSecurity.actionConfigure') : t('settingsSecurity.actionActivate')}
            </span>
          </button>
          {passkeysOpen && (
            <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
              <p className="text-xs text-slate-500">{t('settingsSecurity.passkeysSubtitle')}</p>
              {!isPasskeySupported() && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {t('settingsSecurity.passkeysUnsupported')}
                </div>
              )}
              {p.passkeys.length === 0 ? (
                <p className="text-sm text-slate-500 italic">{t('settingsSecurity.passkeysEmpty')}</p>
              ) : (
                <div className="space-y-2">
                  {p.passkeys.map(pk => (
                    <div key={pk.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{pk.deviceName || pk.deviceType || 'Passkey'}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {t('settingsSecurity.passkeysCreated')}: {fmt(pk.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => p.handleRevokePasskey(pk.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium ml-2 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!p.showAddPasskey ? (
                <button
                  onClick={() => p.setShowAddPasskey(true)}
                  disabled={!isPasskeySupported()}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t('settingsSecurity.passkeysAdd')}
                </button>
              ) : (
                <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3">
                  <input
                    value={p.newPasskeyName}
                    onChange={e => p.setNewPasskeyName(e.target.value)}
                    placeholder={t('settingsSecurity.passkeysNamePlaceholder')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  {p.passkeyError && <p className="text-xs text-red-500">{p.passkeyError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { p.setShowAddPasskey(false); p.setNewPasskeyName('') }}
                      className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg hover:bg-slate-50">
                      {t('settingsSecurity.passkeysCancel')}
                    </button>
                    <button onClick={p.handleAddPasskey} disabled={p.passkeyBusy || !p.newPasskeyName.trim()}
                      className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {p.passkeyBusy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('settingsSecurity.passkeysCreate')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sessions */}
        <div>
          <button
            onClick={() => p.setSessionsExpanded(!p.sessionsExpanded)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-700">
                <CheckIcon className="w-3 h-3" />
              </span>
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                {t('settingsSecurity.sessionsTitle')}: {p.sessions.length} {p.sessions.length === 1 ? t('settingsSecurity.device') : t('settingsSecurity.devices')}
              </span>
            </div>
            <span className="text-sm text-indigo-600 font-medium">{t('settingsSecurity.actionView')}</span>
          </button>
          {p.sessionsExpanded && (
            <div className="px-6 pb-5 pt-1 space-y-2 bg-slate-50/50">
              {p.sessions.length === 0 && <p className="text-sm text-slate-500 italic">{t('settingsSecurity.sessionsEmpty')}</p>}
              {p.sessions.map(s => (
                <div key={s.tokenId} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {s.userAgent?.slice(0, 50) || 'Dispositivo'}
                      {s.isCurrentSession && <span className="ml-2 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t('settingsSecurity.sessionsCurrent')}</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{s.ip || '—'} · {fmt(s.createdAt)}</p>
                  </div>
                  {!s.isCurrentSession && (
                    <button onClick={() => p.handleCloseSession(s.tokenId)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium ml-2 shrink-0">
                      {t('settingsSecurity.sessionsClose')}
                    </button>
                  )}
                </div>
              ))}
              {p.sessions.length > 1 && (
                <button onClick={p.handleCloseAllSessions}
                  className="text-sm text-red-500 hover:text-red-700 font-medium">
                  {t('settingsSecurity.sessionsCloseAll')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Audit log */}
        <div>
          <button
            onClick={() => p.setAuditExpanded(!p.auditExpanded)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-700">
                <CheckIcon className="w-3 h-3" />
              </span>
              <Key className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                {t('settingsSecurity.auditTitle')}: {p.auditEvents.length}
              </span>
            </div>
            <span className="text-sm text-indigo-600 font-medium">{t('settingsSecurity.actionView')}</span>
          </button>
          {p.auditExpanded && (
            <div className="px-6 pb-5 pt-1 space-y-1 bg-slate-50/50 max-h-80 overflow-y-auto">
              {p.auditEvents.length === 0 && <p className="text-sm text-slate-500 italic">{t('settingsSecurity.auditEmpty')}</p>}
              {p.auditEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{e.action}</p>
                    <p className="text-xs text-slate-500">{e.ip || '—'}</p>
                  </div>
                  <p className="text-xs text-slate-400 ml-2 shrink-0">{fmt(e.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ icon, ok, label }: { icon: React.ReactNode; ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
          {ok ? icon : <span className="text-[10px]">○</span>}
        </span>
        <span className="text-sm text-slate-700">{label}</span>
      </div>
    </div>
  )
}

// ── Backup codes modal ─────────────────────────────────────────────────────

function BackupCodesModal({ codes, onClose }: { codes: string[]; onClose: () => void }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const text = codes.join('\n')

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'runbits-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900">{t('settingsSecurity.backupCodesTitle')}</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">{t('settingsSecurity.backupCodesShownOnce')}</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {codes.map(c => (
              <div key={c} className="bg-white border border-slate-200 rounded px-2 py-1.5 text-center text-slate-900">
                {c}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <button onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium py-2 rounded-xl hover:bg-slate-50">
            <Copy className="w-4 h-4" /> {copied ? t('settingsSecurity.backupCodesCopied') : t('settingsSecurity.backupCodesCopy')}
          </button>
          <button onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium py-2 rounded-xl hover:bg-slate-50">
            <Download className="w-4 h-4" /> {t('settingsSecurity.backupCodesDownload')}
          </button>
        </div>
        <button onClick={onClose}
          className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700">
          {t('settingsSecurity.backupCodesDone')}
        </button>
      </div>
    </div>
  )
}
