/**
 * Unit tests for the fiscal e-invoicing api.ts methods (Phase 3).
 *
 * We fake global fetch (mirroring the /track page test's approach) and assert
 * each method hits the right gateway path + verb + body, parses the response,
 * and — per the lane error-handling rule — surfaces the server's { error, code }
 * as an ApiError carrying both .code and .status (never a raw internal).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api, type ApiError } from './api'

const BASE = 'https://api.runbits.dev'

type JsonResponse = { ok: boolean; status?: number; body: unknown }

function respond(r: JsonResponse) {
  return Promise.resolve({
    ok: r.ok,
    status: r.status ?? (r.ok ? 200 : 500),
    json: async () => r.body,
    text: async () => JSON.stringify(r.body),
  })
}

let lastInit: RequestInit | undefined
let lastUrl = ''

function install(r: JsonResponse) {
  const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
    lastUrl = String(input)
    lastInit = init
    return respond(r)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  lastInit = undefined
  lastUrl = ''
  localStorage.setItem('token', 'tok-test')
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('api fiscal methods — happy paths', () => {
  const PROFILE = {
    store_id: 'store-1',
    cuit: '20123456789',
    tax_condition: 'MONOTRIBUTO',
    point_of_sale: 1,
    default_invoice_type: 'FACTURA_C',
    razon_social: 'Mi Comercio',
    environment: 'testing',
    status: 'coming_soon',
    created_at: 1,
    updated_at: 2,
  }

  it('getFiscalProfile GETs /api/fiscal/profile with the bearer token', async () => {
    install({ ok: true, body: { profile: PROFILE } })
    const res = await api.getFiscalProfile()
    expect(lastUrl).toBe(`${BASE}/api/fiscal/profile`)
    expect((lastInit?.method ?? 'GET')).toBe('GET')
    expect((lastInit?.headers as Record<string, string>).Authorization).toBe('Bearer tok-test')
    expect(res.profile.cuit).toBe('20123456789')
  })

  it('putFiscalProfile PUTs the identity payload', async () => {
    install({ ok: true, body: { profile: PROFILE } })
    await api.putFiscalProfile({
      cuit: '20123456789',
      tax_condition: 'MONOTRIBUTO',
      point_of_sale: 1,
      default_invoice_type: 'FACTURA_C',
    })
    expect(lastUrl).toBe(`${BASE}/api/fiscal/profile`)
    expect(lastInit?.method).toBe('PUT')
    expect(JSON.parse(String(lastInit?.body))).toMatchObject({
      cuit: '20123456789',
      point_of_sale: 1,
      default_invoice_type: 'FACTURA_C',
    })
  })

  it('uploadFiscalCert POSTs { cert, key } and returns metadata only', async () => {
    install({ ok: true, status: 201, body: { ok: true, status: 'cert_loaded', cert_not_after: 999, fingerprint_sha256: 'ab' } })
    const res = await api.uploadFiscalCert('CERT-PEM', 'KEY-PEM')
    expect(lastUrl).toBe(`${BASE}/api/fiscal/cert`)
    expect(lastInit?.method).toBe('POST')
    expect(JSON.parse(String(lastInit?.body))).toEqual({ cert: 'CERT-PEM', key: 'KEY-PEM' })
    expect(res.status).toBe('cert_loaded')
    expect(res.cert_not_after).toBe(999)
    // Contract: the method exposes ONLY the documented non-secret metadata
    // fields — the server never returns the cert/key PEMs, and the client adds
    // no fields of its own. Assert the real observable shape (not a tautology
    // over a key the mock never included).
    expect(Object.keys(res).sort()).toEqual(
      ['cert_not_after', 'fingerprint_sha256', 'ok', 'status'].sort(),
    )
    expect(res.ok).toBe(true)
    expect(res.fingerprint_sha256).toBe('ab')
  })

  it('deleteFiscalCert DELETEs the cert', async () => {
    install({ ok: true, body: { ok: true, deactivated: 1 } })
    const res = await api.deleteFiscalCert()
    expect(lastUrl).toBe(`${BASE}/api/fiscal/cert`)
    expect(lastInit?.method).toBe('DELETE')
    expect(res.deactivated).toBe(1)
  })

  it('listFiscalInvoices builds the paginated query string', async () => {
    install({ ok: true, body: { invoices: [] } })
    await api.listFiscalInvoices({ limit: 20, offset: 40 })
    expect(lastUrl).toBe(`${BASE}/api/fiscal/invoices?limit=20&offset=40`)
  })

  it('getFiscalInvoicePdfUrl builds the authed PDF URL without fetching', () => {
    const fetchMock = install({ ok: true, body: {} })
    const url = api.getFiscalInvoicePdfUrl('inv-1')
    expect(url).toBe(`${BASE}/api/fiscal/invoices/inv-1/pdf`)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('api fiscal methods — error handling rule', () => {
  it('surfaces the server { error, code } as an ApiError with .code and .status', async () => {
    install({ ok: false, status: 404, body: { error: 'no fiscal profile for this store', code: 'FISCAL_PROFILE_NOT_FOUND' } })
    let caught: ApiError | null = null
    try {
      await api.getFiscalProfile()
    } catch (e) {
      caught = e as ApiError
    }
    expect(caught).not.toBeNull()
    expect(caught?.message).toBe('no fiscal profile for this store')
    expect(caught?.code).toBe('FISCAL_PROFILE_NOT_FOUND')
    expect(caught?.status).toBe(404)
  })

  it('does not leak raw internals when the body has no error field', async () => {
    install({ ok: false, status: 500, body: {} })
    await expect(api.uploadFiscalCert('c', 'k')).rejects.toThrow('HTTP 500')
  })

  it('surfaces a coded ApiError when the post-refresh retry fails again (no silent success)', async () => {
    // A 401 triggers the refresh+retry path. The refresh succeeds and rotates
    // the tokens, but the RETRIED call fails again (500). This must surface as a
    // coded ApiError — never be returned as if it were success data (which would
    // e.g. render a failed getFiscalProfile as "not configured").
    localStorage.setItem('refreshToken', 'refresh-abc')
    let call = 0
    const fetchMock = vi.fn((input: unknown) => {
      const url = String(input)
      if (url.includes('/api/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ token: 'new-tok', refreshToken: 'new-refresh' }),
          text: async () => '',
        })
      }
      call += 1
      if (call === 1) {
        // Original request → 401, kicks off refresh+retry.
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'token expired' }),
          text: async () => '',
        })
      }
      // Retried request (with the fresh token) → fails again with a coded body.
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: 'upstream is down', code: 'FISCAL_UPSTREAM_DOWN' }),
        text: async () => '',
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    let caught: ApiError | null = null
    try {
      await api.getFiscalProfile()
    } catch (e) {
      caught = e as ApiError
    }
    expect(caught).not.toBeNull()
    expect(caught?.message).toBe('upstream is down')
    expect(caught?.code).toBe('FISCAL_UPSTREAM_DOWN')
    expect(caught?.status).toBe(500)
    // The refresh still rotated the tokens before the retry was attempted.
    expect(localStorage.getItem('token')).toBe('new-tok')
  })

  it('still returns data when the post-refresh retry succeeds (backward-compatible)', async () => {
    localStorage.setItem('refreshToken', 'refresh-abc')
    let call = 0
    const fetchMock = vi.fn((input: unknown) => {
      const url = String(input)
      if (url.includes('/api/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ token: 'new-tok', refreshToken: 'new-refresh' }),
          text: async () => '',
        })
      }
      call += 1
      if (call === 1) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({ error: 'token expired' }), text: async () => '' })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ invoices: [] }),
        text: async () => '',
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await api.listFiscalInvoices({ limit: 20, offset: 0 })
    expect(res.invoices).toEqual([])
    expect(localStorage.getItem('token')).toBe('new-tok')
  })
})
