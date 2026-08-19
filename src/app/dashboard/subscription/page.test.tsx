/**
 * Integration test for the subscription page's create-subscription call.
 *
 * Focus: `handleSubscribe` must include `businessType` in the POST
 * /api/subscriptions body, sourced from the merchant's profile and collapsed to
 * billing's enum via `toBillingBusinessType`. Without it, billing defaults every
 * new account to 'food' and a servicios pro gets the wrong vertical entitlements.
 *
 * We fake global fetch (mirroring the fiscal page test) and route by URL/verb.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'

// ProfileContext → a store is active. business_type drives the subscription's
// vertical; here it's the 'food+appointment' combo billing cannot store.
vi.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    activeProfile: { id: 'p1', store_id: 'store-1', business_type: 'food+appointment', display_name: 'Café Co' },
    profiles: [],
    switchProfile: vi.fn(),
    refreshProfiles: vi.fn(),
    loading: false,
  }),
}))

import SubscriptionPage from './page'

type JsonResponse = { ok: boolean; status?: number; body: unknown }
const json = (r: JsonResponse) =>
  Promise.resolve({
    ok: r.ok,
    status: r.status ?? (r.ok ? 200 : 500),
    json: async () => r.body,
    text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)),
  })

const PLAN = {
  tier: 'starter',
  name: 'Starter',
  headline: 'Para crecer',
  description: 'Plan starter.',
  pricing: {
    monthly: { amount: 10, amount_cents: 1000, currency: 'USD', lookup_key: null },
    yearly: { amount: 100, amount_cents: 10000, currency: 'USD', lookup_key: null, savings_pct: 16 },
  },
  limits: { staffSeats: 3, locations: 1, aiGenerationsMonthly: 0, verifyKycMonthly: 0 },
  modules: [],
}

let calls: Array<{ url: string; method: string; body: any }> = []

function installFetch(opts: { me?: unknown } = {}) {
  calls = []
  const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ url, method, body })

    if (url.includes('/api/billing/plans')) {
      return json({
        ok: true,
        body: {
          currency: 'USD',
          intervals_available: ['month', 'year'],
          plans: [PLAN],
          perRubro: { essentialsByType: {}, advancedByTypeStarter: {} },
          addons: [],
        },
      })
    }
    if (url.includes('/api/billing/me/modules')) {
      // No current subscription → null so the plan renders as "choose".
      return opts.me ? json({ ok: true, body: opts.me }) : json({ ok: false, status: 404, body: {} })
    }
    if (url.includes('/api/subscriptions') && method === 'POST') {
      return json({ ok: true, status: 201, body: { id: 'sub-1', checkout_url: 'https://pay.example/x' } })
    }
    if (url.includes('/api/subscriptions') && method === 'GET') {
      // No active subscription on file → handleChange falls back to create.
      return json({ ok: false, status: 404, body: {} })
    }
    throw new Error(`unexpected fetch: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  localStorage.setItem('token', 'tok-test')
  vi.stubGlobal('alert', vi.fn())
  // Clicking "choose" navigates on success; stub it so jsdom doesn't throw.
  Object.defineProperty(window, 'location', {
    value: { href: '', reload: vi.fn() },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('SubscriptionPage — create subscription', () => {
  it('POSTs businessType (collapsed from the profile) to /api/subscriptions', async () => {
    installFetch()
    render(<SubscriptionPage />)

    // Plan card renders → click "Elegir plan" (choose action, no current tier).
    const btn = await screen.findByText('Elegir plan')
    fireEvent.click(btn)

    await waitFor(() =>
      expect(calls.some((c) => c.url.includes('/api/subscriptions') && c.method === 'POST')).toBe(true),
    )

    const post = calls.find((c) => c.url.includes('/api/subscriptions') && c.method === 'POST')
    expect(post?.body).toMatchObject({
      restaurantId: 'store-1',
      plan: 'starter',
      trialDays: 14,
      // 'food+appointment' collapses to billing's 'food'.
      businessType: 'food',
    })
  })

  it('prefers me.business_type over the active profile when present', async () => {
    installFetch({
      me: {
        tier: 'free',
        business_type: 'appointment',
        billing_interval: 'year',
        modules: [],
        limits: PLAN.limits,
        addons: [],
        restaurantId: 'store-1',
      },
    })
    render(<SubscriptionPage />)

    // me.tier is 'free' → the starter plan is an "upgrade"; confirm, then it POSTs
    // a create (no active sub on file → handleChange falls back to handleSubscribe).
    const btn = await screen.findByText('Upgrade')
    fireEvent.click(btn)
    fireEvent.click(await screen.findByText('Confirmar'))

    await waitFor(() =>
      expect(calls.some((c) => c.url.includes('/api/subscriptions') && c.method === 'POST')).toBe(true),
    )
    const post = calls.find((c) => c.url.includes('/api/subscriptions') && c.method === 'POST')
    expect(post?.body).toMatchObject({ businessType: 'appointment' })
  })
})
