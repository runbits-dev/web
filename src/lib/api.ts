import type { BillingBusinessType } from './onboarding'

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

export type MonitoringConfig = {
  version: number
  status_cron: { interval_minutes: number; enabled: boolean }
  thresholds: {
    error_rate_pct: number
    error_rate_window_minutes: number
    cost_daily_usd: number
    latency_p95_ms: number
  }
  channels: {
    email: { enabled: boolean; address: string }
    whatsapp: { enabled: boolean; phone: string }
    push: { enabled: boolean }
  }
  updated_at: number
  updated_by: string
}

// Same shape as MonitoringConfig but updated_at/updated_by are stamped by the
// server, so the client doesn't need to send them.
export type MonitoringConfigInput = Omit<MonitoringConfig, 'updated_at' | 'updated_by'>

export type MonitoringService = {
  id: string
  name: string
  ok: boolean
  status: number
  latency_ms: number
}

// ── Layer 1/2/3 monitoring (alerts/findings/reports) ───────────────────────
export type MonitoringAlert = {
  id: string
  source: 'cf_notifications' | 'status_worker' | 'agent' | 'manual'
  alert_type: string
  severity: 'critical' | 'warning' | 'info'
  service: string | null
  message: string
  payload_json: string | null
  status: 'open' | 'acknowledged' | 'resolved' | 'auto_resolved'
  acknowledged_by: string | null
  acknowledged_at: number | null
  resolved_at: number | null
  resolved_by: string | null
  channels_dispatched: string | null
  agent_enrichment_json: string | null
  enriched_at: number | null
  created_at: number
}

export type MonitoringFinding = {
  id: string
  tenant_id: string
  agent_id: string
  run_id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string | null
  title: string
  description: string | null
  metadata_json: string | null
  status: 'open' | 'acknowledged' | 'closed' | 'regressed'
  created_at: number
}

export type MonitoringReport = {
  id: string
  period_start: number
  period_end: number
  type: 'weekly_slo' | 'monthly_slo'
  payload_json: string
  markdown: string | null
  created_at: number
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
      // A coded error from a FAILED retry is captured here and rethrown AFTER
      // the try/catch — the catch {} below only swallows refresh/network faults
      // (falling through to the login redirect), and must not eat a real
      // upstream error from the retried call.
      let retryError: ApiError | null = null
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
          if (retryRes.ok) return retryRes.json()
          // The retry can still fail (5xx/403/etc). Mirror the non-refresh path:
          // surface a coded ApiError instead of returning the error body as if
          // it were success data (which would silently render, e.g., a fiscal
          // profile as "not configured"/empty).
          const retryBody = await retryRes.json().catch(() => ({ error: retryRes.statusText }))
          retryError = makeApiError(retryBody.error || `HTTP ${retryRes.status}`, retryBody.code, retryRes.status)
        }
      } catch {}
      if (retryError) throw retryError
    }
    // If refresh failed or no refresh token, redirect to login
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
      throw new Error('No autorizado')
    }
    const errBody = await res.json().catch(() => ({ error: 'No autorizado' }))
    throw makeApiError(errBody.error || 'No autorizado', errBody.code, res.status)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw makeApiError(body.error || `HTTP ${res.status}`, body.code, res.status)
  }

  return res.json()
}

/**
 * Error thrown by request(). Carries the server's documented { error, code }
 * (lane error-handling rule) plus the HTTP status, so callers can render a
 * friendly message AND a stable code for a coded, retryable state — without
 * leaking raw internals (the server already returns a safe message + code).
 */
export type ApiError = Error & { code?: string; status?: number }

function makeApiError(message: string, code?: string, status?: number): ApiError {
  const err = new Error(message) as ApiError
  if (code) err.code = code
  if (status !== undefined) err.status = status
  return err
}

