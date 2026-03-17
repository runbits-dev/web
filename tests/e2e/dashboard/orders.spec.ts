import { test, expect } from '@playwright/test'
import { setAuthToken } from '../../helpers/auth'

test.describe('Dashboard — Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page, 'mock-token-restaurant')
    await page.goto('/dashboard/orders')
    await page.waitForLoadState('networkidle')
  })

  test('muestra la lista de pedidos', async ({ page }) => {
    await expect(page.getByText('Pedidos')).toBeVisible()
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

  test('muestra IDs truncados en formato mono', async ({ page }) => {
    await expect(page.getByText('order-00')).toBeVisible()
  })
})
