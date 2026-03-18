const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

export type User = {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'restaurant_owner' | 'rider' | 'customer'
  restaurant_id?: string
  store_name?: string
  phone?: string
  picture?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      window.location.href = '/login'
      throw new Error('No autorizado')
    }
    const errBody = await res.json().catch(() => ({ error: 'No autorizado' }))
    throw new Error(errBody.error || 'No autorizado')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// Normaliza la respuesta de auth-service { account, roles, activeRole } → User
function normalizeAuthResponse(raw: any): { token: string; user: User } {
  const account = raw.account ?? raw.user ?? raw
  const roles: Array<{ role: string }> = raw.roles ?? []
  const activeRole = raw.activeRole ?? roles[0]?.role ?? 'customer'

  const user: User = {
    id: account.id,
    email: account.email,
    name: account.name,
    phone: account.phone,
    picture: account.picture,
    role: activeRole as User['role'],
  }
  return { token: raw.token, user }
}

export const api = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const raw = await request<any>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    })
    return normalizeAuthResponse(raw)
  },

  loginGoogle: async (idToken: string): Promise<{ token: string; user: User }> => {
    const raw = await request<any>('/api/auth/google', {
      method: 'POST', body: JSON.stringify({ id_token: idToken }),
    })
    return normalizeAuthResponse(raw)
  },

  register: async (data: { email: string; phone: string; name: string; password: string; role?: string }): Promise<{ token: string; user: User }> => {
    const raw = await request<any>('/api/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    })
    return normalizeAuthResponse(raw)
  },

  me: async (): Promise<User> => {
    const raw = await request<any>('/api/auth/me')
    // auth-service devuelve { account: {...}, roles: [...], activeRole }
    const account = raw.account ?? raw
    const activeRole = raw.activeRole ?? 'customer'
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone,
      role: activeRole as User['role'],
    }
  },

  updateProfile: (data: { name?: string; phone?: string }) =>
    request<User>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  getMyOrders: () => request<any[]>('/api/orders/mine'),

  getZones: () => request<any[]>('/api/zones'),
  createZone: (name: string) =>
    request<any>('/api/zones', { method: 'POST', body: JSON.stringify({ name }) }),

  getRestaurants: (zoneId?: string) =>
    request<any[]>(`/api/restaurants${zoneId ? `?zoneId=${zoneId}` : ''}`),
  getRestaurant: (id: string) => request<any>(`/api/restaurants/${id}`),
  updateRestaurant: (id: string, data: any) =>
    request<any>(`/api/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getRestaurantStats: (id: string) => request<any>(`/api/restaurants/${id}/stats`),

  getMenu: (restaurantId: string) =>
    request<any[]>(`/api/restaurants/${restaurantId}/menu?available=false`),
  createMenuItem: (restaurantId: string, data: { name: string; description?: string; price: number; category?: string; is_available?: boolean }) =>
    request<any>(`/api/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name, description: data.description,
        price: data.price, category: data.category, isAvailable: data.is_available,
      }),
    }),
  updateMenuItem: (restaurantId: string, itemId: string, data: { name?: string; description?: string; price?: number; category?: string; is_available?: boolean }) =>
    request<any>(`/api/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.is_available !== undefined && { isAvailable: data.is_available }),
      }),
    }),
  deleteMenuItem: (restaurantId: string, itemId: string) =>
    request<void>(`/api/restaurants/${restaurantId}/menu/${itemId}`, { method: 'DELETE' }),

  getRiders: (zoneId?: string) =>
    request<any[]>(`/api/riders${zoneId ? `?zoneId=${zoneId}` : ''}`),

  getOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/orders${qs}`)
  },
  getOrder: (id: string) => request<any>(`/api/orders/${id}`),

  getAdminRestaurants: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; total: number }>(`/api/admin/restaurants${qs}`)
  },
  getAdminRestaurant: (id: string) => request<any>(`/api/admin/restaurants/${id}`),
  updateRestaurantOnboarding: (id: string, onboarding_status: string) =>
    request<any>(`/api/admin/restaurants/${id}/onboarding`, {
      method: 'PATCH', body: JSON.stringify({ onboarding_status }),
    }),

  getAgents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; total: number }>(`/api/admin/agents${qs}`)
  },
  getAgent: (id: string) => request<any>(`/api/admin/agents/${id}`),
  updateAgent: (id: string, data: any) =>
    request<any>(`/api/admin/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  approveAgent: (id: string) =>
    request<any>(`/api/admin/agents/${id}/approve`, { method: 'POST' }),
  activateAgent: (id: string) =>
    request<any>(`/api/admin/agents/${id}/activate`, { method: 'POST' }),
  suspendAgent: (id: string) =>
    request<any>(`/api/admin/agents/${id}/suspend`, { method: 'POST' }),
  promoteAgent: (id: string) =>
    request<any>(`/api/admin/agents/${id}/promote`, { method: 'POST' }),

  getCommissions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; total: number }>(`/api/admin/commissions${qs}`)
  },
  getCommissionsSummary: () => request<any>('/api/admin/commissions/summary'),
  approveCommission: (id: string) =>
    request<any>(`/api/admin/commissions/${id}/approve`, { method: 'POST' }),
  rejectCommission: (id: string) =>
    request<any>(`/api/admin/commissions/${id}/reject`, { method: 'POST' }),

  getPendingPayouts: () => request<any[]>('/api/admin/payouts/pending'),
  processPayouts: (agentId: string, commissionIds: string[]) =>
    request<any>('/api/admin/payouts/process', {
      method: 'POST', body: JSON.stringify({ agentId, commissionIds }),
    }),

  getSubscriptions: () => request<any[]>('/api/admin/subscriptions'),
}