/**
 * Best-effort creation of the merchant's FREE-plan subscription, carrying the
 * profile's vertical (`business_type`) that billing's entitlement checks
 * (e.g. `booking_basic` for a professional) require. Both onboarding funnels
 * call this right after the profile is created + switched.
 *
 * Billing's free fast-path is idempotent — 201 (new), 200 (already exists) and
 * 409 (create race) are ALL success — so any non-5xx resolves silently. Only a
 * 5xx (or a network throw) surfaces as a coded ApiError, which the caller is
 * expected to swallow (log a warning) so a billing hiccup never blocks
 * onboarding; the merchant can still subscribe later from the plan page.
 *
 * We deliberately bypass `request()` here: it throws on 4xx (breaking the
 * idempotent 409 case) and its 401 path force-redirects to /login, which would
 * abort the onboarding navigation. This uses the same Bearer-token mechanism as
 * the rest of the authenticated calls.
 */
export async function createFreeSubscription(
  restaurantId: string,
  businessType: BillingBusinessType,
): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ restaurantId, plan: 'free', interval: 'month', businessType }),
    })
  } catch {
    // Network-level failure (offline/DNS/CORS) — surface as a coded error so the
    // contract holds (a network throw is a coded ApiError, per the docstring +
    // the mandatory error rule). The caller swallows it (best-effort).
    throw makeApiError('Network error creating free subscription', 'FREE_SUBSCRIPTION_CREATE_FAILED', 0)
  }
  if (res.status >= 500) {
    const body = await res.json().catch(() => ({}))
    throw makeApiError(
      body.error || `HTTP ${res.status}`,
      body.code || 'FREE_SUBSCRIPTION_CREATE_FAILED',
      res.status,
    )
  }
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

// ── Fiscal e-invoicing (runbits-fiscal via gateway /api/fiscal/*) ────────────
// Merchant AFIP electronic invoicing, issued on behalf of the merchant with
// their OWN cert + CUIT. All endpoints are gateway-authed and store-scoped.

export type FiscalTaxCondition = 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTO' | 'EXENTO'
export type FiscalInvoiceType = 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C'
export type FiscalEnvironment = 'testing' | 'production'
export type FiscalProfileStatus = 'coming_soon' | 'cert_loaded' | 'available' | 'disabled'

export type FiscalProfile = {
  store_id: string
  cuit: string
  tax_condition: FiscalTaxCondition
  point_of_sale: number
  default_invoice_type: FiscalInvoiceType
  razon_social: string | null
  environment: FiscalEnvironment
  status: FiscalProfileStatus
  created_at: number
  updated_at: number | null
}

// PUT input — server stamps status/timestamps, so the client never sends them.
export type FiscalProfileInput = {
  cuit: string
  tax_condition: FiscalTaxCondition
  point_of_sale: number
  default_invoice_type: FiscalInvoiceType
  razon_social?: string
  environment?: FiscalEnvironment
}

// POST /cert response — metadata only; the cert/key PEMs are NEVER returned.
export type FiscalCertResult = {
  ok: boolean
  status: 'cert_loaded'
  cert_not_after: number
  fingerprint_sha256: string
}

