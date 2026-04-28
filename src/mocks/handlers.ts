import { http, HttpResponse } from 'msw'

const API = 'https://api.runbits.dev'

// Fixtures inline (importados dinámicamente para evitar problemas con Next.js)
const userRestaurant = {
  id: 'usr-restaurant-001',
  email: 'owner@laburguesa.com',
  name: 'Carlos Pérez',
  role: 'restaurant_owner',
  restaurant_id: 'rest-001',
  store_name: 'La Burguesa',
  phone: '+54 9 11 1234-5678',
}

const userSuperadmin = {
  id: 'usr-superadmin-001',
  email: 'admin@runbits.dev',
  name: 'Admin Runbits',
  role: 'superadmin',
  restaurant_id: null,
  store_name: null,
  phone: null,
}

const initialMenuItems = [
  { id: 'item-001', restaurant_id: 'rest-001', name: 'Hamburguesa Clásica', description: 'Carne, lechuga, tomate, cheddar', price: 150000, category: 'Principales', is_available: true, available: 1, sort_order: 1, created_at: 1700000000000 },
  { id: 'item-002', restaurant_id: 'rest-001', name: 'Papas Fritas', description: 'Porción grande', price: 80000, category: 'Acompañamientos', is_available: true, available: 1, sort_order: 2, created_at: 1700000001000 },
  { id: 'item-003', restaurant_id: 'rest-001', name: 'Coca Cola', description: '500ml', price: 50000, category: 'Bebidas', is_available: false, available: 0, sort_order: 3, created_at: 1700000002000 },
]

const orders = [
  { id: 'order-001', restaurant_id: 'rest-001', user_id: 'usr-customer-001', status: 'DELIVERED', subtotal: 230000, delivery_fee: 30000, total: 260000, created_at: 1700000100000, updated_at: 1700000200000 },
  { id: 'order-002', restaurant_id: 'rest-001', user_id: 'usr-customer-002', status: 'PREPARING', subtotal: 150000, delivery_fee: 30000, total: 180000, created_at: 1700000300000, updated_at: 1700000350000 },
  { id: 'order-003', restaurant_id: 'rest-001', user_id: 'usr-customer-003', status: 'CANCELLED', subtotal: 80000, delivery_fee: 30000, total: 110000, created_at: 1700000400000, updated_at: 1700000450000 },
]

const statsRestaurant = {
  restaurant_id: 'rest-001',
  restaurant_name: 'La Burguesa',
  is_open: true,
  onboarding_status: 'live',
  menu: { total_items: 3, available_items: 2 },
  orders: { today: 12, this_week: 58, this_month: 210, revenue_today: 312000000, revenue_month: 5460000000, avg_ticket_today: 26000000 },
}

const adminRestaurants = {
  data: [
    { id: 'rest-001', name: 'La Burguesa', slug: 'la-burguesa', is_open: true, onboarding_status: 'live', subscription_plan: 'pro', zone_id: 'zone-001' },
    { id: 'rest-002', name: 'Sushi Zen', slug: 'sushi-zen', is_open: false, onboarding_status: 'menu_added', subscription_plan: 'free', zone_id: 'zone-001' },
  ],
  total: 2,
}

const initialAgents = [
  { id: 'agent-001', name: 'Martín López', email: 'martin@runbits.dev', status: 'active', tier: 'gold', score: 92 },
  { id: 'agent-002', name: 'Laura García', email: 'laura@runbits.dev', status: 'pending', tier: 'bronze', score: 0 },
]

const initialCommissions = [
  { id: 'comm-001', agent_id: 'agent-001', agent_name: 'Martín López', amount: 5000000, status: 'pending', created_at: 1700000000000 },
  { id: 'comm-002', agent_id: 'agent-001', agent_name: 'Martín López', amount: 3500000, status: 'approved', created_at: 1699900000000 },
]

const commissionsSummary = { total_amount: 8500000, pending_amount: 5000000, paid_amount: 3500000 }

