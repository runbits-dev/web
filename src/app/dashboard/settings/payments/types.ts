// Shared types and provider catalog for the payments settings page.

export type ProviderId =
  | 'mercadopago'
  | 'stripe'
  | 'paypal'
  | 'transfer'
  | 'cash'

export type ProviderInfo = {
  id: ProviderId
  name: string
  logo: string
  oauth: boolean
  requiredModule: 'payment_basic' | 'payment_extended'
  countries: string[]
}

export type PaymentMethodStatus = 'active' | 'pending_oauth' | 'error' | string

export type PaymentMethod = {
  id: string
  store_id: string
  provider: ProviderId | string
  status: PaymentMethodStatus
  is_default: boolean
  account_label?: string | null
  config?: Record<string, unknown> | null
  created_at?: number | null
}

// ─── Provider catalog (frontend-owned) ──────────────────────────────────────
//
// Logos use emoji as a placeholder so we don't ship missing SVGs. Replace with
// real /public/logos/*.svg paths when the assets land.

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    logo: '🟦',
    oauth: true,
    requiredModule: 'payment_basic',
    countries: ['AR', 'MX', 'BR', 'CL', 'CO', 'PE', 'UY'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    logo: '💳',
    oauth: true,
    requiredModule: 'payment_basic',
    countries: ['*'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    logo: '🅿️',
    oauth: true,
    requiredModule: 'payment_extended',
    countries: ['*'],
  },
  {
    id: 'transfer',
    name: 'Transferencia bancaria',
    logo: '🏦',
    oauth: false,
    requiredModule: 'payment_basic',
    countries: ['*'],
  },
  {
    id: 'cash',
    name: 'Efectivo en local',
    logo: '💵',
    oauth: false,
    requiredModule: 'payment_basic',
    countries: ['*'],
  },
]
