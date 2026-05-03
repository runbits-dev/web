export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

export type Profile = {
  id: string
  account_id: string
  store_id: string | null
  business_type: string
  business_category: string | null
  operation_type: string
  display_name: string
  is_default: boolean
  tutorial_completed: boolean
  tutorial_step: number
}

export type User = {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'restaurant_owner' | 'rider' | 'customer'
  restaurant_id?: string
  store_name?: string
  phone?: string
  picture?: string
  profiles?: Profile[]
  activeProfile?: Profile
  totp_enabled?: boolean
  last_login_at?: string | null
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
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
    if (refreshToken && !path.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          localStorage.setItem('token', data.token)
          localStorage.setItem('refreshToken', data.refreshToken)
          // Retry original request with new token
          const retryHeaders = { ...headers }
          retryHeaders['Authorization'] = `Bearer ${data.token}`
          const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders })
          return retryRes.json()
        }
      } catch {}
    }
    // If refresh failed or no refresh token, redirect to login
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
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
function normalizeAuthResponse(raw: any): { token: string; refreshToken?: string; user: User } {
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
    profiles: raw.profiles ?? [],
    activeProfile: raw.activeProfile ?? null,
  }
  return { token: raw.token, refreshToken: raw.refreshToken, user }
}

export const api = {
  login: async (email: string, password: string): Promise<{ token: string; refreshToken?: string; user: User }> => {
    const raw = await request<any>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    })
    const result = normalizeAuthResponse(raw)
    if (result.refreshToken && typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', result.refreshToken)
    }
    return result
  },

  loginGoogle: async (idToken: string): Promise<{ token: string; refreshToken?: string; user: User }> => {
    const raw = await request<any>('/api/auth/google', {
      method: 'POST', body: JSON.stringify({ id_token: idToken }),
    })
    const result = normalizeAuthResponse(raw)
    if (result.refreshToken && typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', result.refreshToken)
    }
    return result
  },

  register: async (data: { email: string; phone: string; name: string; password: string; role?: string }): Promise<{ token: string; refreshToken?: string; user: User }> => {
    const raw = await request<any>('/api/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    })
    const result = normalizeAuthResponse(raw)
    if (result.refreshToken && typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', result.refreshToken)
    }
    return result
  },

  me: async (): Promise<User> => {
    const raw = await request<any>('/api/auth/me')
    const account = raw.account ?? raw
    const activeRole = raw.activeRole ?? 'customer'
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone,
      role: activeRole as User['role'],
      restaurant_id: account.restaurant_id ?? raw.entityId ?? raw.storeId,
      store_name: account.store_name,
      profiles: raw.profiles ?? [],
      activeProfile: raw.activeProfile ?? null,
      totp_enabled: !!(account.totp_enabled ?? raw.totp_enabled),
    }
  },

  updateAccount: (data: { name?: string; phone?: string }) =>
    request<User>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

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
  createMenuItem: (restaurantId: string, data: { name: string; description?: string; price: number; category?: string; is_available?: boolean; image_key?: string }) =>
    request<any>(`/api/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name, description: data.description,
        price: data.price, category: data.category, isAvailable: data.is_available,
        ...(data.image_key !== undefined && { image_key: data.image_key }),
      }),
    }),
  updateMenuItem: (restaurantId: string, itemId: string, data: { name?: string; description?: string; price?: number; category?: string; is_available?: boolean; image_key?: string }) =>
    request<any>(`/api/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.is_available !== undefined && { isAvailable: data.is_available }),
        ...(data.image_key !== undefined && { image_key: data.image_key }),
      }),
    }),
  deleteMenuItem: (restaurantId: string, itemId: string) =>
    request<void>(`/api/restaurants/${restaurantId}/menu/${itemId}`, { method: 'DELETE' }),

  // Coupons & Promotions (social-service via gateway)
  getCoupons: (restaurantId?: string) => request<any[]>(`/api/coupons${restaurantId ? `?restaurantId=${restaurantId}` : ''}`),
  createCoupon: (data: { code: string; discountType: 'percentage' | 'fixed'; discountValue: number; minOrder?: number; maxUses?: number; expiresAt?: string; restaurantId: string }) =>
    request<any>('/api/coupons', { method: 'POST', body: JSON.stringify({
      restaurantId: data.restaurantId, code: data.code, discountType: data.discountType,
      discountValue: data.discountValue, minOrderAmount: data.minOrder || 0,
      usageLimit: data.maxUses || undefined,
    }) }),
  deleteCoupon: (id: string) => request<void>(`/api/coupons/${id}`, { method: 'DELETE' }),
  validateCoupon: (code: string, restaurantId: string) =>
    request<any>('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, restaurantId }) }),

  getActivePromotions: (restaurantId?: string) => request<any[]>(`/api/promotions/active${restaurantId ? `?restaurantId=${restaurantId}` : ''}`),
  getAllPromotions: (restaurantId: string) => request<any[]>(`/api/promotions?restaurantId=${restaurantId}`),
  createPromotion: (data: { title: string; description: string; discountType: 'percentage' | 'fixed'; discountValue: number; startsAt: string; endsAt: string; restaurantId: string }) =>
    request<any>('/api/promotions', { method: 'POST', body: JSON.stringify({
      restaurantId: data.restaurantId,
      name: data.title,
      type: 'happy_hour',
      config: { discountType: data.discountType, discountValue: data.discountValue, description: data.description },
      startsAt: new Date(data.startsAt).getTime(),
      endsAt: new Date(data.endsAt).getTime(),
    }) }),
  deletePromotion: (id: string) => request<void>(`/api/promotions/${id}`, { method: 'DELETE' }),

  // Favorites (social-service via gateway)
  getFavorites: () => request<any[]>('/api/favorites'),
  addFavorite: (restaurantId: string) => request<any>(`/api/favorites/${restaurantId}`, { method: 'POST' }),
  removeFavorite: (restaurantId: string) => request<void>(`/api/favorites/${restaurantId}`, { method: 'DELETE' }),

  // Chat (social-service via gateway)
  getChatMessages: (orderId: string) => request<any[]>(`/api/chat/orders/${orderId}/messages`),
  sendChatMessage: (orderId: string, message: string) =>
    request<any>(`/api/chat/orders/${orderId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  markChatRead: (orderId: string) =>
    request<void>(`/api/chat/orders/${orderId}/messages/read`, { method: 'PATCH' }),
  getUnreadCount: () => request<{ count: number }>('/api/chat/unread-count'),

  // Ratings (order-service via gateway)
  rateOrder: (orderId: string, rating: number, comment?: string) =>
    request<any>(`/api/orders/${orderId}/rate`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  getRestaurantRatings: (restaurantId: string) =>
    request<any[]>(`/api/orders/restaurants/${restaurantId}/ratings`),

  getRiders: (zoneId?: string) =>
    request<any[]>(`/api/riders${zoneId ? `?zoneId=${zoneId}` : ''}`),

  getOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/orders${qs}`)
  },
  getOrder: (id: string) => request<any>(`/api/orders/${id}`),

  getAdminUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; total: number }>(`/api/admin/users${qs}`)
  },

  getAdminOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; total: number }>(`/api/admin/orders${qs}`)
  },

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

  // Modules
  getModules: (restaurantId: string) =>
    request<any[]>(`/api/subscriptions/${restaurantId}/modules`),
  activateModule: (restaurantId: string, moduleId: string) =>
    request<any>(`/api/subscriptions/${restaurantId}/modules`, {
      method: 'POST', body: JSON.stringify({ moduleId }),
    }),
  deactivateModule: (restaurantId: string, moduleId: string) =>
    request<void>(`/api/subscriptions/${restaurantId}/modules/${moduleId}`, { method: 'DELETE' }),

  // Subscription limits
  getSubscriptionLimits: (restaurantId: string) =>
    request<any>(`/api/subscriptions/${restaurantId}/limits`),

  // Consolidated billing across all profiles
  getConsolidatedBilling: (accountId: string, storeIds: string[]) =>
    request<any>(`/api/subscriptions/account/${accountId}/consolidated`, {
      headers: { 'X-Profile-Ids': storeIds.join(',') },
    }),

  // Profiles
  getProfiles: () => request<Profile[]>('/api/profiles'),
  createProfile: (data: { businessType: string; businessCategory?: string; operationType: string; displayName: string }) =>
    request<Profile>('/api/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id: string, data: Partial<{ businessType: string; businessCategory: string; operationType: string; displayName: string; isDefault: boolean; tutorialCompleted: boolean; tutorialStep: number }>) =>
    request<Profile>('/api/profiles/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProfile: (id: string) =>
    request<void>('/api/profiles/' + id, { method: 'DELETE' }),
  switchProfile: (profileId: string) =>
    request<{ token: string; activeProfile: Profile }>('/api/auth/switch-profile', { method: 'POST', body: JSON.stringify({ profileId }) }),

  // Stripe Connect
  startConnectOnboarding: (storeId: string, storeName: string, email: string) =>
    request<{ url: string; accountId: string }>('/api/connect/onboard', {
      method: 'POST', body: JSON.stringify({ storeId, storeName, email }),
    }),
  getConnectStatus: (storeId: string) =>
    request<{ connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; accountId?: string }>(`/api/connect/status/${storeId}`),
  createPaymentIntent: (storeId: string, orderId: string, amount: number) =>
    request<{ clientSecret: string; paymentIntentId: string }>('/api/connect/payment-intent', {
      method: 'POST', body: JSON.stringify({ storeId, orderId, amount, currency: 'usd' }),
    }),

  // Feature Flags
  getFeatureFlags: () => request<{ flags: Record<string, boolean> }>('/api/config/flags'),
  setFeatureFlag: (flag: string, value: boolean) =>
    request<{ ok: boolean }>('/api/admin/flags', {
      method: 'POST', body: JSON.stringify({ flag, value }),
    }),

  // Support chat (uses request() for auto token refresh)
  supportChat: (message: string, history: Array<{ role: string; content: string }>) =>
    request<{ reply: string }>('/api/support/chat', {
      method: 'POST', body: JSON.stringify({ message, history }),
    }),
}
