/**
 * Integration test for InitialOnboarding — the dashboard onboarding funnel.
 *
 * Focus: after the profile is created + switched, the funnel MUST fire a
 * best-effort POST /api/subscriptions with plan:'free' carrying the profile's
 * vertical (collapsed via toBillingBusinessType). Billing's booking_basic (and
 * other) entitlement checks require the subscription row to exist with
 * business_type set. The POST is best-effort: a billing failure must NOT block
 * onboarding — the funnel still switches profile and calls onComplete().
 *
 * We keep createProfile/switchProfile mocked but let the REAL
 * createFreeSubscription run against a faked global fetch, so we assert the
 * exact POST body the funnel sends.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'

const { createProfile, switchProfile } = vi.hoisted(() => ({
  createProfile: vi.fn(),
  switchProfile: vi.fn(),
}))

vi.mock('@/lib/api', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/api')>()
  return {
    ...actual, // keeps the REAL createFreeSubscription
    api: { ...actual.api, createProfile, switchProfile },
  }
})

import { InitialOnboarding } from './InitialOnboarding'

type JsonResponse = { ok: boolean; status?: number; body: unknown }
const json = (r: JsonResponse) =>
  Promise.resolve({
    ok: r.ok,
    status: r.status ?? (r.ok ? 200 : 500),
    json: async () => r.body,
    text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)),
  })

let calls: Array<{ url: string; method: string; body: any }> = []

function installFetch(subResponse: JsonResponse = { ok: true, status: 201, body: { id: 'sub-1' } }) {
  calls = []
  const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ url, method, body })
    if (url.includes('/api/subscriptions') && method === 'POST') return json(subResponse)
    throw new Error(`unexpected fetch: ${method} ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  createProfile.mockReset()
  switchProfile.mockReset()
  switchProfile.mockResolvedValue({ token: 'switched-tok', activeProfile: { store_id: 'store-99' } })
  localStorage.setItem('token', 'tok-test')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

/**
 * Drive the funnel to the final "create" click.
 * @param offerLabel  Step-1 offer-type button label ('Servicios' | 'Productos')
 * @param categoryLabel Step-2 featured category label ('Peluquería' | 'Restaurante')
 */
async function completeOnboarding(offerLabel: string, categoryLabel: string) {
  // Step 1: offer type
  fireEvent.click(screen.getByText(offerLabel))
  // Step 2: category → Siguiente
  fireEvent.click(await screen.findByText(categoryLabel))
  fireEvent.click(screen.getByText('Siguiente'))
  // Step 3: operation type → Siguiente
  fireEvent.click(await screen.findByText('Independiente'))
  fireEvent.click(screen.getByText('Siguiente'))
  // Step 4 (first profile): plan → Siguiente
  fireEvent.click(await screen.findByText('Siguiente'))
  // Step 5: name → create
  fireEvent.change(await screen.findByPlaceholderText(/Juan Pérez/), { target: { value: 'Mi Barbería' } })
  fireEvent.click(screen.getByText('Crear mi perfil'))
}

describe('InitialOnboarding — free subscription on profile create', () => {
  it("POSTs plan:'free' with businessType 'appointment' for a services (peluquería) profile", async () => {
    createProfile.mockResolvedValue({ id: 'p1', store_id: 'store-99', business_type: 'appointment' })
    installFetch()
    const onComplete = vi.fn()
    render(<InitialOnboarding onComplete={onComplete} />)

    await completeOnboarding('Servicios', 'Peluquería')

    await waitFor(() => expect(onComplete).toHaveBeenCalled())
    const post = calls.find(c => c.url.includes('/api/subscriptions') && c.method === 'POST')
    expect(post).toBeTruthy()
    expect(post?.body).toEqual({
      restaurantId: 'store-99',
      plan: 'free',
      interval: 'month',
      businessType: 'appointment',
    })
  })

  it("POSTs businessType 'food' for a products (restaurante) profile", async () => {
    createProfile.mockResolvedValue({ id: 'p2', store_id: 'store-77', business_type: 'food' })
    installFetch()
    const onComplete = vi.fn()
    render(<InitialOnboarding onComplete={onComplete} />)

    await completeOnboarding('Productos', 'Restaurante')

    await waitFor(() => expect(onComplete).toHaveBeenCalled())
    const post = calls.find(c => c.url.includes('/api/subscriptions') && c.method === 'POST')
    expect(post?.body).toMatchObject({ restaurantId: 'store-77', plan: 'free', businessType: 'food' })
  })

  it('still completes onboarding (onComplete) when the subscription POST fails (best-effort)', async () => {
    createProfile.mockResolvedValue({ id: 'p3', store_id: 'store-55', business_type: 'appointment' })
    installFetch({ ok: false, status: 500, body: { error: 'billing down', code: 'BILLING_DOWN' } })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onComplete = vi.fn()
    render(<InitialOnboarding onComplete={onComplete} />)

    await completeOnboarding('Servicios', 'Peluquería')

    // onComplete fires despite the 5xx, and the token was still switched.
    await waitFor(() => expect(onComplete).toHaveBeenCalled())
    expect(localStorage.getItem('token')).toBe('switched-tok')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
