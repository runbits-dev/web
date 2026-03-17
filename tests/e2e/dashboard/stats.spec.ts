import { test, expect, loginAsRestaurantOwner } from '../../fixtures/base'

test.describe('Dashboard — Estadísticas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRestaurantOwner(page)
    await page.goto('/dashboard/stats')
    await page.waitForLoadState('networkidle')
  })

  test('muestra el estado del restaurante', async ({ page }) => {
    await expect(page.getByText('Resumen de tu restaurante')).toBeVisible()
    await expect(page.getByText('Abierto')).toBeVisible()
  })

  test('muestra pedidos del día, semana y mes', async ({ page }) => {
    await expect(page.getByText('12', { exact: true })).toBeVisible()  // today
    await expect(page.getByText('58', { exact: true })).toBeVisible()  // this_week
    await expect(page.getByText('210', { exact: true })).toBeVisible() // this_month
  })

  test('muestra ingresos formateados', async ({ page }) => {
    await expect(page.getByText(/3\.120\.000|3,120,000/).first()).toBeVisible()
  })
})
