// Shared types and channel catalog for the channels settings page.

export type ChannelId = 'whatsapp'

export type ChannelStatus = 'active' | 'pending_oauth' | 'error' | 'inactive' | 'expired' | 'revoked' | string

export type ChannelInfo = {
  id: ChannelId
  name: string
  logo: string
  oauth: boolean
  requiredModule: 'whatsapp_basic' | 'whatsapp_marketing_campaigns' | 'whatsapp_multi_number'
}

export type ChannelMetadata = {
  quality_rating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | string
  messaging_limit?: string | null
  business_name?: string | null
  extra_phone_count?: number
  last_health_check_at?: number
}

export type Channel = {
  id: string
  store_id: string
  channel: ChannelId | string
  status: ChannelStatus
  display_name: string | null
  external_id: string | null
  external_phone_number: string | null
  external_phone_number_id: string | null
  external_business_account_id: string | null
  oauth_expires_at: number | null
  oauth_scope: string | null
  metadata: ChannelMetadata | null
  connected_at: number
  last_used_at: number | null
  last_error_at: number | null
  last_error_message: string | null
}

export type Template = {
  name: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | string
  category: string
  language: string
}

export const CHANNELS: ChannelInfo[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    logo: '💬',
    oauth: true,
    requiredModule: 'whatsapp_basic',
  },
]
