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
    await expect(page.getByText('DELIVERED')).toBeVisible()
    await expect(page.getByText('PREPARING')).toBeVisible()
    await expect(page.getByText('CANCELLED')).toBeVisible()
  })

  test('muestra los totales formateados', async ({ page }) => {
    await expect(page.getByText('$2600.00')).toBeVisible()
    await expect(page.getByText('$1800.00')).toBeVisible()
  })

  test('muestra IDs de pedidos', async ({ page }) => {
    await expect(page.getByText('order-00').first()).toBeVisible()
  })
})
