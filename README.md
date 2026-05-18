# runbits-web

> Merchant dashboard — `runbits.io`. Manage menu, orders, stats, settings, billing, marketing, integrations.

## Stack

- **Type**: Cloudflare Pages (Next.js static export)
- **Runtime**: Next.js 15.2 + React 19 + TypeScript + Tailwind v3
- **Public domain**: `runbits.io`
- **Pages project name**: `runbits-web`
- **API base**: `https://api.runbits.dev` (runbits-gateway)

## Folder layout

- `src/app/` — Next.js App Router pages
- `src/components/` — shared UI
- `src/context/` — React context providers (auth, store)
- `src/i18n/` — translations
- `src/lib/` — API client, helpers
- `src/mocks/` — MSW handlers used in dev/test
- `tests/` — Playwright E2E + MSW fixtures (see `TESTING.md`)

## Dependencies of note

- `@simplewebauthn/browser` — passkey enrollment + login
- `msw` — intercepts `fetch()` in browser for E2E tests
- `qrcode.react` — QR generation for pickup/delivery codes
- `@playwright/test` — E2E runner

## Build & deploy

```bash
export CLOUDFLARE_API_TOKEN=<token>
export CLOUDFLARE_ACCOUNT_ID=e26bfe18bfa6df2cb533f24129d433ba

# Build static export
NEXT_STATIC_EXPORT=true npx next build

# Deploy to Cloudflare Pages
npx wrangler@4 pages deploy out --project-name=runbits-web --branch=main
```

## Local dev

```bash
npm install
npm run dev          # http://localhost:3000
```

## E2E tests

Playwright + MSW (see `TESTING.md` for full guide):

```bash
npx playwright install chromium
npm run test:e2e          # headless
npm run test:e2e:ui       # interactive
npm run test:e2e:headed   # visible browser
npm run test:e2e:report   # last HTML report
```

CI runs `.github/workflows/playwright.yml` on every push/PR to `main`. HTML report uploaded as artifact (14-day retention).

## Test credentials (MSW only)

| Role | Email | Password |
|---|---|---|
| Restaurant owner | `owner@laburguesa.com` | `password123` |
| Superadmin | `admin@runbits.dev` | `password123` |

## Gotchas

- `output: 'export'` only when `NEXT_STATIC_EXPORT=true` — Playwright needs a real Next server, so the flag is OFF during tests.
- MSW handlers **mutate in-memory state** (e.g. `mockMenu`, `mockAgents`). Use `test.beforeEach` to reset between tests.
- `playwright.config.ts` auto-starts the Next server; in CI it builds + starts, locally it reuses :3000 if up.
- WebAuthn passkey enrollment requires the page to be served on a real domain (HTTPS) or `localhost`. RP ID = `runbits.io`.

## Linked

- Backend gateway: `runbits-gateway-service`
- TESTING.md (detailed): `./TESTING.md`
- Architecture: `runbits-map/02 Merchant Dashboard (runbits.io)/`
