import { test, expect } from '@playwright/test'
import { setAuthToken } from '../../helpers/auth'

test.describe('Dashboard — Estadísticas', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page, 'mock-token-restaurant')
    await page.goto('/dashboard/stats')
    await page.waitForLoadState('networkidle')
  })

  test('muestra el estado del restaurante', async ({ page }) => {
    await expect(page.getByText('Estadísticas')).toBeVisible()
    await expect(page.getByText('Abierto')).toBeVisible()
    await expect(page.getByText('Activo')).toBeVisible() // onboarding live
  })

  test('muestra conteo de productos activos', async ({ page }) => {
    await expect(page.getByText('2')).toBeVisible() // available_items
    await expect(page.getByText('/ 3')).toBeVisible() // total_items
  })

  test('muestra pedidos del día, semana y mes', async ({ page }) => {
    await expect(page.getByText('12')).toBeVisible()  // today
    await expect(page.getByText('58')).toBeVisible()  // this_week
    await expect(page.getByText('210')).toBeVisible() // this_month
  })

  test('muestra ingresos formateados', async ({ page }) => {
    // revenue_today: 312000000 centavos = $3.120.000
    await expect(page.getByText(/\$3\.120\.000|\$3,120,000/).first()).toBeVisible()
  })
})
