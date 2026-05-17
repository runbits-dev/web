'use client'

import { useEffect } from 'react'

/**
 * Inicializa el Service Worker de MSW en el browser.
 * Solo se activa cuando NEXT_PUBLIC_MSW=true (tests E2E con Playwright).
 *
 * Cuando MSW está OFF (producción), unregister activamente cualquier MSW SW
 * residual que un usuario pueda tener instalado de una sesión previa de tests.
 * Sin esto, el SW intercepta requests para siempre y rompe el flow real (ej:
 * /api/auth/2fa/verify-login nunca llega al backend → redirect a /login).
 */
export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MSW === 'true') {
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: { url: '/mockServiceWorker.js' },
        })
      })
      return
    }
    // MSW OFF: cleanup any stale MSW service worker from previous sessions.
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          const scriptUrl =
            reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL ?? ''
          if (scriptUrl.includes('mockServiceWorker')) {
            reg.unregister().catch(() => {})
          }
        }
      }).catch(() => {})
    }
  }, [])

  return <>{children}</>
}