export type FiscalInvoice = {
  id: string
  store_id: string
  order_id: string | null
  cbte_tipo: number
  cbte_nro: number
  cbte_fch: string
  pto_vta: number
  cuit: string
  doc_tipo: number | null
  doc_nro: string | null
  imp_total: number
  imp_neto: number
  imp_iva: number
  cae: string | null
  cae_vto: string | null
  resultado: string | null
  status: string
  created_at: number
  updated_at: number | null
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
    // Resolve role with priority: activeRole > primary role in roles[] >
    // superadmin if present > first role > 'customer' default. Prevents the
    // bug where a superadmin without an explicit activeRole was mapped to
    // 'customer' and routed into the merchant onboarding wizard.
    let role = raw.activeRole
    if (!role && Array.isArray(raw.roles) && raw.roles.length > 0) {
      const rolesList = raw.roles as Array<{ role?: string; isPrimary?: boolean } | string>
      const normalize = (r: any) => (typeof r === 'string' ? { role: r, isPrimary: false } : r)
      const normalized = rolesList.map(normalize).filter(r => r.role)
      const primary = normalized.find(r => r.isPrimary)
      const superadmin = normalized.find(r => r.role === 'superadmin')
      role = primary?.role ?? superadmin?.role ?? normalized[0]?.role
    }
    if (!role) role = 'customer'
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone,
      role: role as User['role'],
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

  // Ratings — read-only per-store review summary from social-service. Writing a
  // rating goes through the verified-purchase review flow (review-eligibility
  // token -> POST /api/reviews); the legacy /api/orders/:id/rate path is retired.
  // Per-store review summary from social-service's distribution endpoint
  // (GET /api/reviews/distribution?store_id=). Returns { distribution, total,
  // average } — average is null when there are no visible reviews. We normalize
  // to a typed { avg, count } the dashboard can consume directly.
  getStoreReviewSummary: async (storeId: string): Promise<{ avg: number; count: number }> => {
    const res = await request<{ distribution: Record<string, number>; total: number; average: number | null }>(
      `/api/reviews/distribution?store_id=${encodeURIComponent(storeId)}`,
    )
    return { avg: res.average ?? 0, count: res.total ?? 0 }
  },

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

  // Admin subscriptions endpoint returns `{ data, total, limit, offset }` —
  // unwrap to an array here so existing call sites can keep treating the
  // result as `any[]`.
  getSubscriptions: async (): Promise<any[]> => {
    const res = await request<{ data: any[]; total: number } | any[]>('/api/admin/subscriptions')
    if (Array.isArray(res)) return res
    return res?.data ?? []
  },

  getAdminSubscriptions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; total: number }>(`/api/admin/subscriptions${qs}`)
  },

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

  // Monitoring & Alerts (admin) — backed by runbits-status worker, proxied
  // through the gateway under /api/monitoring/*. Admin role required.
  getMonitoringConfig: () =>
    request<{ config: MonitoringConfig }>('/api/monitoring/config'),
  updateMonitoringConfig: (config: MonitoringConfigInput) =>
    request<{ ok: boolean; config: MonitoringConfig }>('/api/monitoring/config', {
      method: 'PUT', body: JSON.stringify(config),
    }),
  getMonitoringHealthSnapshot: async () => {
    // Hit status.runbits.dev directly (no gateway). The status worker is
    // public and CORS-allows runbits.io. Going via api.runbits.dev creates
    // a request loop: gateway → status binding → checkAll() → 17x fetch back
    // to api.runbits.dev → cascading 522 timeouts. Direct call is the fix.
    const res = await fetch('https://status.runbits.dev/api/monitoring/health-snapshot', {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<{ ts: number; services: MonitoringService[] }>
  },

  // ── Monitoring agent: alerts / findings / reports ────────────────────────
  // Backed by runtics-control via /api/runtics/monitoring/*.
  getMonitoringAlerts: (params: { status?: string; service?: string; severity?: string; limit?: number; cursor?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.service) qs.set('service', params.service)
    if (params.severity) qs.set('severity', params.severity)
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.cursor) qs.set('cursor', String(params.cursor))
    return request<{ alerts: MonitoringAlert[]; next_cursor: number | null }>(`/api/runtics/monitoring/alerts${qs.toString() ? '?' + qs.toString() : ''}`)
  },
  acknowledgeMonitoringAlert: (id: string) =>
    request<{ ok: boolean }>(`/api/runtics/monitoring/alerts/${encodeURIComponent(id)}/acknowledge`, { method: 'POST' }),
  resolveMonitoringAlert: (id: string) =>
    request<{ ok: boolean }>(`/api/runtics/monitoring/alerts/${encodeURIComponent(id)}/resolve`, { method: 'POST' }),
  getMonitoringFindings: (params: { since?: number; severity?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.since) qs.set('since', String(params.since))
    if (params.severity) qs.set('severity', params.severity)
    if (params.limit) qs.set('limit', String(params.limit))
    return request<{ findings: MonitoringFinding[]; since: number }>(`/api/runtics/monitoring/findings${qs.toString() ? '?' + qs.toString() : ''}`)
  },
  getMonitoringReports: (params: { type?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.type) qs.set('type', params.type)
    if (params.limit) qs.set('limit', String(params.limit))
    return request<{ reports: MonitoringReport[] }>(`/api/runtics/monitoring/reports${qs.toString() ? '?' + qs.toString() : ''}`)
  },
  runMonitoringAgentNow: (mode: 'hourly_patterns' | 'weekly_report' = 'hourly_patterns') =>
    request<{ ok: boolean; run_id?: string }>(`/api/runtics/agents/monitoring/run`, {
      method: 'POST',
      body: JSON.stringify({ args: { mode } }),
    }),

  // Support chat (uses request() for auto token refresh)
  supportChat: (message: string, history: Array<{ role: string; content: string }>) =>
    request<{ reply: string }>('/api/support/chat', {
      method: 'POST', body: JSON.stringify({ message, history }),
    }),

  // ── Catalog v2 (multi-rubro polymorphic items) ───────────────────────────

  /** GET /api/categories — flat list or hierarchical tree (with ?tree=true). */
  getCategories: (opts: { tree?: boolean; kind?: string } = {}) => {
    const qs = new URLSearchParams()
    if (opts.tree) qs.set('tree', 'true')
    if (opts.kind) qs.set('kind', opts.kind)
    return request<{ data: any[] }>(`/api/categories${qs.toString() ? '?' + qs.toString() : ''}`)
  },

  /** GET /api/categories/:slug — category detail + items. */
  getCategory: (slug: string) =>
    request<{ category: any; items: any[]; limit: number; offset: number }>(`/api/categories/${encodeURIComponent(slug)}`),

  /** POST /api/category-requests — propose a new curated category. */
  requestCategory: (data: { storeId?: string; parentId?: string; proposedNameEs: string; proposedNameEn?: string; proposedSlug?: string; useCase?: string; exampleItems?: string[] }) =>
    request<{ id: string; status: string }>('/api/category-requests', { method: 'POST', body: JSON.stringify(data) }),

  /** GET /api/items — list items (storeId/kind/status/category/search filters). */
  getItems: (params: { storeId?: string; kind?: string; status?: string; category?: string; search?: string; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
    return request<{ data: any[]; total: number; limit: number; offset: number }>(`/api/items${qs.toString() ? '?' + qs.toString() : ''}`)
  },

  /** GET /api/items/:id — full item with variants, attributes, photos, categories. */
  getItem: (id: string) => request<any>(`/api/items/${encodeURIComponent(id)}`),

  /** POST /api/items — create an item in any kind. */
  createItem: (data: { storeId: string; kind: 'food' | 'physical' | 'service' | 'rental' | 'experience'; name: string; price: number; description?: string; status?: string; visibility?: string; available?: boolean; stock?: number | null; durationMinutes?: number | null; capacity?: number | null; preparationMinutes?: number | null; categoryIds?: string[]; metadata?: Record<string, any> }) =>
    request<any>('/api/items', { method: 'POST', body: JSON.stringify(data) }),

  patchItem: (id: string, data: Record<string, any>) =>
    request<any>(`/api/items/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),

  archiveItem: (id: string) => request<{ ok: boolean }>(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  /** GET /api/catalog/search — public FTS5-backed search with filters + facets. */
  searchCatalog: (params: { q?: string; kind?: string; category?: string; min_price?: number; max_price?: number; store_id?: string; attrs?: string; limit?: number; cursor?: string } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
    return request<{ items: any[]; total: number; facets: any; next_cursor: string | null }>(`/api/catalog/search${qs.toString() ? '?' + qs.toString() : ''}`)
  },

  // ── Featured slots — paid promoted placements (marketplace) ──────────────
  // Backend in runbits-restaurant-service: /catalog/featured/* endpoints.
  // Wired through the gateway as /api/catalog/featured/*.

  /** Public pricing per placement — no auth needed. */
  getFeaturedPricing: () =>
    request<{ placements: Array<{ placement: string; cost_per_day_cents: number; currency: string; min_days: number; max_days: number; description?: string }> }>(
      '/api/catalog/featured/pricing',
    ),

  /** Admin: list ALL pricing rows (including inactive). Requires role=superadmin. */
  getFeaturedPricingAdmin: () =>
    request<{ placements: Array<{ placement: string; cost_per_day_cents: number; currency: string; min_days: number; max_days: number; description: string | null; active: boolean }> }>(
      '/api/catalog/featured/pricing/admin',
    ),

  /** Admin: upsert a placement's pricing config. Affects new purchases only —
   *  active slots keep their snapshot cost_cents. Requires role=superadmin. */
  updateFeaturedPricing: (placement: string, data: { cost_per_day_cents: number; currency: string; min_days: number; max_days: number; description?: string | null; active?: boolean }) =>
    request<{ placement: string; cost_per_day_cents: number; currency: string; min_days: number; max_days: number; description: string | null; active: boolean }>(
      `/api/catalog/featured/pricing/${encodeURIComponent(placement)}`,
      { method: 'PUT', body: JSON.stringify(data) },
    ),

  /** Quote a slot before purchase — server-side computes cost and availability. */
  quoteFeatured: (data: { item_id: string; placement: string; placement_value?: string; duration_days: number; starts_at?: number }) =>
    request<{ placement: string; cost_cents: number; currency: string; starts_at: number; ends_at: number; duration_days: number; available: boolean; competing_slots: number }>(
      '/api/catalog/featured/quote',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  /** Create slot (status=pending_payment) and obtain checkout_url for the merchant's payment provider. */
  createFeatured: (data: { item_id: string; placement: string; placement_value?: string; duration_days: number; starts_at?: number; idempotencyKey?: string }) => {
    const headers: Record<string, string> = {}
    if (data.idempotencyKey) headers['Idempotency-Key'] = data.idempotencyKey
    const { idempotencyKey: _ik, ...body } = data
    return request<{ id: string; status: string; checkout_url: string }>(
      '/api/catalog/featured',
      { method: 'POST', body: JSON.stringify(body), headers },
    )
  },

  /** List my slots (merchant-scoped) with aggregated metrics. */
  listMyFeatured: (params: { status?: string; limit?: number; cursor?: string } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
    return request<{ data: Array<{ id: string; item_id: string; item_name?: string; item_image_key?: string | null; placement: string; placement_value?: string | null; status: string; starts_at: number; ends_at: number; duration_days: number; cost_cents: number; currency: string; impressions_total: number; clicks_total: number; ctr: number; checkout_url?: string | null }>; next_cursor: string | null }>(
      `/api/catalog/featured/mine${qs.toString() ? '?' + qs.toString() : ''}`,
    )
  },

  /** Get one slot — owner check applied server-side. */
  getFeatured: (id: string) =>
    request<{ id: string; item_id: string; item_name?: string; item_image_key?: string | null; placement: string; placement_value?: string | null; status: string; starts_at: number; ends_at: number; duration_days: number; cost_cents: number; currency: string; checkout_url?: string | null; impressions_total: number; clicks_total: number; ctr: number }>(
      `/api/catalog/featured/${encodeURIComponent(id)}`,
    ),

  /** Cancel a slot — refund logic decided server-side based on starts_at vs now. */
  cancelFeatured: (id: string) =>
    request<{ ok: boolean; refunded_cents: number }>(`/api/catalog/featured/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  /** Extend an active slot — creates a new charge and pushes ends_at on confirmation. */
  extendFeatured: (id: string, additional_days: number) =>
    request<{ id: string; status: string; checkout_url: string; cost_cents: number; new_ends_at: number }>(
      `/api/catalog/featured/${encodeURIComponent(id)}/extend`,
      { method: 'POST', body: JSON.stringify({ additional_days }) },
    ),

  /** Time-series metrics for a slot — last 30 days by default. */
  getFeaturedMetrics: (id: string) =>
    request<{ data: Array<{ date_yyyymmdd: number; impressions: number; clicks: number }> }>(
      `/api/catalog/featured/${encodeURIComponent(id)}/metrics`,
    ),

  // ── Web Vitals analytics (admin) ──────────────────────────────────────────

  /**
   * Percentiles (p50/p75/p95) for the given Core Web Vital metric over a time
   * window. `since` is a UNIX ms epoch (defaults to last 24h server-side).
   */
  getVitalsPercentiles: (metric: 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB', since: number) =>
    request<{
      metric: string
      since: number
      count: number
      p50: number | null
      p75: number | null
      p95: number | null
    }>(`/api/vitals/percentiles?metric=${metric}&since=${since}`),

  /** Top URLs by average value for the given metric (worst-first). */
  getVitalsByUrl: (metric: 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB', since: number, limit = 20) =>
    request<{
      metric: string
      since: number
      limit: number
      data: Array<{ url: string; samples: number; avg_value: number; min_value: number; max_value: number }>
    }>(`/api/vitals/by-url?metric=${metric}&since=${since}&limit=${limit}`),

  // ── Fiscal e-invoicing (runbits-fiscal via gateway) ──────────────────────
  // Store-scoped by the gateway from the caller's attested identity — the
  // client never passes a store id. Errors surface as ApiError { message, code }.

  /** GET /api/fiscal/profile — read the store's fiscal identity (404 → not set). */
  getFiscalProfile: () =>
    request<{ profile: FiscalProfile }>('/api/fiscal/profile'),

  /** PUT /api/fiscal/profile — upsert the store's fiscal identity. */
  putFiscalProfile: (data: FiscalProfileInput) =>
    request<{ profile: FiscalProfile }>('/api/fiscal/profile', {
      method: 'PUT', body: JSON.stringify(data),
    }),

  /** POST /api/fiscal/cert — upload cert + key PEMs (validated + encrypted
   *  server-side). NEVER returns the PEMs — only non-secret metadata. */
  uploadFiscalCert: (cert: string, key: string) =>
    request<FiscalCertResult>('/api/fiscal/cert', {
      method: 'POST', body: JSON.stringify({ cert, key }),
    }),

  /** DELETE /api/fiscal/cert — deactivate the active cert (rotation / removal). */
  deleteFiscalCert: () =>
    request<{ ok: boolean; deactivated: number }>('/api/fiscal/cert', { method: 'DELETE' }),

  /** GET /api/fiscal/invoices — paginated, store-scoped list. */
  listFiscalInvoices: (params: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.limit != null) qs.set('limit', String(params.limit))
    if (params.offset != null) qs.set('offset', String(params.offset))
    return request<{ invoices: FiscalInvoice[] }>(
      `/api/fiscal/invoices${qs.toString() ? '?' + qs.toString() : ''}`,
    )
  },

  /** GET /api/fiscal/invoices/:id — single invoice (store-scoped). */
  getFiscalInvoice: (id: string) =>
    request<{ invoice: FiscalInvoice }>(`/api/fiscal/invoices/${encodeURIComponent(id)}`),

  /** Build the authed URL for the invoice PDF (HTML render). The endpoint is
   *  gateway-authed, so callers must fetch it WITH the Bearer token and open the
   *  result (e.g. as a blob), not navigate to it directly. */
  getFiscalInvoicePdfUrl: (id: string) =>
    `${API_BASE}/api/fiscal/invoices/${encodeURIComponent(id)}/pdf`,
}
