"use client"

import { useState } from 'react'
import { API_BASE } from '@/lib/api'
import { useI18n } from '@/i18n'
import { PricingDisclosure } from './PricingDisclosure'

interface Props {
  storeId: string
  onError: (message: string) => void
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Embedded Signup connect button.
 *
 * Flow:
 *   1. User clicks → PricingDisclosure modal shows fee transparency.
 *   2. User accepts → POST /api/channels/whatsapp/oauth/start.
 *   3. Browser redirects (top-level navigation) to Meta authorize_url.
 *      Note: we use top-level navigation rather than a popup because:
 *        - Meta's mobile UX is brittle inside popups
 *        - postMessage cross-origin is fragile
 *        - The dashboard re-mounts on the callback redirect with ?connected=...
 */
export function WhatsAppConnectFlow({ storeId, onError }: Props) {
  const { t } = useI18n()
  const [showPricing, setShowPricing] = useState(false)
  const [busy, setBusy] = useState(false)

  async function startOAuth() {
    setBusy(true)
    setShowPricing(false)
    try {
      const res = await fetch(`${API_BASE}/api/channels/whatsapp/oauth/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ storeId }),
      })
      const data = (await res.json().catch(() => ({}))) as { authorize_url?: string; error?: string }
      if (!res.ok || !data.authorize_url) {
        onError(data.error || `HTTP ${res.status}`)
        setBusy(false)
        return
      }
      // Top-level navigation. Meta will redirect back to the callback,
      // then the gateway redirects to /dashboard/settings/channels?connected=whatsapp&phone=...
      window.location.href = data.authorize_url
    } catch (err) {
      onError((err as Error).message || 'error')
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowPricing(true)}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy
          ? t('settingsChannels.connectStarting')
          : t('settingsChannels.connectCta')}
      </button>
      {showPricing && (
        <PricingDisclosure
          onAccept={startOAuth}
          onClose={() => setShowPricing(false)}
        />
      )}
    </>
  )
}
