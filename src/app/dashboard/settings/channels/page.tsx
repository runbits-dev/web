"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_BASE } from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { ChannelCard } from './ChannelCard'
import { WhatsAppConnectFlow } from './WhatsAppConnectFlow'
import { TemplateList } from './TemplateList'
import type { Channel } from './types'

type Tier = 'free' | 'starter' | 'growth' | 'business'

type MyModulesResponse = {
  tier: Tier
  modules: string[]
}

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

export default function ChannelsSettingsPage() {
  const { activeProfile } = useProfile()
  const { t } = useI18n()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeId = activeProfile?.store_id ?? null

  const [me, setMe] = useState<MyModulesResponse | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const load = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [meRes, channelsRes] = await Promise.all([
        jsonFetch<MyModulesResponse>(
          `/api/billing/me/modules?restaurantId=${storeId}`,
        ).catch(() => null),
        jsonFetch<{ channels: Channel[] }>(
          `/api/channels/me?storeId=${storeId}`,
        ).catch(() => ({ channels: [] }) as { channels: Channel[] }),
      ])
      setMe(meRes)
      setChannels(channelsRes.channels ?? [])
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    load()
  }, [load])

  // Handle return from OAuth callback (?connected=whatsapp&phone=... or ?error=...).
  useEffect(() => {
    const connected = searchParams.get('connected')
    const errParam = searchParams.get('error')
    const status = searchParams.get('status')
    if (connected === 'whatsapp') {
      const phone = searchParams.get('phone')
      toast(
        phone
          ? t('settingsChannels.toastConnected').replace('{phone}', phone)
          : t('settingsChannels.toastConnectedNoPhone'),
        'success',
      )
      router.replace('/dashboard/settings/channels')
      load()
    } else if (errParam || status === 'failed' || status === 'denied') {
      let message = t('settingsChannels.toastConnectError')
      if (errParam === 'no_waba_2fa_missing') {
        message = t('settingsChannels.error2fa')
      } else if (errParam === 'no_business_unverified') {
        message = t('settingsChannels.errorUnverified')
      }
      toast(message, 'error')
      router.replace('/dashboard/settings/channels')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function refreshQuality(storeId: string) {
    try {
      await jsonFetch(`/api/channels/whatsapp/quality?storeId=${storeId}`)
      toast(t('settingsChannels.toastQualityRefreshed'), 'success')
      await load()
    } catch (e) {
      toast((e as Error).message || t('settingsChannels.toastError'), 'error')
    }
  }

  async function disconnect(channelRowId: string) {
    if (!window.confirm(t('settingsChannels.disconnectConfirm'))) return
    try {
      await jsonFetch(`/api/channels/${channelRowId}`, { method: 'DELETE' })
      toast(t('settingsChannels.toastDisconnected'), 'success')
      await load()
    } catch (e) {
      toast((e as Error).message || t('settingsChannels.toastError'), 'error')
    }
  }

  const tier: Tier = me?.tier ?? 'free'
  const modules = me?.modules ?? []
  const hasWhatsAppBasic = modules.includes('whatsapp_basic')
  const tierUnlocks = tier === 'growth' || tier === 'business' || hasWhatsAppBasic
  const whatsappActive = channels.find(
    (c) => c.channel === 'whatsapp' && c.status === 'active',
  )

  if (!storeId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm">{t('settingsChannels.noProfile')}</p>
      </div>
    )
  }

  if (loading) return <ChannelsSkeleton />

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('settingsChannels.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('settingsChannels.subtitle')}</p>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-slate-600">
          {t('settingsChannels.connectedTitle')}
        </h2>

        {whatsappActive ? (
          <ChannelCard
            channel={whatsappActive}
            onDisconnect={() => disconnect(whatsappActive.id)}
            onViewTemplates={() => setTemplatesOpen(true)}
            onRefreshQuality={() => refreshQuality(storeId)}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💬</span>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">WhatsApp Business</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {t('settingsChannels.whatsappDescription')}
                </p>
                <div className="mt-3">
                  {tierUnlocks ? (
                    <WhatsAppConnectFlow
                      storeId={storeId}
                      onError={(m) => toast(m, 'error')}
                    />
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                      <p className="text-amber-800">
                        {t('settingsChannels.lockedTier')}
                      </p>
                      <a
                        href="/dashboard/subscription"
                        className="inline-block mt-2 text-amber-900 underline text-xs font-medium"
                      >
                        {t('settingsChannels.upgradeCta')} →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {templatesOpen && whatsappActive && (
        <TemplateList storeId={storeId} onClose={() => setTemplatesOpen(false)} />
      )}
    </div>
  )
}

function ChannelsSkeleton() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-72 bg-slate-200 rounded mb-6" />
      <div className="bg-white border border-slate-200 rounded-2xl p-5 h-32" />
    </div>
  )
}
