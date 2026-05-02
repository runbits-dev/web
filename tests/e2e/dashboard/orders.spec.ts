import { test, expect, loginAsRestaurantOwner } from '../../fixtures/base'

test.describe('Dashboard — Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRestaurantOwner(page)
    await page.goto('/dashboard/orders')
    await page.waitForLoadState('networkidle')
  })

  test('muestra la lista de pedidos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible()
    await expect(page.getByText('3 pedidos en total')).toBeVisible()
  })

  test('muestra los estados correctos', async ({ page }) => {
    // The page shows the localized labels for the active tab.
    // Default tab is "Activos" (PENDING/CONFIRMED/PREPARING/...).
    // PREPARING is in active tab → label is "Preparando".
    await expect(page.getByText('Preparando')).toBeVisible()

    // Switch to Cancelados tab and check the localized label.
    await page.getByRole('button', { name: /^Cancelados$/ }).click()
    await expect(page.getByText('Cancelado').first()).toBeVisible()

    // Switch to "Todos" to see DELIVERED → "Entregado".
    await page.getByRole('button', { name: /^Todos$/ }).click()
    await expect(page.getByText('Entregado')).toBeVisible()
  })

  test('muestra los totales formateados', async ({ page }) => {
    // Switch to "Todos" so all orders are visible.
    await page.getByRole('button', { name: /^Todos$/ }).click()
    // Totals are price/100 with 2 decimals, e.g. 260000 → $2600.00.
    await expect(page.getByText('$2600.00')).toBeVisible()
    await expect(page.getByText('$1800.00')).toBeVisible()
  })

  test('muestra IDs de pedidos abreviados', async ({ page }) => {
    // IDs are rendered as #<first 8 chars>, e.g. order-001 → #order-00.
    await expect(page.getByText('#order-00').first()).toBeVisible()
  })
})
