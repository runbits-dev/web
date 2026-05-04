"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Lock, Plus, ExternalLink } from 'lucide-react'
import { API_BASE } from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'
import { useI18n } from '@/i18n'
import { SubdomainSection } from './SubdomainSection'
import { NSMigrationWizard } from './NSMigrationWizard'
import { CustomHostnameWizard } from './CustomHostnameWizard'
import { DomainCard } from './DomainCard'

// ─── Types ──────────────────────────────────────────────────────────────────

export type DomainStatus = 'active' | 'pending' | 'failed' | string

export type DomainKind = 'subdomain' | 'custom_domain' | 'custom_hostname'

export type Domain = {
  id: string
  hostname: string
  kind: DomainKind
  status: DomainStatus
  is_primary: boolean
  nameservers?: string[]
  cname?: { name: string; value: string }
  created_at?: number
}

type Tier = 'free' | 'starter' | 'growth' | 'business'

type MyModulesResponse = {
  tier: Tier
  modules: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function jsonFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
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

export default function DomainSettingsPage() {
  const { activeProfile } = useProfile()
  const { t } = useI18n()
  const storeId = activeProfile?.store_id ?? null

  const [me, setMe] = useState<MyModulesResponse | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nsWizardOpen, setNsWizardOpen] = useState(false)
  const [cnameWizardOpen, setCnameWizardOpen] = useState(false)
  const [customDomainMode, setCustomDomainMode] = useState<'ns' | 'cname'>(
    'ns',
  )
  const [customDomainInput, setCustomDomainInput] = useState('')

  // ── Load tier + domains ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [meRes, domainsRes] = await Promise.all([
        jsonFetch<MyModulesResponse>(
          `/api/billing/me/modules?restaurantId=${storeId}`,
        ).catch(() => null),
        jsonFetch<Domain[] | { domains: Domain[] }>(
          `/api/domains/me?storeId=${storeId}`,
        ).catch(() => [] as Domain[]),
      ])
      setMe(meRes)
      const list = Array.isArray(domainsRes)
        ? domainsRes
        : (domainsRes?.domains ?? [])
      setDomains(list)
    } catch {
      setError(t('settingsDomain.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }, [storeId, t])

  useEffect(() => {
    load()
  }, [load])

  // ── API actions ──────────────────────────────────────────────────────────
  async function reserveSubdomain(slug: string) {
    if (!storeId) return
    await jsonFetch<Domain>(`/api/domains/subdomain`, {
      method: 'POST',
      body: JSON.stringify({ storeId, slug }),
    })
    await load()
  }

  async function connectCustomDomain(hostname: string) {
    if (!storeId) throw new Error('No store')
    const res = await jsonFetch<{
      id: string
      hostname: string
      nameservers: string[]
    }>(`/api/domains/connect`, {
      method: 'POST',
      body: JSON.stringify({ storeId, hostname }),
    })
    await load()
    return {
      domainId: res.id,
      hostname: res.hostname,
      nameservers: res.nameservers ?? [],
    }
  }

  async function connectCustomHostname(hostname: string) {
    if (!storeId) throw new Error('No store')
    const res = await jsonFetch<{
      id: string
      hostname: string
      cname: { name: string; value: string }
    }>(`/api/domains/cf-hostname`, {
      method: 'POST',
      body: JSON.stringify({ storeId, hostname }),
    })
    await load()
    return {
      domainId: res.id,
      hostname: res.hostname,
      cname: res.cname,
    }
  }

  async function verifyDomain(id: string) {
    const res = await jsonFetch<{ status: DomainStatus; active?: boolean }>(
      `/api/domains/${id}/verify`,
      { method: 'POST' },
    )
    await load()
    return { active: res.active ?? res.status === 'active' }
  }

  async function disconnectDomain(id: string) {
    await jsonFetch<void>(`/api/domains/${id}`, { method: 'DELETE' })
    await load()
  }

  async function makePrimary(id: string) {
    await jsonFetch<Domain>(`/api/domains/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_primary: true }),
    })
    await load()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (!storeId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm">
          {t('settingsDomain.noProfile')}
        </p>
      </div>
    )
  }

  if (loading) return <DomainSkeleton />

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm mb-3">{error}</p>
        <button
          onClick={() => load()}
          className="text-sm font-semibold text-amber-800 underline"
        >
          {t('settingsDomain.retry')}
        </button>
      </div>
    )
  }

  const tier: Tier = me?.tier ?? 'free'
  const modules = me?.modules ?? []

  // Module-based capability detection (preferred over tier comparison).
  const canSubdomain =
    hasModule(modules, 'subdomain') ||
    tier === 'starter' ||
    tier === 'growth' ||
    tier === 'business'
  const canCustomDomain =
    hasModule(modules, 'custom_domain') ||
    tier === 'growth' ||
    tier === 'business'
  const canCustomHostname =
    hasModule(modules, 'custom_hostname_api') || tier === 'business'
  const canMultiDomain = hasModule(modules, 'multi_domain') || tier === 'business'

  // Categorize existing domains
  const subdomainDomain = domains.find((d) => d.kind === 'subdomain') ?? null
  const customDomains = domains.filter(
    (d) => d.kind === 'custom_domain' || d.kind === 'custom_hostname',
  )
  const primaryCustomDomain = customDomains[0] ?? null

  // ── Free tier ────────────────────────────────────────────────────────────
  if (tier === 'free') {
    const slugLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://runbits.app'}/store?s=${activeProfile?.display_name?.toLowerCase().replace(/\s+/g, '-') ?? 'tu-slug'}`
    return (
      <div>
        <PageHeader />
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
            {t('settingsDomain.free.headline')}
          </p>
          <a
            href={slugLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900 break-all hover:text-blue-700"
          >
            {slugLink}
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-sm text-slate-600 mb-3">
              {t('settingsDomain.free.subhead')}
            </p>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700"
            >
              {t('settingsDomain.free.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // ── Starter / Growth / Business ──────────────────────────────────────────
  return (
    <div>
      <PageHeader />

      <div className="space-y-5">
        {/* ── Section 1 — Subdomain (Starter+) ─────────────────────────── */}
        {canSubdomain && (
          <SubdomainSection
            domain={subdomainDomain}
            onReserve={reserveSubdomain}
            onVerify={verifyDomain}
            onDisconnect={disconnectDomain}
          />
        )}

        {/* ── Section 2 — Custom domain (Growth+) ──────────────────────── */}
        {canCustomDomain ? (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <header className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {t('settingsDomain.customDomain.title')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settingsDomain.customDomain.subtitle')}
              </p>
            </header>

            {primaryCustomDomain && !canMultiDomain ? (
              <DomainCard
                domain={primaryCustomDomain}
                onVerify={verifyDomain}
                onDisconnect={disconnectDomain}
              />
            ) : (
              !canMultiDomain && (
                <CustomDomainStarter
                  value={customDomainInput}
                  onChange={setCustomDomainInput}
                  onConnect={() => setNsWizardOpen(true)}
                />
              )
            )}
          </section>
        ) : (
          <LockedSection
            title={t('settingsDomain.lockedSection.customDomainTitle')}
            description={t('settingsDomain.lockedSection.customDomainDesc')}
            cta={t('settingsDomain.lockedSection.growthCta')}
          />
        )}

        {/* ── Section 3 — Custom hostname (Business) ───────────────────── */}
        {canCustomHostname && !canMultiDomain && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <header className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {t('settingsDomain.customHostname.title')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settingsDomain.customHostname.subtitle')}
              </p>
            </header>
            <CustomHostnamePicker
              mode={customDomainMode}
              onModeChange={setCustomDomainMode}
              onStartNs={() => setNsWizardOpen(true)}
              onStartCname={() => setCnameWizardOpen(true)}
            />
          </section>
        )}

        {/* ── Section 4 — Multi-domain (Business) ──────────────────────── */}
        {canMultiDomain && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t('settingsDomain.multiDomain.title')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('settingsDomain.multiDomain.subtitle')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNsWizardOpen(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />{' '}
                  {t('settingsDomain.multiDomain.addAnother')} (NS)
                </button>
                <button
                  onClick={() => setCnameWizardOpen(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />{' '}
                  {t('settingsDomain.multiDomain.addAnother')} (CNAME)
                </button>
              </div>
            </header>

            {customDomains.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-xl">
                {t('settingsDomain.multiDomain.empty')}
              </p>
            ) : (
              <div className="space-y-3">
                {customDomains.map((d) => (
                  <DomainCard
                    key={d.id}
                    domain={d}
                    onVerify={verifyDomain}
                    onDisconnect={disconnectDomain}
                    onMakePrimary={makePrimary}
                    showMakePrimary
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Locked sections by tier ──────────────────────────────────── */}
        {tier === 'starter' && (
          <LockedSection
            title={t('settingsDomain.lockedSection.customDomainTitle')}
            description={t('settingsDomain.lockedSection.customDomainDesc')}
            cta={t('settingsDomain.lockedSection.growthCta')}
          />
        )}
        {tier === 'growth' && (
          <LockedSection
            title={t('settingsDomain.lockedSection.businessTitle')}
            description={t('settingsDomain.lockedSection.businessDesc')}
            cta={t('settingsDomain.lockedSection.businessCta')}
          />
        )}
      </div>

      {/* ── Wizards ──────────────────────────────────────────────────── */}
      {nsWizardOpen && (
        <NSMigrationWizard
          initialDomain={customDomainInput}
          onClose={() => setNsWizardOpen(false)}
          onConnect={connectCustomDomain}
          onVerify={verifyDomain}
        />
      )}
      {cnameWizardOpen && (
        <CustomHostnameWizard
          initialDomain={customDomainInput}
          onClose={() => setCnameWizardOpen(false)}
          onConnect={connectCustomHostname}
          onVerify={verifyDomain}
        />
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PageHeader() {
  const { t } = useI18n()
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {t('settingsDomain.title')}
      </h1>
      <p className="text-slate-500 text-sm mt-1">
        {t('settingsDomain.subtitle')}
      </p>
    </div>
  )
}

function CustomDomainStarter({
  value,
  onChange,
  onConnect,
}: {
  value: string
  onChange: (v: string) => void
  onConnect: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().trim())}
        placeholder={t('settingsDomain.customDomain.placeholder')}
        className="flex-1 px-3 py-2.5 rounded-xl ring-1 ring-slate-200 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        onClick={onConnect}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700"
      >
        {t('settingsDomain.customDomain.connect')}
      </button>
    </div>
  )
}

function CustomHostnamePicker({
  mode,
  onModeChange,
  onStartNs,
  onStartCname,
}: {
  mode: 'ns' | 'cname'
  onModeChange: (m: 'ns' | 'cname') => void
  onStartNs: () => void
  onStartCname: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">
          {t('settingsDomain.customHostname.modeLabel')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onModeChange('ns')}
            className={`p-3 rounded-xl text-left text-sm transition-colors ${
              mode === 'ns'
                ? 'bg-blue-50 ring-2 ring-blue-500 text-blue-900'
                : 'bg-slate-50 ring-1 ring-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="font-semibold">
              {t('settingsDomain.customHostname.modeNs')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('cname')}
            className={`p-3 rounded-xl text-left text-sm transition-colors ${
              mode === 'cname'
                ? 'bg-blue-50 ring-2 ring-blue-500 text-blue-900'
                : 'bg-slate-50 ring-1 ring-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="font-semibold">
              {t('settingsDomain.customHostname.modeCname')}
            </span>
          </button>
        </div>
      </div>
      <button
        onClick={mode === 'ns' ? onStartNs : onStartCname}
        className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700"
      >
        {t('settingsDomain.customDomain.connect')}
      </button>
    </div>
  )
}

function LockedSection({
  title,
  description,
  cta,
}: {
  title: string
  description: string
  cta: string
}) {
  return (
    <section className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 shrink-0">
            <Lock className="w-4 h-4 text-slate-500" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700"
        >
          {cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

function DomainSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-64 bg-slate-200 rounded mb-6" />
      <div className="space-y-5">
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  )
}
