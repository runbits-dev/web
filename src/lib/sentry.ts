// Sentry client-side initialization for runbits-web (merchant dashboard).
//
// Unlike runbits-app (public marketplace), this is the signed-in merchant
// console. Merchants accept our ToS and consent to operational telemetry
// implicitly when they sign up — there is no consumer-style cookie banner
// here. We still apply the PII strip in `beforeSend`.
//
// Fail-safe: if `NEXT_PUBLIC_SENTRY_DSN_WEB` is missing or still equal to
// the build-time placeholder, init is skipped silently.

import * as Sentry from '@sentry/nextjs'

let initialized = false

const PLACEHOLDER = '__SENTRY_DSN_WEB__'

export function initSentry(): void {
  if (initialized) return
  if (typeof window === 'undefined') return

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN_WEB
  if (!dsn || dsn === PLACEHOLDER) {
    console.warn('[sentry] DSN not configured — skipping init')
    return
  }

  Sentry.init({
    dsn,
    environment: 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      /chrome-extension/,
      /safari-extension/,
      /Network request failed/,
      /Failed to fetch/,
      /ResizeObserver loop limit exceeded/,
      /ResizeObserver loop completed with undelivered notifications/,
    ],
    beforeSend(event) {
      // Strip user PII even for signed-in merchants. We only care about
      // anonymous error patterns; the account_id is intentionally NOT a
      // Sentry user identifier (privacy first; tier-debugging can be done
      // via auth-service audit logs if needed).
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
      }
      if (event.request) {
        if (event.request.cookies) delete event.request.cookies
        if (event.request.headers) {
          delete (event.request.headers as Record<string, unknown>).authorization
          delete (event.request.headers as Record<string, unknown>).Authorization
          delete (event.request.headers as Record<string, unknown>).cookie
          delete (event.request.headers as Record<string, unknown>).Cookie
        }
      }
      return event
    },
  })

  initialized = true
}
