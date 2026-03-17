'use client'

import { useEffect } from 'react'

/**
 * Inicializa el Service Worker de MSW en el browser.
 * Solo se activa cuando NEXT_PUBLIC_MSW=true (tests E2E con Playwright).
 * En producción esta variable no existe, por lo que no tiene ningún efecto.
 */
export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MSW !== 'true') return
    import('../tests/mocks/browser').then(({ worker }) => {
      worker.start({
        onUnhandledRequest: 'bypass', // deja pasar requests no mockeados
        serviceWorker: { url: '/mockServiceWorker.js' },
      })
    })
  }, [])

  return <>{children}</>
}
