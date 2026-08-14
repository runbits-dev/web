/**
 * Unit tests for the merchant fiscal-invoicing dashboard section (Phase 3).
 *
 * Focus:
 *   - entitlement gating off /api/billing/me/modules (electronic_invoicing)
 *   - the coming_soon banner (issuance is server-gated pending AFIP homologación)
 *   - the profile form's client validation (CUIT 11 digits) + PUT submit
 *
 * We fake global fetch (mirroring the /track page test) and route by URL/verb.
 * The store id comes from a mocked ProfileContext so the page mounts standalone.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import FiscalPage from './page'

// ProfileContext → a store is always active.
vi.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    activeProfile: { id: 'p1', store_id: 'store-1', business_type: 'food', display_name: 'Test' },
    profiles: [],
    switchProfile: vi.fn(),
    refreshProfiles: vi.fn(),
    loading: false,
  }),
}))

type JsonResponse = { ok: boolean; status?: number; body: unknown }
const json = (r: JsonResponse) =>
  Promise.resolve({
    ok: r.ok,
    status: r.status ?? (r.ok ? 200 : 500),
    json: async () => r.body,
    text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)),
  })

interface Plan {
  entitled: boolean
  moduleStatus?: 'available' | 'coming_soon'
  // When set, the profile GET returns this profile instead of a 404. Needed so
  // the cert upload form is enabled (canUpload requires a profile).
  profile?: Record<string, unknown>
  // When true, POST /api/fiscal/cert fails (to exercise the error path).
  certFail?: boolean
}

let calls: Array<{ url: string; method: string; body: unknown }> = []

function installFetch(plan: Plan) {
  calls = []
  const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ url, method, body })

    if (url.includes('/api/billing/me/modules')) {
      return json({
        ok: true,
        body: {
          modules: plan.entitled ? ['electronic_invoicing'] : [],
          moduleStatus: { electronic_invoicing: plan.moduleStatus ?? 'coming_soon' },
        },
      })
    }
    if (url.includes('/api/fiscal/cert')) {
      if (plan.certFail) {
        return json({ ok: false, status: 500, body: { error: 'cert inválido', code: 'FISCAL_CERT_INVALID' } })
      }
      return json({ ok: true, status: 201, body: { ok: true, status: 'cert_loaded', cert_not_after: 999, fingerprint_sha256: 'ab' } })
    }
    if (url.includes('/api/fiscal/profile')) {
      if (method === 'PUT') {
        return json({ ok: true, body: { profile: { store_id: 'store-1', status: 'coming_soon', ...body } } })
      }
      if (plan.profile) {
        return json({ ok: true, body: { profile: plan.profile } })
      }
      // No profile configured yet → 404 (normal "not set" state).
      return json({ ok: false, status: 404, body: { error: 'no fiscal profile', code: 'FISCAL_PROFILE_NOT_FOUND' } })
    }
    if (url.includes('/api/fiscal/invoices')) {
      return json({ ok: true, body: { invoices: [] } })
    }
    throw new Error(`unexpected fetch: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  localStorage.setItem('token', 'tok-test')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('FiscalPage — entitlement gating', () => {
  it('shows the locked upsell (no form) when electronic_invoicing is not entitled', async () => {
    installFetch({ entitled: false })
    render(<FiscalPage />)

    await waitFor(() => expect(screen.getByText('Facturación electrónica no incluida')).toBeInTheDocument())
    // The management UI must not render for an un-entitled merchant.
    expect(screen.queryByText('Identidad fiscal')).not.toBeInTheDocument()
    // It must never have tried to read the fiscal profile.
    expect(calls.some((c) => c.url.includes('/api/fiscal/profile'))).toBe(false)
  })

  it('renders the section + coming_soon banner when entitled and coming_soon', async () => {
    installFetch({ entitled: true, moduleStatus: 'coming_soon' })
    render(<FiscalPage />)

    await waitFor(() => expect(screen.getByText('Identidad fiscal')).toBeInTheDocument())
    expect(screen.getByText('Próximamente — emisión aún no activa')).toBeInTheDocument()
    expect(screen.getByText('Certificado AFIP')).toBeInTheDocument()
    expect(screen.getByText('Facturas emitidas')).toBeInTheDocument()
  })

  it('hides the coming_soon banner when the module is available', async () => {
    installFetch({ entitled: true, moduleStatus: 'available' })
    render(<FiscalPage />)

    await waitFor(() => expect(screen.getByText('Identidad fiscal')).toBeInTheDocument())
    expect(screen.queryByText('Próximamente — emisión aún no activa')).not.toBeInTheDocument()
  })
})

describe('FiscalPage — profile form', () => {
  it('blocks submit and shows a validation error for a CUIT that is not 11 digits', async () => {
    installFetch({ entitled: true })
    render(<FiscalPage />)
    await waitFor(() => expect(screen.getByText('Identidad fiscal')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('CUIT *'), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText('Punto de venta *'), { target: { value: '1' } })
    fireEvent.click(screen.getByText('Guardar identidad fiscal'))

    await waitFor(() =>
      expect(screen.getByText('El CUIT debe tener exactamente 11 dígitos.')).toBeInTheDocument(),
    )
    // No PUT should have fired for the invalid form.
    expect(calls.some((c) => c.url.includes('/api/fiscal/profile') && c.method === 'PUT')).toBe(false)
  })

  it('PUTs the identity and shows success for a valid CUIT', async () => {
    installFetch({ entitled: true })
    render(<FiscalPage />)
    await waitFor(() => expect(screen.getByText('Identidad fiscal')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('CUIT *'), { target: { value: '20123456789' } })
    fireEvent.change(screen.getByLabelText('Punto de venta *'), { target: { value: '1' } })
    fireEvent.click(screen.getByText('Guardar identidad fiscal'))

    await waitFor(() => expect(screen.getByText('Identidad fiscal guardada.')).toBeInTheDocument())

    const put = calls.find((c) => c.url.includes('/api/fiscal/profile') && c.method === 'PUT')
    expect(put).toBeTruthy()
    expect(put?.body).toMatchObject({
      cuit: '20123456789',
      point_of_sale: 1,
      tax_condition: 'MONOTRIBUTO',
      default_invoice_type: 'FACTURA_C',
    })
  })
})

describe('CertSection — write-only private key', () => {
  const PROFILE = {
    store_id: 'store-1',
    cuit: '20123456789',
    tax_condition: 'MONOTRIBUTO',
    point_of_sale: 1,
    default_invoice_type: 'FACTURA_C',
    razon_social: null,
    environment: 'testing',
    status: 'coming_soon', // cert not loaded yet → the upload form renders
    created_at: 1,
    updated_at: null,
  }

  it('clears the private key (and cert) from the DOM after a FAILED upload', async () => {
    // The private key PEM is write-only: it must never linger in the textarea
    // after a submit — including the error path (contradicting the contract).
    installFetch({ entitled: true, profile: PROFILE, certFail: true })
    render(<FiscalPage />)
    await waitFor(() => expect(screen.getByText('Certificado AFIP')).toBeInTheDocument())

    const certBox = screen.getByLabelText('Certificado (PEM) *') as HTMLTextAreaElement
    const keyBox = screen.getByLabelText('Clave privada (PEM) *') as HTMLTextAreaElement
    fireEvent.change(certBox, { target: { value: '-----BEGIN CERTIFICATE-----abc' } })
    fireEvent.change(keyBox, { target: { value: '-----BEGIN PRIVATE KEY-----secret' } })
    fireEvent.click(screen.getByText('Subir certificado'))

    // The failure surfaces a coded error…
    await waitFor(() => expect(screen.getByText(/cert inválido/)).toBeInTheDocument())
    // …but the private key (and cert) must NOT survive in the DOM.
    expect(keyBox.value).toBe('')
    expect(certBox.value).toBe('')
  })
})
