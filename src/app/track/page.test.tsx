/**
 * Unit tests for the /track live-tracking state machine.
 *
 * Focus: the two-system fallback in TrackContent —
 *   System B = short-lived-token gateway WebSocket (live, preferred)
 *   System A = the never-stopping public /tracking poll (seamless fallback)
 *
 * These are the first *unit* tests in runbits-web; the existing Playwright e2e
 * suite (tests/e2e, driven by `npm run test:e2e`) is untouched. Here we fake
 * fetch, WebSocket and (where reconnect/cleanup timing matters) the timers, so
 * every branch of the effect in page.tsx is driven in isolation without a
 * browser.
 *
 * Error-handling note: the component under test already returns/handles its own
 * failures (fail-closed onto the poll). The harness itself follows the lane's
 * error rule — the fake fetch throws a coded error for any URL a test did not
 * explicitly wire, so an accidental un-mocked request fails loudly instead of
 * hitting the network or hanging.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
import TrackPage from './page'

// --- next/navigation: the component reads ?id via useSearchParams -----------
const ORDER_ID = 'order-abc123'
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(`id=${ORDER_ID}`),
}))

// --- Controllable fake WebSocket -------------------------------------------
// Records every instance so a test can grab the live socket and emit
// open/message/error/close on demand.
class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  url: string
  onopen: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onerror: ((ev: unknown) => void) | null = null
  onclose: (() => void) | null = null
  closed = false
  readyState = 0

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  close() {
    this.closed = true
    this.readyState = 3
  }

  // Test-facing emitters. The component assigns handlers synchronously inside
  // connect(); tests call these after awaiting socket creation.
  emitOpen() {
    this.readyState = 1
    this.onopen?.()
  }
  emitMessage(obj: unknown) {
    this.onmessage?.({ data: JSON.stringify(obj) })
  }
  emitError() {
    this.onerror?.(new Event('error'))
  }
  emitClose() {
    this.readyState = 3
    this.onclose?.()
  }
}

// --- Fetch router -----------------------------------------------------------
// A test declares only the responses it cares about; anything else throws a
// coded error so stray requests are caught, not silently swallowed.
type JsonResponse = { ok: boolean; status?: number; body: unknown }

interface FetchPlan {
  order?: JsonResponse
  tracking?: JsonResponse
  token?: JsonResponse
  limits?: JsonResponse
}

let tokenFetchCount = 0
let trackingFetchCount = 0

function installFetch(plan: FetchPlan) {
  tokenFetchCount = 0
  trackingFetchCount = 0
  const respond = (r: JsonResponse) =>
    Promise.resolve({
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      json: async () => r.body,
    })

  const fetchMock = vi.fn((input: string) => {
    const url = String(input)
    if (url.includes('/tracking-token')) {
      tokenFetchCount += 1
      if (!plan.token) throw { error: 'no token plan', code: 'TEST_FETCH_UNMOCKED' }
      return respond(plan.token)
    }
    if (url.includes('/tracking')) {
      trackingFetchCount += 1
      if (!plan.tracking) throw { error: 'no tracking plan', code: 'TEST_FETCH_UNMOCKED' }
      return respond(plan.tracking)
    }
    if (url.includes('/limits')) {
      return respond(plan.limits ?? { ok: true, body: { limits: {} } })
    }
    if (url.includes('/api/orders/')) {
      if (!plan.order) throw { error: 'no order plan', code: 'TEST_FETCH_UNMOCKED' }
      return respond(plan.order)
    }
    throw { error: `unexpected fetch: ${url}`, code: 'TEST_FETCH_UNEXPECTED' }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// A trackable, in-flight order so the tracking + WS sections render.
const ORDER_BODY = {
  status: 'IN_TRANSIT',
  total: 250000,
  restaurant_id: 'rest-1',
  items: [{ name: 'Milanesa', quantity: 1, price: 250000 }],
}

const POS_A = { lat: -31.4, lng: -64.1 } // from the System A poll
const POS_B = { lat: -31.42, lng: -64.19 } // from the System B WS
const POS_C = { lat: -31.45, lng: -64.25 } // from a later poll

// Returns the live-map iframe src (or null if the map is not shown).
function mapSrc(): string | null {
  const iframe = document.querySelector('iframe')
  return iframe?.getAttribute('src') ?? null
}

beforeEach(() => {
  FakeWebSocket.instances = []
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('/track — System B WebSocket path', () => {
  it('renders the rider position from a {type:position} WS frame', async () => {
    installFetch({
      order: { ok: true, body: ORDER_BODY },
      tracking: { ok: true, body: { trackable: true, position: POS_A } },
      token: { ok: true, body: { token: 'tok-1', wsPath: `/api/tracking/ws/customer/${ORDER_ID}` } },
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    render(<TrackPage />)

    // Poll paints POS_A first (map visible).
    await waitFor(() => expect(mapSrc()).toContain(`marker=${POS_A.lat},${POS_A.lng}`))

    // The WS opens and pushes a fresher live position → System B takes over.
    await waitFor(() => expect(FakeWebSocket.instances.length).toBe(1))
    const sock = FakeWebSocket.instances[0]
    await act(async () => {
      sock.emitOpen()
      sock.emitMessage({ type: 'position', lat: POS_B.lat, lng: POS_B.lng })
    })

    await waitFor(() => expect(mapSrc()).toContain(`marker=${POS_B.lat},${POS_B.lng}`))
  })

  it('ignores malformed WS frames without crashing (poll stays authoritative)', async () => {
    installFetch({
      order: { ok: true, body: ORDER_BODY },
      tracking: { ok: true, body: { trackable: true, position: POS_A } },
      token: { ok: true, body: { token: 'tok-1' } },
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    render(<TrackPage />)
    await waitFor(() => expect(mapSrc()).toContain(`marker=${POS_A.lat},${POS_A.lng}`))
    await waitFor(() => expect(FakeWebSocket.instances.length).toBe(1))

    const sock = FakeWebSocket.instances[0]
    await act(async () => {
      sock.emitOpen()
      // Non-JSON + wrong-type frames must be swallowed by the component.
      sock.onmessage?.({ data: 'not-json{' })
      sock.emitMessage({ type: 'heartbeat' })
    })

    // Still showing the poll position, still mounted, no throw.
    expect(mapSrc()).toContain(`marker=${POS_A.lat},${POS_A.lng}`)
  })
})

describe('/track — System A fallback', () => {
  it('falls back to the poll when the token fetch fails (no socket opened)', async () => {
    installFetch({
      order: { ok: true, body: ORDER_BODY },
      tracking: { ok: true, body: { trackable: true, position: POS_A } },
      token: { ok: false, body: {} }, // token endpoint down → stay on poll
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    render(<TrackPage />)

    await waitFor(() => expect(mapSrc()).toContain(`marker=${POS_A.lat},${POS_A.lng}`))
    // Token was attempted, but no socket was ever constructed.
    await waitFor(() => expect(tokenFetchCount).toBeGreaterThan(0))
    expect(FakeWebSocket.instances.length).toBe(0)
    expect(mapSrc()).toContain(`marker=${POS_A.lat},${POS_A.lng}`)
  })

  it('falls back to the poll when WebSocket is unavailable in the runtime', async () => {
    installFetch({
      order: { ok: true, body: ORDER_BODY },
      tracking: { ok: true, body: { trackable: true, position: POS_A } },
      // no token plan on purpose: it must never be fetched
    })
    vi.stubGlobal('WebSocket', undefined)

    render(<TrackPage />)

    await waitFor(() => expect(mapSrc()).toContain(`marker=${POS_A.lat},${POS_A.lng}`))
    // WS-unsupported branch returns before touching the token endpoint.
    expect(tokenFetchCount).toBe(0)
    expect(FakeWebSocket.instances.length).toBe(0)
  })

  it('keeps the last-known position when the socket errors then closes (never blank)', async () => {
    installFetch({
      order: { ok: true, body: ORDER_BODY },
      tracking: { ok: true, body: { trackable: true, position: POS_A } },
      token: { ok: true, body: { token: 'tok-1' } },
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    render(<TrackPage />)
    await waitFor(() => expect(mapSrc()).toContain(`marker=${POS_A.lat},${POS_A.lng}`))
    await waitFor(() => expect(FakeWebSocket.instances.length).toBe(1))

    const sock = FakeWebSocket.instances[0]
    await act(async () => {
      sock.emitOpen()
      sock.emitMessage({ type: 'position', lat: POS_B.lat, lng: POS_B.lng })
    })
    await waitFor(() => expect(mapSrc()).toContain(`marker=${POS_B.lat},${POS_B.lng}`))

    // Live channel drops. The poll never stopped, so the map must stay up with
    // the last-known position rather than disappearing.
    await act(async () => {
      sock.emitError()
      sock.emitClose()
    })
    expect(mapSrc()).toContain(`marker=${POS_B.lat},${POS_B.lng}`)
  })
})

describe('/track — reconnect + cleanup', () => {
  it('re-mints a token on the backoff reconnect after an unexpected close', async () => {
    vi.useFakeTimers()
    installFetch({
      order: { ok: true, body: ORDER_BODY },
      tracking: { ok: true, body: { trackable: true, position: POS_A } },
      token: { ok: true, body: { token: 'tok-1' } },
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    render(<TrackPage />)

    // Flush initial async chain: order + tracking fetch → setTrackable(true) →
    // WS effect re-runs → token fetch → socket #1.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(FakeWebSocket.instances.length).toBe(1)
    expect(tokenFetchCount).toBe(1)

    // Open then unexpectedly close → schedules a 2s backoff reconnect.
    await act(async () => {
      FakeWebSocket.instances[0].emitOpen()
      FakeWebSocket.instances[0].emitClose()
    })
    expect(tokenFetchCount).toBe(1) // not yet — retry is scheduled, not fired

    // Fire the backoff timer: connect() runs again and re-fetches a fresh token.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(tokenFetchCount).toBe(2)
    expect(FakeWebSocket.instances.length).toBe(2)
  })

  it('closes the socket, clears the retry timer and does not update state after unmount', async () => {
    vi.useFakeTimers()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    installFetch({
      order: { ok: true, body: ORDER_BODY },
      tracking: { ok: true, body: { trackable: true, position: POS_A } },
      token: { ok: true, body: { token: 'tok-1' } },
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    const { unmount } = render(<TrackPage />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(FakeWebSocket.instances.length).toBe(1)
    const sock = FakeWebSocket.instances[0]

    // Trigger a pending reconnect, then unmount before it fires.
    await act(async () => {
      sock.emitOpen()
      sock.emitClose()
    })
    const tokensBeforeUnmount = tokenFetchCount

    unmount()
    expect(sock.closed).toBe(true) // cleanup closed the live socket

    // Advance well past every backoff/poll timer. Nothing should reconnect and
    // no state update should fire on the unmounted tree.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000)
    })
    expect(tokenFetchCount).toBe(tokensBeforeUnmount) // no dangling reconnect

    // No React act()/"update on unmounted component" warnings leaked.
    const actWarning = errSpy.mock.calls.find((c) =>
      String(c[0]).match(/not wrapped in act|unmounted component/i),
    )
    expect(actWarning).toBeUndefined()
    errSpy.mockRestore()
  })
})
