/**
 * Unit tests for the fiscal e-invoicing api.ts methods (Phase 3).
 *
 * We fake global fetch (mirroring the /track page test's approach) and assert
 * each method hits the right gateway path + verb + body, parses the response,
 * and — per the lane error-handling rule — surfaces the server's { error, code }
 * as an ApiError carrying both .code and .status (never a raw internal).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api, createFreeSubscription, type ApiError } from './api'

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

describe('createFreeSubscription — onboarding free-plan fast-path', () => {
  it("POSTs plan:'free' + interval:'month' with restaurantId, businessType and bearer token", async () => {
    const fetchMock = install({ ok: true, status: 201, body: { id: 'sub-1' } })
    await createFreeSubscription('store-42', 'appointment')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(lastUrl).toBe(`${BASE}/api/subscriptions`)
    expect(lastInit?.method).toBe('POST')
    expect((lastInit?.headers as Record<string, string>).Authorization).toBe('Bearer tok-test')
    expect(JSON.parse(String(lastInit?.body))).toEqual({
      restaurantId: 'store-42',
      plan: 'free',
      interval: 'month',
      businessType: 'appointment',
    })
  })

  it('resolves (does not throw) on 200 already-exists', async () => {
    install({ ok: true, status: 200, body: { id: 'sub-existing' } })
    await expect(createFreeSubscription('store-1', 'food')).resolves.toBeUndefined()
  })

  it('resolves (does not throw) on a 409 create race', async () => {
    install({ ok: false, status: 409, body: { error: 'already exists', code: 'SUBSCRIPTION_EXISTS' } })
    await expect(createFreeSubscription('store-1', 'task')).resolves.toBeUndefined()
  })

  it('throws a coded ApiError on 5xx so the caller can log it (best-effort)', async () => {
    install({ ok: false, status: 500, body: { error: 'billing down', code: 'BILLING_DOWN' } })
    let caught: ApiError | null = null
    try {
      await createFreeSubscription('store-1', 'realtime')
    } catch (e) {
      caught = e as ApiError
    }
    expect(caught).not.toBeNull()
    expect(caught?.message).toBe('billing down')
    expect(caught?.code).toBe('BILLING_DOWN')
    expect(caught?.status).toBe(500)
  })

  it('throws a coded ApiError (not a raw Error) on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))))
    let caught: ApiError | null = null
    try {
      await createFreeSubscription('store-1', 'appointment')
    } catch (e) {
      caught = e as ApiError
    }
    expect(caught).not.toBeNull()
    expect(caught?.code).toBe('FREE_SUBSCRIPTION_CREATE_FAILED')
    expect(caught?.status).toBe(0)
  })
})

describe('api POS + register (caja) methods — happy paths', () => {
  it('posCreateOrder POSTs { storeId, items, note } to /api/pos/orders', async () => {
    install({ ok: true, status: 201, body: { id: 'o1', status: 'pending', items: [], total_cents: 1500 } })
    const res = await api.posCreateOrder('store-1', [{ menuItemId: 'm1', quantity: 2 }], 'sin sal')
    expect(lastUrl).toBe(`${BASE}/api/pos/orders`)
    expect(lastInit?.method).toBe('POST')
    expect((lastInit?.headers as Record<string, string>).Authorization).toBe('Bearer tok-test')
    expect(JSON.parse(String(lastInit?.body))).toEqual({
      storeId: 'store-1',
      items: [{ menuItemId: 'm1', quantity: 2 }],
      note: 'sin sal',
    })
    expect(res.total_cents).toBe(1500)
  })

  it('posCreateOrder sends the Idempotency-Key header when a key is provided', async () => {
    install({ ok: true, status: 201, body: { id: 'o1', status: 'pending', items: [], total_cents: 1500 } })
    await api.posCreateOrder('store-1', [{ menuItemId: 'm1', quantity: 1 }], 'sin sal', 'some-key')
    expect((lastInit?.headers as Record<string, string>)['Idempotency-Key']).toBe('some-key')
  })

  it('posCreateOrder sends NO Idempotency-Key header when the key is omitted', async () => {
    install({ ok: true, status: 201, body: { id: 'o1', status: 'pending', items: [], total_cents: 1500 } })
    await api.posCreateOrder('store-1', [{ menuItemId: 'm1', quantity: 1 }])
    expect((lastInit?.headers as Record<string, string>)['Idempotency-Key']).toBeUndefined()
  })

  it('posCreateOrder omits note when not provided', async () => {
    install({ ok: true, status: 201, body: { id: 'o1', status: 'pending', items: [], total_cents: 0 } })
    await api.posCreateOrder('store-1', [{ menuItemId: 'm1', quantity: 1 }])
    expect(JSON.parse(String(lastInit?.body))).toEqual({
      storeId: 'store-1',
      items: [{ menuItemId: 'm1', quantity: 1 }],
    })
  })

  it('posPayOrder POSTs { method, amountTenderedCents } to /api/pos/orders/:id/pay', async () => {
    install({
      ok: true,
      body: { orderId: 'o1', status: 'paid', paymentMethod: 'cash', totalCents: 1500, changeCents: 500, registerSessionId: 's1' },
    })
    const res = await api.posPayOrder('o1', 'cash', 2000)
    expect(lastUrl).toBe(`${BASE}/api/pos/orders/o1/pay`)
    expect(lastInit?.method).toBe('POST')
    expect(JSON.parse(String(lastInit?.body))).toEqual({ method: 'cash', amountTenderedCents: 2000 })
    expect(res.changeCents).toBe(500)
  })

  it('posPayOrder omits amountTenderedCents for non-cash methods', async () => {
    install({ ok: true, body: { orderId: 'o1', status: 'paid', paymentMethod: 'card', totalCents: 1500, changeCents: 0, registerSessionId: 's1' } })
    await api.posPayOrder('o1', 'card')
    expect(JSON.parse(String(lastInit?.body))).toEqual({ method: 'card' })
  })

  it('registerOpen POSTs { storeId, openingFloatCents } to /api/register/open', async () => {
    install({ ok: true, status: 201, body: { session: { id: 's1', store_id: 'store-1', status: 'open', opening_float_cents: 10000, opened_at: 1 } } })
    const res = await api.registerOpen('store-1', 10000)
    expect(lastUrl).toBe(`${BASE}/api/register/open`)
    expect(lastInit?.method).toBe('POST')
    expect(JSON.parse(String(lastInit?.body))).toEqual({ storeId: 'store-1', openingFloatCents: 10000 })
    expect(res.session.status).toBe('open')
  })

  it('registerMovement POSTs { storeId, type, amountCents, reason }', async () => {
    install({ ok: true, status: 201, body: { movement: { id: 'mv1', type: 'in', amount_cents: 5000, reason: 'vuelto', created_at: 1 } } })
    await api.registerMovement('store-1', 'in', 5000, 'vuelto')
    expect(lastUrl).toBe(`${BASE}/api/register/movements`)
    expect(lastInit?.method).toBe('POST')
    expect(JSON.parse(String(lastInit?.body))).toEqual({ storeId: 'store-1', type: 'in', amountCents: 5000, reason: 'vuelto' })
  })

  it('registerClose POSTs the counted cash and returns the Z report', async () => {
    install({
      ok: true,
      body: {
        sessionId: 's1', openingFloatCents: 10000, cashSalesCents: 20000, cashInCents: 0,
        cashOutCents: 0, expectedCashCents: 30000, countedCashCents: 29500, overShortCents: -500, orderCount: 4,
      },
    })
    const res = await api.registerClose('store-1', 29500)
    expect(lastUrl).toBe(`${BASE}/api/register/close`)
    expect(lastInit?.method).toBe('POST')
    expect(JSON.parse(String(lastInit?.body))).toEqual({ storeId: 'store-1', countedCashCents: 29500 })
    expect(res.overShortCents).toBe(-500)
    expect(res.expectedCashCents).toBe(30000)
  })

  it('registerCurrent GETs /api/register/current with the storeId query', async () => {
    install({ ok: true, body: { session: null } })
    const res = await api.registerCurrent('store-1')
    expect(lastUrl).toBe(`${BASE}/api/register/current?storeId=store-1`)
    expect((lastInit?.method ?? 'GET')).toBe('GET')
    expect(res.session).toBeNull()
  })

  it('registerSessions GETs the paginated close history', async () => {
    install({ ok: true, body: { data: [], limit: 20, offset: 0 } })
    const res = await api.registerSessions('store-1')
    expect(lastUrl).toBe(`${BASE}/api/register/sessions?storeId=store-1`)
    expect(res.limit).toBe(20)
  })
})

describe('api POS + register methods — error handling rule', () => {
  it('surfaces REGISTER_NO_OPEN_SESSION as an ApiError with .code and .status', async () => {
    install({ ok: false, status: 409, body: { error: 'no hay una caja abierta', code: 'REGISTER_NO_OPEN_SESSION' } })
    let caught: ApiError | null = null
    try {
      await api.posPayOrder('o1', 'cash', 2000)
    } catch (e) {
      caught = e as ApiError
    }
    expect(caught).not.toBeNull()
    expect(caught?.message).toBe('no hay una caja abierta')
    expect(caught?.code).toBe('REGISTER_NO_OPEN_SESSION')
    expect(caught?.status).toBe(409)
  })

  it('surfaces REGISTER_ALREADY_OPEN when opening an already-open caja', async () => {
    install({ ok: false, status: 409, body: { error: 'la caja ya está abierta', code: 'REGISTER_ALREADY_OPEN' } })
    let caught: ApiError | null = null
    try {
      await api.registerOpen('store-1', 10000)
    } catch (e) {
      caught = e as ApiError
    }
    expect(caught?.code).toBe('REGISTER_ALREADY_OPEN')
    expect(caught?.status).toBe(409)
  })

  it('surfaces PLAN_LIMIT_EXCEEDED when the POS module is not enabled', async () => {
    install({ ok: false, status: 403, body: { error: 'módulo no disponible en tu plan', code: 'PLAN_LIMIT_EXCEEDED' } })
    let caught: ApiError | null = null
    try {
      await api.posCreateOrder('store-1', [{ menuItemId: 'm1', quantity: 1 }])
    } catch (e) {
      caught = e as ApiError
    }
    expect(caught?.code).toBe('PLAN_LIMIT_EXCEEDED')
    expect(caught?.status).toBe(403)
  })
})
