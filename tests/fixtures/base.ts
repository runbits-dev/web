/**
 * Playwright fixtures con page.route() para interceptar la API sin Service Worker.
 * IMPORTANTE: Playwright usa el ÚLTIMO handler registrado que matchea.
 * Por eso registramos primero los wildcards y al final los más específicos.
 */
import { test as base, Page } from '@playwright/test'

const API = 'https://api.runbits.dev'

// ── Fixtures de datos ──────────────────────────────────────────────────────

const userRestaurant = {
  id: 'usr-restaurant-001',
  email: 'owner@laburguesa.com',
  name: 'Carlos Pérez',
  phone: '+54 9 11 1234-5678',
  status: 'active',
}

const restaurantProfile = {
  id: 'profile-001',
  account_id: 'usr-restaurant-001',
  store_id: 'rest-001',
  business_type: 'food',
  business_category: 'hamburgueseria',
  operation_type: 'business',
  display_name: 'La Burguesa',
  is_default: true,
  tutorial_completed: true,
  tutorial_step: 8,
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

export const menuItems = [
  { id: 'item-001', restaurant_id: 'rest-001', name: 'Hamburguesa Clásica', description: 'Carne, lechuga, tomate, cheddar', price: 150000, category: 'Principales', is_available: true, available: 1, sort_order: 1, created_at: 1700000000000 },
  { id: 'item-002', restaurant_id: 'rest-001', name: 'Papas Fritas', description: 'Porción grande', price: 80000, category: 'Acompañamientos', is_available: true, available: 1, sort_order: 2, created_at: 1700000001000 },
  { id: 'item-003', restaurant_id: 'rest-001', name: 'Coca Cola', description: '500ml', price: 50000, category: 'Bebidas', is_available: false, available: 0, sort_order: 3, created_at: 1700000002000 },
]

export const myOrders = [
  { id: 'order-001', restaurant_id: 'rest-001', user_id: 'usr-customer-001', status: 'DELIVERED', subtotal: 230000, delivery_fee: 30000, total: 260000, created_at: 1700000100000, updated_at: 1700000200000 },
  { id: 'order-002', restaurant_id: 'rest-001', user_id: 'usr-customer-002', status: 'PREPARING', subtotal: 150000, delivery_fee: 30000, total: 180000, created_at: 1700000300000, updated_at: 1700000350000 },
  { id: 'order-003', restaurant_id: 'rest-001', user_id: 'usr-customer-003', status: 'CANCELLED', subtotal: 80000, delivery_fee: 30000, total: 110000, created_at: 1700000400000, updated_at: 1700000450000 },
]

export const statsRestaurant = {
  restaurant_id: 'rest-001',
  restaurant_name: 'La Burguesa',
  is_open: true,
  onboarding_status: 'live',
  menu: { total_items: 3, available_items: 2 },
  orders: { today: 12, this_week: 58, this_month: 210, revenue_today: 312000000, revenue_month: 5460000000, avg_ticket_today: 26000000 },
}

export const adminRestaurants = {
  data: [
    { id: 'rest-001', name: 'La Burguesa', slug: 'la-burguesa', is_open: true, onboarding_status: 'live', subscription_plan: 'growth', zone_id: 'zone-001' },
    { id: 'rest-002', name: 'Sushi Zen', slug: 'sushi-zen', is_open: false, onboarding_status: 'menu_added', subscription_plan: 'starter', zone_id: 'zone-001' },
  ],
  total: 2,
}

export const agents = [
  { id: 'agent-001', name: 'Martín López', email: 'martin@runbits.dev', status: 'active', tier: 'gold', score: 92 },
  { id: 'agent-002', name: 'Laura García', email: 'laura@runbits.dev', status: 'pending', tier: 'bronze', score: 0 },
]

export const commissions = [
  { id: 'comm-001', agent_id: 'agent-001', agent_name: 'Martín López', amount: 50000, status: 'pending', period: '2024-01', created_at: 1700000000000 },
  { id: 'comm-002', agent_id: 'agent-001', agent_name: 'Martín López', amount: 35000, status: 'paid', period: '2023-12', created_at: 1699000000000 },
]

export const commissionsSummary = {
  total_amount: 85000,
  pending_amount: 50000,
  paid_amount: 35000,
}

// ── Setup de routes ────────────────────────────────────────────────────────
// ORDEN IMPORTANTE: Playwright usa el ÚLTIMO handler que matchea.
// Registrar primero los wildcards, luego los específicos.

export async function setupApiRoutes(page: Page) {
  // ── Wildcards primero ──────────────────────────────────────────────────

  // Menu wildcard (para PATCH y DELETE de items específicos)
  let currentMenu = [...menuItems]
  await page.route(`${API}/api/restaurants/rest-001/menu/**`, async (route) => {
    const method = route.request().method()
    const url = route.request().url()
    const itemId = url.split('/menu/')[1]?.split('?')[0]

    if (method === 'DELETE') {
      currentMenu = currentMenu.filter(i => i.id !== itemId)
      await route.fulfill({ status: 204, body: '' })
    } else if (method === 'PATCH') {
      const body = await route.request().postDataJSON()
      const idx = currentMenu.findIndex(i => i.id === itemId)
      if (idx >= 0) {
        currentMenu[idx] = {
          ...currentMenu[idx],
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.price !== undefined ? { price: body.price } : {}),
          ...(body.category !== undefined ? { category: body.category } : {}),
          ...(body.isAvailable !== undefined ? { is_available: body.isAvailable, available: body.isAvailable ? 1 : 0 } : {}),
          ...(body.is_available !== undefined ? { is_available: body.is_available, available: body.is_available ? 1 : 0 } : {}),
        }
        await route.fulfill({ json: currentMenu[idx] })
      } else {
        await route.fulfill({ status: 404, json: { error: 'Not found' } })
      }
    } else {
      await route.fulfill({ status: 405, json: { error: 'Method not allowed' } })
    }
  })

  // Admin agents wildcard (para acciones)
  let currentAgents = [...agents]
  await page.route(`${API}/api/admin/agents/**`, async (route) => {
    const method = route.request().method()
    const url = route.request().url()
    const parts = url.split('/')
    const action = parts[parts.length - 1]
    const agentId = parts[parts.length - 2]

    if (method === 'POST') {
      const idx = currentAgents.findIndex(a => a.id === agentId)
      if (idx >= 0) {
        const newStatus = action === 'suspend' ? 'suspended' : 'active'
        currentAgents[idx] = { ...currentAgents[idx], status: newStatus }
        await route.fulfill({ json: currentAgents[idx] })
      } else {
        await route.fulfill({ status: 404, json: { error: 'Not found' } })
      }
    } else {
      await route.fulfill({ status: 405, json: { error: 'Method not allowed' } })
    }
  })

  // Admin commissions wildcard (para acciones)
  let currentCommissions = [...commissions]
  await page.route(`${API}/api/admin/commissions/**`, async (route) => {
    const method = route.request().method()
    const url = route.request().url()
    const parts = url.split('/')
    const action = parts[parts.length - 1]
    const commId = parts[parts.length - 2]

    if (method === 'POST') {
      const idx = currentCommissions.findIndex(c => c.id === commId)
      if (idx >= 0) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        currentCommissions[idx] = { ...currentCommissions[idx], status: newStatus }
        await route.fulfill({ json: currentCommissions[idx] })
      } else {
        await route.fulfill({ status: 404, json: { error: 'Not found' } })
      }
    } else {
      await route.fulfill({ status: 405, json: { error: 'Method not allowed' } })
    }
  })

  // Admin restaurants wildcard
  await page.route(`${API}/api/admin/restaurants/**`, async (route) => {
    await route.fulfill({ json: adminRestaurants })
  })

  // ── Rutas específicas al final (mayor prioridad) ───────────────────────

  // Auth — login
  await page.route(`${API}/api/auth/login`, async (route) => {
    const body = await route.request().postDataJSON()
    if (body.email === 'owner@laburguesa.com' && body.password === 'password123') {
      await route.fulfill({ json: {
        token: 'mock-token-restaurant',
        refreshToken: 'mock-refresh-token',
        account: userRestaurant,
        roles: [{ role: 'restaurant_owner', entityId: 'rest-001', isPrimary: true }],
        profiles: [restaurantProfile],
        activeProfile: restaurantProfile,
      }})
    } else if (body.email === 'admin@runbits.dev' && body.password === 'password123') {
      await route.fulfill({ json: { token: 'mock-token-superadmin', user: userSuperadmin } })
    } else {
      await route.fulfill({ status: 401, json: { error: 'Credenciales inválidas' } })
    }
  })

  // Auth — me
  await page.route(`${API}/api/auth/me`, async (route) => {
    const auth = route.request().headers()['authorization'] || ''
    const token = auth.replace('Bearer ', '')
    if (token === 'mock-token-restaurant') {
      await route.fulfill({ json: {
        account: { ...userRestaurant },
        roles: [{ role: 'restaurant_owner', entityId: 'rest-001', isPrimary: true }],
        activeRole: 'restaurant_owner',
        entityId: 'rest-001',
        profileId: 'profile-001',
        storeId: 'rest-001',
        profiles: [restaurantProfile],
        activeProfile: restaurantProfile,
      }})
    } else if (token === 'mock-token-superadmin') {
      await route.fulfill({ json: userSuperadmin })
    } else {
      await route.fulfill({ status: 401, json: { error: 'No autorizado' } })
    }
  })

  // Profiles
  await page.route(`${API}/api/profiles`, async (route) => {
    await route.fulfill({ json: [restaurantProfile] })
  })

  // Connect status
  await page.route(`${API}/api/connect/status/**`, async (route) => {
    await route.fulfill({ json: { connected: false, chargesEnabled: false, payoutsEnabled: false } })
  })

  // Subscription limits
  await page.route(`${API}/api/subscriptions/rest-001/limits`, async (route) => {
    await route.fulfill({ json: { plan: 'growth', limits: {}, active: true } })
  })

  // Subscription modules
  await page.route(`${API}/api/subscriptions/rest-001/modules`, async (route) => {
    await route.fulfill({ json: [] })
  })

  // Auth — profile update
  await page.route(`${API}/api/auth/profile`, async (route) => {
    const body = await route.request().postDataJSON()
    await route.fulfill({ json: { ...userRestaurant, ...body } })
  })

  // Menu — GET y POST
  await page.route(`${API}/api/restaurants/rest-001/menu`, async (route) => {
    const method = route.request().method()
    if (method === 'POST') {
      const body = await route.request().postDataJSON()
      const avail = body.is_available !== false
      const newItem = {
        id: `item-${Date.now()}`,
        restaurant_id: 'rest-001',
        name: body.name,
        description: body.description || '',
        price: body.price || 0,
        category: body.category || '',
        is_available: avail,
        available: avail ? 1 : 0,
        sort_order: currentMenu.length + 1,
        created_at: Date.now(),
      }
      currentMenu = [...currentMenu, newItem]
      await route.fulfill({ json: newItem })
    } else {
      await route.fulfill({ json: currentMenu })
    }
  })

  // Menu con query params (available=false)
  await page.route(`${API}/api/restaurants/rest-001/menu?**`, async (route) => {
    await route.fulfill({ json: currentMenu })
  })

  // Orders
  await page.route(`${API}/api/orders/mine`, async (route) => {
    await route.fulfill({ json: myOrders })
  })

  // Restaurant detail (GET /api/restaurants/:id)
  await page.route(`${API}/api/restaurants/rest-001`, async (route) => {
    const method = route.request().method()
    if (method === 'PATCH') {
      const body = await route.request().postDataJSON()
      await route.fulfill({ json: { id: 'rest-001', ...body } })
    } else {
      await route.fulfill({ json: {
        id: 'rest-001',
        name: 'La Burguesa',
        slug: 'la-burguesa',
        address: 'Av. Corrientes 1234, CABA',
        phone: '+54 11 4444-5555',
        description: 'Las mejores hamburguesas de la ciudad',
        is_open: true,
        opening_hours: {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '23:00', closed: false },
          saturday: { open: '10:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '20:00', closed: false },
        },
      }})
    }
  })

  // Stats
  await page.route(`${API}/api/restaurants/rest-001/stats`, async (route) => {
    await route.fulfill({ json: statsRestaurant })
  })

  // Admin — Restaurants list
  await page.route(`${API}/api/admin/restaurants`, async (route) => {
    await route.fulfill({ json: adminRestaurants })
  })

  // Admin — Agents list
  await page.route(`${API}/api/admin/agents`, async (route) => {
    await route.fulfill({ json: { data: currentAgents, total: currentAgents.length } })
  })

  // Admin — Commissions summary (más específico que /commissions)
  await page.route(`${API}/api/admin/commissions/summary`, async (route) => {
    await route.fulfill({ json: commissionsSummary })
  })

  // Admin — Commissions list
  await page.route(`${API}/api/admin/commissions`, async (route) => {
    await route.fulfill({ json: { data: currentCommissions, total: currentCommissions.length } })
  })
}

// ── Helpers de auth ────────────────────────────────────────────────────────

export async function loginAsRestaurantOwner(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-token-restaurant')
    localStorage.setItem('user', JSON.stringify({
      id: 'usr-restaurant-001',
      email: 'owner@laburguesa.com',
      name: 'Carlos Pérez',
      phone: '+54 9 11 1234-5678',
      status: 'active',
    }))
  })
}

export async function loginAsSuperadmin(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-token-superadmin')
    localStorage.setItem('user', JSON.stringify({
      id: 'usr-superadmin-001',
      email: 'admin@runbits.dev',
      name: 'Admin Runbits',
      role: 'superadmin',
      restaurant_id: null,
      store_name: null,
      phone: null,
    }))
  })
}

// ── Custom test fixture ────────────────────────────────────────────────────

type Fixtures = {
  apiMock: void
}

export const test = base.extend<Fixtures>({
  apiMock: [async ({ page }, use) => {
    await setupApiRoutes(page)
    await use()
  }, { auto: true }],
})

export { expect } from '@playwright/test'