const riders = [
  { id: 'rider-001', name: 'Diego Fernández', email: 'diego@runbits.dev', status: 'active', tier: 'silver', score: 78 },
]

// Mutable state (reset on each worker.start() call via page reload)
let mockMenu = [...initialMenuItems]
let mockAgents = [...initialAgents]
let mockCommissions = [...initialCommissions]

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────────────────────
  http.post(`${API}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'owner@laburguesa.com' && body.password === 'password123')
      return HttpResponse.json({ token: 'mock-token-restaurant', user: userRestaurant })
    if (body.email === 'admin@runbits.dev' && body.password === 'password123')
      return HttpResponse.json({ token: 'mock-token-superadmin', user: userSuperadmin })
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

  // ── Menu ────────────────────────────────────────────────────────────────────
  http.get(`${API}/api/restaurants/:restaurantId/menu`, () => HttpResponse.json(mockMenu)),

  http.post(`${API}/api/restaurants/:restaurantId/menu`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const isAvail = body.isAvailable !== false
    const newItem = {
      id: `item-${Date.now()}`,
      restaurant_id: 'rest-001',
      name: body.name as string,
      description: (body.description as string) ?? '',
      price: body.price as number,
      category: (body.category as string) ?? '',
      is_available: isAvail,
      available: isAvail ? 1 : 0,
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
      ...(body.isAvailable !== undefined && { is_available: body.isAvailable as boolean, available: (body.isAvailable as boolean) ? 1 : 0 }),
    }
    mockMenu = mockMenu.map(i => i.id === params.itemId ? updated : i)
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/api/restaurants/:restaurantId/menu/:itemId`, ({ params }) => {
    mockMenu = mockMenu.filter(i => i.id !== params.itemId)
    return HttpResponse.json({ ok: true })
  }),

  // ── Stats ───────────────────────────────────────────────────────────────────
  http.get(`${API}/api/restaurants/:restaurantId/stats`, () => HttpResponse.json(statsRestaurant)),

  // ── Orders ──────────────────────────────────────────────────────────────────
  http.get(`${API}/api/orders/mine`, () => HttpResponse.json(orders)),
  http.get(`${API}/api/orders`, () => HttpResponse.json(orders)),

  // ── Admin — Restaurants ─────────────────────────────────────────────────────
  http.get(`${API}/api/admin/restaurants`, () => HttpResponse.json(adminRestaurants)),
  http.patch(`${API}/api/admin/restaurants/:id/onboarding`, async ({ params, request }) => {
    const body = await request.json() as { onboarding_status: string }
    return HttpResponse.json({ id: params.id, onboarding_status: body.onboarding_status })
  }),

  // ── Admin — Agents ──────────────────────────────────────────────────────────
  http.get(`${API}/api/admin/agents`, () =>
    HttpResponse.json({ data: mockAgents, total: mockAgents.length })
  ),
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

  // ── Admin — Commissions ─────────────────────────────────────────────────────
  http.get(`${API}/api/admin/commissions`, () =>
    HttpResponse.json({ data: mockCommissions, total: mockCommissions.length })
  ),
  http.get(`${API}/api/admin/commissions/summary`, () => HttpResponse.json(commissionsSummary)),
  http.post(`${API}/api/admin/commissions/:id/approve`, ({ params }) => {
    mockCommissions = mockCommissions.map(c => c.id === params.id ? { ...c, status: 'approved' } : c)
    return HttpResponse.json({ ok: true })
  }),
  http.post(`${API}/api/admin/commissions/:id/reject`, ({ params }) => {
    mockCommissions = mockCommissions.map(c => c.id === params.id ? { ...c, status: 'rejected' } : c)
    return HttpResponse.json({ ok: true })
  }),

  // ── Riders ──────────────────────────────────────────────────────────────────
  http.get(`${API}/api/riders`, () => HttpResponse.json(riders)),
]
