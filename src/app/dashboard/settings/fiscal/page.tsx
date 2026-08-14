"use client"

/**
 * Merchant fiscal e-invoicing (AFIP) — virtual-office section.
 *
 * Backed by runbits-fiscal via the gateway (/api/fiscal/*). The whole section is
 * gated behind the `electronic_invoicing` module entitlement (mirrors how the
 * domain/payments/channels settings pages gate paid capabilities off
 * /api/billing/me/modules). The module ships as coming_soon: real issuance is
 * gated server-side until AFIP homologación + cert validation land, so a
 * prominent banner sets that expectation instead of surprising the merchant.
 *
 * Error-handling rule: every fallible call is wrapped; failures surface the
 * server's friendly message + stable code (ApiError) in a retryable state and
 * never leak internals. The private key PEM is write-only — it is uploaded and
 * then never rendered or echoed back.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Lock, ShieldCheck, FileText, Trash2, Clock, ExternalLink } from 'lucide-react'
import {
  api,
  API_BASE,
  type ApiError,
  type FiscalProfile,
  type FiscalInvoice,
  type FiscalTaxCondition,
  type FiscalInvoiceType,
} from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE_KEY = 'electronic_invoicing'
const CUIT_RE = /^\d{11}$/
const PAGE_SIZE = 20

const TAX_CONDITIONS: { value: FiscalTaxCondition; label: string }[] = [
  { value: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
  { value: 'MONOTRIBUTO', label: 'Monotributo' },
  { value: 'EXENTO', label: 'Exento' },
]

const INVOICE_TYPES: { value: FiscalInvoiceType; label: string }[] = [
  { value: 'FACTURA_A', label: 'Factura A' },
  { value: 'FACTURA_B', label: 'Factura B' },
  { value: 'FACTURA_C', label: 'Factura C' },
]

// ─── Types ──────────────────────────────────────────────────────────────────

type ModuleStatus = 'available' | 'coming_soon' | 'hidden'

type MyModulesResponse = {
  modules: string[]
  moduleStatus?: Record<string, ModuleStatus>
}

type Feedback = { message: string; code?: string; kind: 'error' | 'success' } | null

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function asApiError(err: unknown): ApiError {
  return err instanceof Error ? (err as ApiError) : (new Error('Error inesperado') as ApiError)
}

function fmtDate(ts: number | null | undefined): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

function fmtMoney(n: number): string {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
  } catch {
    return String(n)
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function FiscalPage() {
  const { activeProfile } = useProfile()
  const storeId = activeProfile?.store_id ?? null

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [entitled, setEntitled] = useState(false)
  const [moduleComingSoon, setModuleComingSoon] = useState(true)
  const [profile, setProfile] = useState<FiscalProfile | null>(null)
  const [invoices, setInvoices] = useState<FiscalInvoice[]>([])
  const [offset, setOffset] = useState(0)

  // ── Initial load: entitlement + profile + invoices ───────────────────────
  const load = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      // Entitlement gate (mirrors the other paid settings pages). Failing the
      // billing lookup must NOT crash the page — treat it as "not entitled".
      const me = await fetch(`${API_BASE}/api/billing/me/modules?restaurantId=${storeId}`, {
        headers: { ...authHeaders() },
      })
        .then((r) => (r.ok ? (r.json() as Promise<MyModulesResponse>) : null))
        .catch(() => null)

      const modules = me?.modules ?? []
      const isEntitled = modules.includes(MODULE_KEY)
      setEntitled(isEntitled)
      setModuleComingSoon((me?.moduleStatus?.[MODULE_KEY] ?? 'coming_soon') === 'coming_soon')

      if (!isEntitled) {
        setLoading(false)
        return
      }

      // Profile: a 404 (FISCAL_PROFILE_NOT_FOUND) is the normal "not yet
      // configured" state, not an error — fall back to null.
      const profileRes = await api
        .getFiscalProfile()
        .then((r) => r.profile)
        .catch((err) => {
          const e = asApiError(err)
          if (e.status === 404 || e.code === 'FISCAL_PROFILE_NOT_FOUND') return null
          throw err
        })
      setProfile(profileRes)

      // Invoices: never block the page if the list errors.
      const invRes = await api
        .listFiscalInvoices({ limit: PAGE_SIZE, offset: 0 })
        .then((r) => r.invoices)
        .catch(() => [] as FiscalInvoice[])
      setInvoices(invRes)
      setOffset(0)
    } catch {
      setLoadError('No pudimos cargar tu configuración fiscal. Reintentá en unos segundos.')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    load()
  }, [load])

  // ── Invoice pagination ────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  async function goToPage(nextOffset: number) {
    setPageLoading(true)
    setPageError(null)
    try {
      const res = await api.listFiscalInvoices({ limit: PAGE_SIZE, offset: nextOffset })
      setInvoices(res.invoices)
      setOffset(nextOffset)
    } catch (err) {
      const e = asApiError(err)
      setPageError(e.message || 'No pudimos cargar las facturas.')
    } finally {
      setPageLoading(false)
    }
  }

  // ── PDF view: the endpoint is gateway-authed, so we fetch WITH the token and
  //    open the rendered HTML as a blob (a plain link would drop the Bearer). ──
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  async function viewPdf(id: string) {
    setPdfBusyId(id)
    setPdfError(null)
    try {
      const res = await fetch(api.getFiscalInvoicePdfUrl(id), { headers: { ...authHeaders() } })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `No pudimos abrir la factura (HTTP ${res.status}).`)
      }
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      // Give the new tab time to load before releasing the object URL.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setPdfError(asApiError(err).message || 'No pudimos abrir la factura.')
    } finally {
      setPdfBusyId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!storeId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm">
          Seleccioná un comercio para configurar la facturación electrónica.
        </p>
      </div>
    )
  }

  if (loading) return <FiscalSkeleton />

  if (loadError) {
    return (
      <div>
        <PageHeader />
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-700 text-sm mb-3">{loadError}</p>
          <button onClick={() => load()} className="text-sm font-semibold text-amber-800 underline">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!entitled) {
    return (
      <div>
        <PageHeader />
        <LockedSection />
      </div>
    )
  }

  return (
    <div>
      <PageHeader />

      {moduleComingSoon && <ComingSoonBanner />}

      <div className="space-y-5">
        <FiscalProfileForm
          storeId={storeId}
          profile={profile}
          onSaved={(p) => setProfile(p)}
        />

        <CertSection
          profile={profile}
          onChanged={() => load()}
        />

        <InvoiceList
          invoices={invoices}
          offset={offset}
          pageLoading={pageLoading}
          pageError={pageError}
          pdfBusyId={pdfBusyId}
          pdfError={pdfError}
          onPage={goToPage}
          onViewPdf={viewPdf}
        />
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="mb-6">
      <Link
        href="/dashboard/settings"
        className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 mb-2"
      >
        ← Configuración
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Facturación electrónica</h1>
      <p className="text-slate-500 text-sm mt-1">
        Emití facturas AFIP a tus clientes con tu propio CUIT y certificado.
      </p>
    </div>
  )
}

// ─── Coming-soon banner ─────────────────────────────────────────────────────

function ComingSoonBanner() {
  return (
    <div
      role="status"
      className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5 flex items-start gap-3"
    >
      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Próximamente — emisión aún no activa</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          Podés dejar configurada tu identidad fiscal y subir tu certificado desde ya, pero la
          emisión real de facturas está deshabilitada hasta completar la homologación con AFIP y la
          validación de tu certificado. Te avisaremos cuando quede habilitada para tu comercio.
        </p>
      </div>
    </div>
  )
}

// ─── Locked (not entitled) ──────────────────────────────────────────────────

function LockedSection() {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-slate-400" />
      </div>
      <h2 className="text-base font-bold text-slate-900">Facturación electrónica no incluida</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        La facturación electrónica AFIP es un módulo adicional. Activalo desde tu suscripción para
        emitir facturas a tus clientes con tu propio CUIT.
      </p>
      <Link
        href="/dashboard/subscription#addons"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700"
      >
        Ver planes y addons
        <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  )
}

// ─── Profile form ─────────────────────────────────────────────────────────────

function FiscalProfileForm({
  storeId,
  profile,
  onSaved,
}: {
  storeId: string
  profile: FiscalProfile | null
  onSaved: (p: FiscalProfile) => void
}) {
  const [cuit, setCuit] = useState(profile?.cuit ?? '')
  const [taxCondition, setTaxCondition] = useState<FiscalTaxCondition>(
    profile?.tax_condition ?? 'MONOTRIBUTO',
  )
  const [pointOfSale, setPointOfSale] = useState(String(profile?.point_of_sale ?? ''))
  const [invoiceType, setInvoiceType] = useState<FiscalInvoiceType>(
    profile?.default_invoice_type ?? 'FACTURA_C',
  )
  const [razonSocial, setRazonSocial] = useState(profile?.razon_social ?? '')

  const [fieldError, setFieldError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [saving, setSaving] = useState(false)

  // Keep the form in sync when the profile finishes loading / is reloaded.
  useEffect(() => {
    if (!profile) return
    setCuit(profile.cuit)
    setTaxCondition(profile.tax_condition)
    setPointOfSale(String(profile.point_of_sale))
    setInvoiceType(profile.default_invoice_type)
    setRazonSocial(profile.razon_social ?? '')
  }, [profile])

  function validate(): string | null {
    if (!CUIT_RE.test(cuit.trim())) return 'El CUIT debe tener exactamente 11 dígitos.'
    const pos = Number(pointOfSale)
    if (!Number.isInteger(pos) || pos <= 0) return 'El punto de venta debe ser un número entero positivo.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    const v = validate()
    if (v) {
      setFieldError(v)
      return
    }
    setFieldError(null)
    setSaving(true)
    try {
      const res = await api.putFiscalProfile({
        cuit: cuit.trim(),
        tax_condition: taxCondition,
        point_of_sale: Number(pointOfSale),
        default_invoice_type: invoiceType,
        razon_social: razonSocial.trim() || undefined,
      })
      onSaved(res.profile)
      setFeedback({ kind: 'success', message: 'Identidad fiscal guardada.' })
    } catch (err) {
      const e = asApiError(err)
      setFeedback({
        kind: 'error',
        message: e.message || 'No pudimos guardar tu identidad fiscal. Reintentá.',
        code: e.code,
      })
    } finally {
      setSaving(false)
    }
  }

  const cuitInvalid = cuit.length > 0 && !CUIT_RE.test(cuit.trim())

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Identidad fiscal</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Los datos con los que AFIP emitirá tus facturas.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cuit" className="text-xs font-semibold text-slate-600 mb-1 block">
              CUIT *
            </label>
            <input
              id="cuit"
              inputMode="numeric"
              maxLength={11}
              value={cuit}
              onChange={(e) => setCuit(e.target.value.replace(/\D/g, ''))}
              placeholder="20123456789"
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                cuitInvalid ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'
              } focus:outline-none`}
              aria-invalid={cuitInvalid}
            />
            <p className="text-[11px] text-slate-400 mt-1">11 dígitos, sin guiones.</p>
          </div>

          <div>
            <label htmlFor="pos" className="text-xs font-semibold text-slate-600 mb-1 block">
              Punto de venta *
            </label>
            <input
              id="pos"
              inputMode="numeric"
              value={pointOfSale}
              onChange={(e) => setPointOfSale(e.target.value.replace(/\D/g, ''))}
              placeholder="1"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="tax" className="text-xs font-semibold text-slate-600 mb-1 block">
              Condición IVA *
            </label>
            <select
              id="tax"
              value={taxCondition}
              onChange={(e) => setTaxCondition(e.target.value as FiscalTaxCondition)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none"
            >
              {TAX_CONDITIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="itype" className="text-xs font-semibold text-slate-600 mb-1 block">
              Tipo de factura *
            </label>
            <select
              id="itype"
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as FiscalInvoiceType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none"
            >
              {INVOICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="razon" className="text-xs font-semibold text-slate-600 mb-1 block">
            Razón social
          </label>
          <input
            id="razon"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            maxLength={200}
            placeholder="Mi Comercio S.A."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>

        {fieldError && <p className="text-sm text-red-600">{fieldError}</p>}

        {feedback && (
          <p className={`text-sm ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
            {feedback.message}
            {feedback.code && (
              <span className="ml-1 text-[11px] uppercase tracking-wide text-slate-400">
                ({feedback.code})
              </span>
            )}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar identidad fiscal'}
          </button>
          {profile && (
            <span className="text-xs text-slate-400">
              Estado: <StatusBadge status={profile.status} />
            </span>
          )}
        </div>
      </form>
    </section>
  )
}

function StatusBadge({ status }: { status: FiscalProfile['status'] }) {
  const map: Record<FiscalProfile['status'], { label: string; cls: string }> = {
    coming_soon: { label: 'Próximamente', cls: 'bg-amber-100 text-amber-700' },
    cert_loaded: { label: 'Certificado cargado', cls: 'bg-blue-100 text-blue-700' },
    available: { label: 'Habilitada', cls: 'bg-emerald-100 text-emerald-700' },
    disabled: { label: 'Deshabilitada', cls: 'bg-slate-100 text-slate-500' },
  }
  const s = map[status] ?? map.coming_soon
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  )
}

// ─── Certificate section ────────────────────────────────────────────────────

function CertSection({
  profile,
  onChanged,
}: {
  profile: FiscalProfile | null
  onChanged: () => void
}) {
  const [cert, setCert] = useState('')
  const [key, setKey] = useState('')
  const [expiry, setExpiry] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const certLoaded = profile?.status === 'cert_loaded' || profile?.status === 'available'
  const canUpload = !!profile // profile must exist first (carries the canonical CUIT)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    if (!cert.trim() || !key.trim()) {
      setFeedback({ kind: 'error', message: 'Pegá tanto el certificado como la clave privada (PEM).' })
      return
    }
    setUploading(true)
    try {
      const res = await api.uploadFiscalCert(cert.trim(), key.trim())
      setExpiry(res.cert_not_after ?? null)
      // Clear the PEMs from memory once uploaded — the key is write-only.
      setCert('')
      setKey('')
      setFeedback({ kind: 'success', message: 'Certificado cargado y encriptado.' })
      onChanged()
    } catch (err) {
      const eo = asApiError(err)
      // Write-only contract: the private key (and cert) must NEVER linger in the
      // DOM after a submit, including a FAILED one — clear both on the error path
      // too, not just on success.
      setCert('')
      setKey('')
      setFeedback({
        kind: 'error',
        message: eo.message || 'No pudimos cargar el certificado. Reintentá.',
        code: eo.code,
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Rotar el certificado? Se desactivará el actual y deberás subir uno nuevo.')) {
      return
    }
    setFeedback(null)
    setDeleting(true)
    try {
      await api.deleteFiscalCert()
      setExpiry(null)
      setFeedback({ kind: 'success', message: 'Certificado desactivado. Podés subir uno nuevo.' })
      onChanged()
    } catch (err) {
      const eo = asApiError(err)
      setFeedback({
        kind: 'error',
        message: eo.message || 'No pudimos desactivar el certificado. Reintentá.',
        code: eo.code,
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Certificado AFIP</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Se valida y encripta en el servidor. La clave privada nunca se muestra ni se descarga.
          </p>
        </div>
        {certLoaded && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 whitespace-nowrap">
            <ShieldCheck className="w-4 h-4" /> Certificado activo
          </span>
        )}
      </header>

      {certLoaded ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
            <p>Ya tenés un certificado cargado para este comercio.</p>
            {expiry && <p className="mt-1 text-xs text-slate-500">Vence el {fmtDate(expiry)}.</p>}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Desactivando...' : 'Rotar / eliminar certificado'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-4">
          {!canUpload && (
            <p className="text-xs text-amber-600">
              Primero guardá tu identidad fiscal — el CUIT del certificado debe coincidir.
            </p>
          )}
          <div>
            <label htmlFor="cert" className="text-xs font-semibold text-slate-600 mb-1 block">
              Certificado (PEM) *
            </label>
            <textarea
              id="cert"
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              rows={4}
              placeholder="-----BEGIN CERTIFICATE-----"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="key" className="text-xs font-semibold text-slate-600 mb-1 block">
              Clave privada (PEM) *
            </label>
            <textarea
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              rows={4}
              placeholder="-----BEGIN PRIVATE KEY-----"
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Se envía una sola vez y se guarda encriptada. No se puede visualizar luego.
            </p>
          </div>

          {feedback && (
            <p className={`text-sm ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {feedback.message}
              {feedback.code && (
                <span className="ml-1 text-[11px] uppercase tracking-wide text-slate-400">
                  ({feedback.code})
                </span>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading || !canUpload}
            className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : 'Subir certificado'}
          </button>
        </form>
      )}

      {/* Feedback for the cert-loaded (rotation) branch. */}
      {certLoaded && feedback && (
        <p className={`text-sm mt-3 ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.message}
          {feedback.code && (
            <span className="ml-1 text-[11px] uppercase tracking-wide text-slate-400">({feedback.code})</span>
          )}
        </p>
      )}
    </section>
  )
}

// ─── Invoice list ─────────────────────────────────────────────────────────────

function InvoiceList({
  invoices,
  offset,
  pageLoading,
  pageError,
  pdfBusyId,
  pdfError,
  onPage,
  onViewPdf,
}: {
  invoices: FiscalInvoice[]
  offset: number
  pageLoading: boolean
  pageError: string | null
  pdfBusyId: string | null
  pdfError: string | null
  onPage: (offset: number) => void
  onViewPdf: (id: string) => void
}) {
  const canPrev = offset > 0
  // We only know there is a next page if the current page came back full.
  const canNext = invoices.length >= PAGE_SIZE

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Facturas emitidas</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Historial de comprobantes emitidos para este comercio.
        </p>
      </header>

      {pageError && <p className="text-sm text-red-600 mb-3">{pageError}</p>}
      {pdfError && <p className="text-sm text-red-600 mb-3">{pdfError}</p>}

      {invoices.length === 0 ? (
        <div className="text-center py-10 text-sm text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          Todavía no hay facturas emitidas.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-4 font-semibold">Nro</th>
                <th className="py-2 pr-4 font-semibold">Fecha</th>
                <th className="py-2 pr-4 font-semibold">Total</th>
                <th className="py-2 pr-4 font-semibold">CAE</th>
                <th className="py-2 pr-4 font-semibold">Estado</th>
                <th className="py-2 font-semibold text-right">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-4 text-slate-700 whitespace-nowrap">
                    {inv.pto_vta}-{inv.cbte_nro}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">{inv.cbte_fch}</td>
                  <td className="py-2.5 pr-4 text-slate-700 whitespace-nowrap">{fmtMoney(inv.imp_total)}</td>
                  <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">{inv.cae ?? '—'}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onViewPdf(inv.id)}
                      disabled={pdfBusyId === inv.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      {pdfBusyId === inv.id ? 'Abriendo...' : (
                        <>
                          Ver <ExternalLink className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(canPrev || canNext) && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => onPage(Math.max(0, offset - PAGE_SIZE))}
            disabled={!canPrev || pageLoading}
            className="text-xs font-semibold text-slate-600 disabled:opacity-40"
          >
            ← Anteriores
          </button>
          <span className="text-xs text-slate-400">
            {offset + 1}–{offset + invoices.length}
          </span>
          <button
            onClick={() => onPage(offset + PAGE_SIZE)}
            disabled={!canNext || pageLoading}
            className="text-xs font-semibold text-slate-600 disabled:opacity-40"
          >
            Siguientes →
          </button>
        </div>
      )}
    </section>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function FiscalSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-56 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-80 bg-slate-200 rounded mb-6" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 h-40" />
      ))}
    </div>
  )
}
