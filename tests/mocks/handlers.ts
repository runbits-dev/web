import { http, HttpResponse } from 'msw'
import userRestaurant from '../fixtures/user-restaurant.json'
import userSuperadmin from '../fixtures/user-superadmin.json'
import menuItems from '../fixtures/menu-items.json'
import orders from '../fixtures/orders.json'
import statsRestaurant from '../fixtures/stats-restaurant.json'
import adminRestaurants from '../fixtures/admin-restaurants.json'
import adminAgents from '../fixtures/admin-agents.json'
import adminCommissions from '../fixtures/admin-commissions.json'
import adminCommissionsSummary from '../fixtures/admin-commissions-summary.json'
import riders from '../fixtures/riders.json'

const API = 'https://api.runbits.dev'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authHandlers = [
  http.post(`${API}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'owner@laburguesa.com' && body.password === 'password123') {
      return HttpResponse.json({ token: 'mock-token-restaurant', user: userRestaurant })
    }
    if (body.email === 'admin@runbits.dev' && body.password === 'password123') {
      return HttpResponse.json({ token: 'mock-token-superadmin', user: userSuperadmin })
    }
    return HttpResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }),

  http.get(`${API}/api/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Bearer mock-token-restaurant') return HttpResponse.json(userRestaurant)
    if (auth === 'Bearer mock-token-superadmin') return HttpResponse.json(userSuperadmin)
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }),

  http.patch(`${API}/api/auth/profile`, async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({ ...userRestaurant, ...body })
  }),
]

// ── Menu ──────────────────────────────────────────────────────────────────────

let mockMenu = [...menuItems]

export const menuHandlers = [
  http.get(`${API}/api/restaurants/:restaurantId/menu`, () => {
    return HttpResponse.json(mockMenu)
  }),

  http.post(`${API}/api/restaurants/:restaurantId/menu`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const newItem = {
      id: `item-${Date.now()}`,
      restaurant_id: 'rest-001',
      name: body.name as string,
      description: (body.description as string) ?? '',
      price: body.price as number,
      category: (body.category as string) ?? '',
      is_available: body.isAvailable !== false,
      sort_order: mockMenu.length + 1,
      created_at: Date.now(),
    }
    mockMenu = [...mockMenu, newItem]
    return HttpResponse.json(newItem, { status: 201 })
  }),

  http.patch(`${API}/api/restaurants/:restaurantId/menu/:itemId`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    const idx = mockMenu.findIndex(i => i.id === params.itemId)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = {
      ...mockMenu[idx],
      ...(body.name !== undefined && { name: body.name as string }),
      ...(body.description !== undefined && { description: body.description as string }),
      ...(body.price !== undefined && { price: body.price as number }),
      ...(body.isAvailable !== undefined && { is_available: body.isAvailable as boolean }),
    }
    mockMenu = mockMenu.map(i => i.id === params.itemId ? updated : i)
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/api/restaurants/:restaurantId/menu/:itemId`, ({ params }) => {
    mockMenu = mockMenu.filter(i => i.id !== params.itemId)
    return HttpResponse.json({ ok: true })
  }),
]

// ── Stats ─────────────────────────────────────────────────────────────────────

export const statsHandlers = [
  http.get(`${API}/api/restaurants/:restaurantId/stats`, () => {
    return HttpResponse.json(statsRestaurant)
  }),
]

// ── Orders ────────────────────────────────────────────────────────────────────

export const ordersHandlers = [
  http.get(`${API}/api/orders/mine`, () => HttpResponse.json(orders)),
  http.get(`${API}/api/orders`, () => HttpResponse.json(orders)),
]

// ── Admin — Restaurants ───────────────────────────────────────────────────────

export const adminRestaurantsHandlers = [
  http.get(`${API}/api/admin/restaurants`, () => HttpResponse.json(adminRestaurants)),
  http.get(`${API}/api/admin/restaurants/:id`, ({ params }) => {
    const r = adminRestaurants.data.find(r => r.id === params.id)
    return r ? HttpResponse.json(r) : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),
  http.patch(`${API}/api/admin/restaurants/:id/onboarding`, async ({ params, request }) => {
    const body = await request.json() as { onboarding_status: string }
    return HttpResponse.json({ id: params.id, onboarding_status: body.onboarding_status })
  }),
]

// ── Admin — Agents ────────────────────────────────────────────────────────────

let mockAgents = [...adminAgents.data]

export const adminAgentsHandlers = [
  http.get(`${API}/api/admin/agents`, () => HttpResponse.json({ data: mockAgents, total: mockAgents.length })),

  http.post(`${API}/api/admin/agents/:id/approve`, ({ params }) => {
    mockAgents = mockAgents.map(a => a.id === params.id ? { ...a, status: 'approved' } : a)
    return HttpResponse.json({ ok: true })
  }),
  http.post(`${API}/api/admin/agents/:id/activate`, ({ params }) => {
    mockAgents = mockAgents.map(a => a.id === params.id ? { ...a, status: 'active' } : a)
    return HttpResponse.json({ ok: true })
  }),
  http.post(`${API}/api/admin/agents/:id/suspend`, ({ params }) => {
    mockAgents = mockAgents.map(a => a.id === params.id ? { ...a, status: 'suspended' } : a)
    return HttpResponse.json({ ok: true })
  }),
]

// ── Admin — Commissions ───────────────────────────────────────────────────────

let mockCommissions = [...adminCommissions.data]

export const adminCommissionsHandlers = [
  http.get(`${API}/api/admin/commissions`, () =>
    HttpResponse.json({ data: mockCommissions, total: mockCommissions.length })
  ),
  http.get(`${API}/api/admin/commissions/summary`, () =>
    HttpResponse.json(adminCommissionsSummary)
  ),
  http.post(`${API}/api/admin/commissions/:id/approve`, ({ params }) => {
    mockCommissions = mockCommissions.map(c => c.id === params.id ? { ...c, status: 'approved' } : c)
    return HttpResponse.json({ ok: true })
  }),
  http.post(`${API}/api/admin/commissions/:id/reject`, ({ params }) => {
    mockCommissions = mockCommissions.map(c => c.id === params.id ? { ...c, status: 'rejected' } : c)
    return HttpResponse.json({ ok: true })
  }),
]

// ── Riders ────────────────────────────────────────────────────────────────────

export const ridersHandlers = [
  http.get(`${API}/api/riders`, () => HttpResponse.json(riders)),
]

// ── All handlers ─────────────────────────────────────────────────────────────

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...statsHandlers,
  ...ordersHandlers,
  ...adminRestaurantsHandlers,
  ...adminAgentsHandlers,
  ...adminCommissionsHandlers,
  ...ridersHandlers,
]
