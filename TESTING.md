# Testing — Runbits Web Dashboard

## Stack

| Herramienta | Rol |
|---|---|
| **Playwright** | Browser automation E2E (Chromium) |
| **MSW (Mock Service Worker)** | Intercepta `fetch()` en el browser, devuelve fixtures JSON |
| **GitHub Actions** | Corre los tests en cada push/PR a `main` |

## Por qué MSW en lugar de API real

Los tests E2E corren contra la app real en el browser, pero con la API **mockeada**:

- ✅ No dependen de que `api.runbits.dev` esté up
- ✅ No crean/borran datos en producción
- ✅ Son deterministas (siempre los mismos datos)
- ✅ Podés testear estados de error fácilmente
- ✅ Rápidos (sin latencia de red)

## Estructura

```
tests/
  fixtures/                    ← Respuestas JSON que devuelve la API mock
    user-restaurant.json       ← Usuario restaurant_owner
    user-superadmin.json       ← Usuario superadmin
    menu-items.json            ← Items del menú
    orders.json                ← Pedidos
    stats-restaurant.json      ← Stats del restaurante
    admin-restaurants.json     ← Lista de restaurantes (admin)
    admin-agents.json          ← Lista de agentes (admin)
    admin-commissions.json     ← Lista de comisiones (admin)
    admin-commissions-summary.json
    riders.json
  mocks/
    handlers.ts                ← MSW handlers (uno por dominio)
    browser.ts                 ← Setup del worker MSW
  helpers/
    auth.ts                    ← Helpers de login para tests
  e2e/
    auth/
      login.spec.ts            ← Login, errores, redirect, guard
    dashboard/
      menu.spec.ts             ← CRUD completo de menú
      orders.spec.ts           ← Lista de pedidos
      stats.spec.ts            ← Página de estadísticas
      settings.spec.ts         ← Edición de perfil
    admin/
      restaurants.spec.ts      ← Lista y estado de restaurantes
      agents.spec.ts           ← Aprobar/suspender agentes
      commissions.spec.ts      ← Aprobar/rechazar comisiones
playwright.config.ts
```

## Cómo correr los tests

### Instalar dependencias

```bash
npm install
npx playwright install chromium
```

### Correr todos los tests (headless)

```bash
npm run test:e2e
```

### Correr con UI interactiva (recomendado para desarrollo)

```bash
npm run test:e2e:ui
```

### Correr con browser visible

```bash
npm run test:e2e:headed
```

### Ver el reporte HTML del último run

```bash
npm run test:e2e:report
```

### Correr un archivo específico

```bash
npx playwright test tests/e2e/dashboard/menu.spec.ts
```

### Correr en modo debug (paso a paso)

```bash
npx playwright test --debug tests/e2e/auth/login.spec.ts
```

## Cómo funciona la autenticación en los tests

Hay dos estrategias en `tests/helpers/auth.ts`:

### 1. Login completo (para tests de auth)
```typescript
await loginAsRestaurantOwner(page)
// Navega a /login, llena el form, espera redirect a /dashboard
```

### 2. Inyección directa de token (para el resto de tests)
```typescript
await setAuthToken(page, 'mock-token-restaurant')
await page.goto('/dashboard/menu')
// Más rápido: saltea el flujo de login
```

El token `'mock-token-restaurant'` es reconocido por el handler MSW de `GET /api/auth/me` y devuelve el fixture `user-restaurant.json`.

## Credenciales de test

| Rol | Email | Password |
|---|---|---|
| Restaurant owner | `owner@laburguesa.com` | `password123` |
| Superadmin | `admin@runbits.dev` | `password123` |

## Agregar un nuevo test

1. **Crear el fixture** si la página consume un endpoint nuevo:
   ```bash
   # tests/fixtures/mi-endpoint.json
   { "data": [...] }
   ```

2. **Agregar el handler MSW** en `tests/mocks/handlers.ts`:
   ```typescript
   http.get(`${API}/api/mi-endpoint`, () => HttpResponse.json(miFixture))
   ```

3. **Escribir el spec** en `tests/e2e/`:
   ```typescript
   import { test, expect } from '@playwright/test'
   import { setAuthToken } from '../../helpers/auth'

   test.describe('Mi página', () => {
     test.beforeEach(async ({ page }) => {
       await setAuthToken(page, 'mock-token-restaurant')
       await page.goto('/dashboard/mi-pagina')
       await page.waitForLoadState('networkidle')
     })

     test('hace algo', async ({ page }) => {
       await expect(page.getByText('algo')).toBeVisible()
     })
   })
   ```

## CI/CD

El workflow `.github/workflows/playwright.yml` corre automáticamente en:
- Cada push a `main`
- Cada PR hacia `main`

El reporte HTML se sube como artifact y está disponible 14 días en la pestaña **Actions** del repo.

## Notas importantes

- **MSW se inicializa en `next.config.ts`** — el service worker se registra automáticamente en modo test.
- Los handlers de MSW **mutan estado en memoria** (ej: `mockMenu`, `mockAgents`). Cada `test.beforeEach` que navega a la página recarga los fixtures desde el módulo. Si un test muta el estado y el siguiente depende del estado original, usar `test.beforeEach` para resetear.
- Los tests de **admin** usan `mock-token-superadmin`. El handler de `/api/auth/me` devuelve el fixture `user-superadmin.json` para ese token.
- **`playwright.config.ts`** levanta el servidor Next.js automáticamente con `webServer`. En CI hace `build + start`; en local reutiliza el servidor si ya está corriendo en `:3000`.
