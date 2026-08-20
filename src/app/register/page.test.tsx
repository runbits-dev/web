/**
 * Integration test for the /register onboarding funnel.
 *
 * Focus: after api.register → createProfile → switchProfile succeed, the funnel
 * MUST fire a best-effort POST /api/subscriptions with plan:'free' carrying the
 * profile's vertical (collapsed via toBillingBusinessType), then navigate to
 * /dashboard. Billing's entitlement checks require the subscription row to exist
 * with business_type set. The POST is best-effort: a billing failure must NOT
 * block navigation.
 *
 * i18n is left unmocked — the default context's t() returns the key itself, so
 * button/placeholder text below are the raw translation keys.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'

const { push, register, createProfile, switchProfile } = vi.hoisted(() => ({
  push: vi.fn(),
  register: vi.fn(),
  createProfile: vi.fn(),
  switchProfile: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

vi.mock('@/lib/api', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/api')>()
  return {
    ...actual, // keeps the REAL createFreeSubscription
    api: { ...actual.api, register, createProfile, switchProfile },
  }
})

import RegisterPage from './page'

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
  push.mockReset()
  register.mockReset()
  createProfile.mockReset()
  switchProfile.mockReset()
  register.mockResolvedValue({ token: 'reg-tok', user: { id: 'u1', name: 'Ada', email: 'ada@x.com' } })
  switchProfile.mockResolvedValue({ token: 'switched-tok', activeProfile: { store_id: 'store-99' } })
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

// Drive the 6-step wizard to the final "create profile" click for a services
// (peluquería / appointment) independent merchant.
async function completeServicesRegistration() {
  // Step 1: account fields → next
  fireEvent.change(screen.getByPlaceholderText('register.namePlaceholder'), { target: { value: 'Ada' } })
  fireEvent.change(screen.getByPlaceholderText('register.emailPlaceholder'), { target: { value: 'ada@x.com' } })
  fireEvent.change(screen.getByPlaceholderText('register.passwordPlaceholder'), { target: { value: 'secret123' } })
  fireEvent.click(screen.getByText('register.next'))
  // Step 2: offer type = services
  fireEvent.click(await screen.findByText('register.step2.services'))
  // Step 3: category = peluquería → next
  fireEvent.click(await screen.findByText('register.categories.peluqueria'))
  fireEvent.click(screen.getByText('register.next'))
  // Step 4: operation type = independent (auto-advances to step 5)
  fireEvent.click(await screen.findByText('register.step4.independent'))
  // Step 5: plan (free default) → next
  fireEvent.click(await screen.findByText('register.next'))
  // Step 6: business name → create
  fireEvent.change(await screen.findByPlaceholderText('register.summary.profileNamePlaceholder'), {
    target: { value: 'Ada Peluquería' },
  })
  fireEvent.click(screen.getByText('register.createProfile'))
}

describe('RegisterPage — free subscription on profile create', () => {
  it("POSTs plan:'free' with businessType 'appointment', then navigates to /dashboard", async () => {
    createProfile.mockResolvedValue({ id: 'p1', store_id: 'store-99', business_type: 'appointment' })
    installFetch()
    render(<RegisterPage />)

    await completeServicesRegistration()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    const post = calls.find(c => c.url.includes('/api/subscriptions') && c.method === 'POST')
    expect(post).toBeTruthy()
    expect(post?.body).toEqual({
      restaurantId: 'store-99',
      plan: 'free',
      interval: 'month',
      businessType: 'appointment',
    })
  })

  it('still navigates to /dashboard when the subscription POST fails (best-effort)', async () => {
    createProfile.mockResolvedValue({ id: 'p2', store_id: 'store-55', business_type: 'appointment' })
    installFetch({ ok: false, status: 500, body: { error: 'billing down', code: 'BILLING_DOWN' } })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<RegisterPage />)

    await completeServicesRegistration()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('skips the subscription POST (no garbage) when the new profile has no store_id', async () => {
    createProfile.mockResolvedValue({ id: 'p3', store_id: null, business_type: 'appointment' })
    switchProfile.mockResolvedValue({ token: 'switched-tok', activeProfile: { store_id: null } })
    const fetchMock = installFetch()
    render(<RegisterPage />)

    await completeServicesRegistration()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    // No store_id anywhere → the funnel must NOT POST a subscription with a bad id.
    const post = calls.find(c => c.url.includes('/api/subscriptions') && c.method === 'POST')
    expect(post).toBeUndefined()
  })
})
