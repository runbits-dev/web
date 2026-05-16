"use client"

import { useEffect } from 'react'
import { initSentry } from '@/lib/sentry'

/**
 * Mount once in the root layout. Calls `initSentry()` on mount.
 * No-op on localhost / preview hosts — Sentry is wired for production only.
 */
export default function SentryProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return
    if (host.endsWith('.workers.dev')) return
    initSentry()
  }, [])
  return null
}
