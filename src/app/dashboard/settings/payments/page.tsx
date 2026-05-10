"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { API_BASE } from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { ProviderCard } from './ProviderCard'
import { ConnectableCard } from './ConnectableCard'
import { TransferConfigModal } from './TransferConfigModal'
import { CashConfigModal } from './CashConfigModal'
import { PROVIDERS, type PaymentMethod, type ProviderId, type ProviderInfo } from './types'

type Tier = 'free' | 'starter' | 'growth' | 'business'

type MyModulesResponse = {
  tier: Tier
  modules: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function jsonFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

function hasModule(modules: string[] | undefined, key: string): boolean {
  return Array.isArray(modules) && modules.includes(key)
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PaymentsSettingsPage() {
  const { activeProfile } = useProfile()
  const { t } = useI18n()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeId = activeProfile?.store_id ?? null

  const [me, setMe] = useState<MyModulesResponse | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferInitial, setTransferInitial] = useState<PaymentMethod | null>(null)
  const [cashModalOpen, setCashModalOpen] = useState(false)
  const [cashInitial, setCashInitial] = useState<PaymentMethod | null>(null)

  const [oauthStarting, setOauthStarting] = useState<ProviderId | null>(null)

  // ── Load tier + connected methods ────────────────────────────────────────
  const load = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [meRes, methodsRes] = await Promise.all([
        jsonFetch<MyModulesResponse>(
          `/api/billing/me/modules?restaurantId=${storeId}`,
        ).catch(() => null),
        jsonFetch<PaymentMethod[] | { methods: PaymentMethod[] }>(
          `/api/payments/methods?storeId=${storeId}`,
        ).catch(() => [] as PaymentMethod[]),
      ])
      setMe(meRes)
      const list = Array.isArray(methodsRes)
        ? methodsRes
        : (methodsRes?.methods ?? [])
      setMethods(list)
    } catch {
      setError(t('settingsPayments.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }, [storeId, t])

  useEffect(() => {
    load()
  }, [load])

  // ── Handle OAuth callback success (?connected=...) ───────────────────────
  useEffect(() => {
    const connected = searchParams.get('connected')
    const errParam = searchParams.get('error')
    if (connected) {
      const info = PROVIDERS.find((p) => p.id === (connected as ProviderId))
      toast(
        t('settingsPayments.toastConnected').replace('{name}', info?.name ?? connected),
        'success',
      )
      // Clean up the URL so a refresh doesn't re-fire the toast.
      router.replace('/dashboard/settings/payments')
      load()
    } else if (errParam) {
      toast(t('settingsPayments.toastConnectError'), 'error')
      router.replace('/dashboard/settings/payments')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // ── Actions ──────────────────────────────────────────────────────────────
  async function startOauth(provider: ProviderId) {
    if (!storeId) return
    setOauthStarting(provider)
    try {
      const res = await jsonFetch<{ authorize_url: string; state?: string }>(
        '/api/payments/oauth/start',
        {
          method: 'POST',
          body: JSON.stringify({ storeId, provider }),
        },
      )
      if (res.authorize_url) {
        window.location.href = res.authorize_url
        return
      }
      toast(t('settingsPayments.toastConnectError'), 'error')
    } catch (e) {
      toast(
        (e as Error)?.message || t('settingsPayments.toastConnectError'),
        'error',
      )
    } finally {
      setOauthStarting(null)
    }
  }

  async function saveManualConfig(provider: 'transfer' | 'cash', config: Record<string, unknown>) {
    if (!storeId) return
    await jsonFetch<PaymentMethod>('/api/payments/methods/manual', {
      method: 'POST',
      body: JSON.stringify({ storeId, provider, config }),
    })
    toast(t('settingsPayments.toastSaved'), 'success')
    await load()
  }

  async function setDefault(methodId: string) {
    await jsonFetch<PaymentMethod>(`/api/payments/methods/${methodId}/set-default`, {
      method: 'POST',
    })
    toast(t('settingsPayments.toastDefaultSet'), 'success')
    await load()
  }

  async function disconnect(methodId: string) {
    if (!window.confirm(t('settingsPayments.disconnectConfirm'))) return
    await jsonFetch<void>(`/api/payments/methods/${methodId}`, { method: 'DELETE' })
    toast(t('settingsPayments.toastDisconnected'), 'success')
    await load()
  }

  // ── Derived state ────────────────────────────────────────────────────────
  const tier: Tier = me?.tier ?? 'free'
  const modules = me?.modules ?? []

  const connectedByProvider = useMemo(() => {
    const m = new Map<string, PaymentMethod>()
    for (const method of methods) {
      // Prefer the default if multiple of the same provider exist.
      const existing = m.get(method.provider)
      if (!existing || method.is_default) m.set(method.provider, method)
    }
    return m
  }, [methods])

  function isUnlocked(provider: ProviderInfo): boolean {
    if (hasModule(modules, provider.requiredModule)) return true
    if (provider.requiredModule === 'payment_basic') {
      // Available from Free upward — always unlocked.
      return true
    }
    // payment_extended — Starter+
    return tier === 'starter' || tier === 'growth' || tier === 'business'
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (!storeId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm">{t('settingsPayments.noProfile')}</p>
      </div>
    )
  }

  if (loading) return <PaymentsSkeleton />

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm mb-3">{error}</p>
        <button
          onClick={() => load()}
          className="text-sm font-semibold text-amber-800 underline"
        >
          {t('settingsPayments.retry')}
        </button>
      </div>
    )
  }

  const connectedList = PROVIDERS.filter((p) => connectedByProvider.has(p.id))
  const availableList = PROVIDERS.filter((p) => !connectedByProvider.has(p.id))

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {t('settingsPayments.title')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {t('settingsPayments.subtitle')}
        </p>
      </div>

      {/* Connected methods */}
      <section className="mb-8">
        <h2 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide text-slate-600">
          {t('settingsPayments.connectedTitle')}
          {connectedList.length > 0 && (
            <span className="text-slate-400 font-normal normal-case tracking-normal ml-1">
              ({connectedList.length})
            </span>
          )}
        </h2>
        {connectedList.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-500">
              {t('settingsPayments.connectedEmpty')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedList.map((info) => {
              const method = connectedByProvider.get(info.id)!
              return (
                <ProviderCard
                  key={info.id}
                  info={info}
                  method={method}
                  onSetDefault={() => setDefault(method.id)}
                  onDisconnect={() => disconnect(method.id)}
                  onEdit={() => {
                    if (info.id === 'transfer') {
                      setTransferInitial(method)
                      setTransferModalOpen(true)
                    } else if (info.id === 'cash') {
                      setCashInitial(method)
                      setCashModalOpen(true)
                    }
                  }}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* Available providers */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide text-slate-600">
          {t('settingsPayments.availableTitle')}
        </h2>
        {availableList.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t('settingsPayments.availableAllConnected')}
          </p>
        ) : (
          <div className="space-y-3">
            {availableList.map((info) => (
              <ConnectableCard
                key={info.id}
                info={info}
                unlocked={isUnlocked(info)}
                busy={oauthStarting === info.id}
                onConnect={() => {
                  if (info.oauth) {
                    startOauth(info.id)
                  } else if (info.id === 'transfer') {
                    setTransferInitial(null)
                    setTransferModalOpen(true)
                  } else if (info.id === 'cash') {
                    setCashInitial(null)
                    setCashModalOpen(true)
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {transferModalOpen && (
        <TransferConfigModal
          initial={transferInitial}
          onClose={() => {
            setTransferModalOpen(false)
            setTransferInitial(null)
          }}
          onSave={async (config) => {
            await saveManualConfig('transfer', config)
            setTransferModalOpen(false)
            setTransferInitial(null)
          }}
        />
      )}

      {cashModalOpen && (
        <CashConfigModal
          initial={cashInitial}
          onClose={() => {
            setCashModalOpen(false)
            setCashInitial(null)
          }}
          onSave={async (config) => {
            await saveManualConfig('cash', config)
            setCashModalOpen(false)
            setCashInitial(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PaymentsSkeleton() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-72 bg-slate-200 rounded mb-6" />
      <div className="space-y-3 mb-8">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-5 h-20"
          />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-5 h-16"
          />
        ))}
      </div>
    </div>
  )
}
