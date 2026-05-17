// Tombstone for the legacy MSW (Mock Service Worker) registered during
// Playwright tests. Any browser that still has this SW installed will fetch
// THIS new version on next update check, evaluate it, and immediately
// unregister itself + clear all caches. No interception, no message handling,
// just cleanup.
//
// Once all browsers have rolled forward (typical: 1-24h after deploy), this
// file can be removed entirely. Until then it stays here to guarantee
// stale installs get cleaned up.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch {}
      try {
        await self.registration.unregister()
      } catch {}
      try {
        const clientsList = await self.clients.matchAll({ type: 'window' })
        for (const client of clientsList) {
          client.navigate(client.url)
        }
      } catch {}
    })()
  )
})

self.addEventListener('fetch', (event) => {
  // Pass through every request untouched — never intercept.
  event.respondWith(fetch(event.request))
})
