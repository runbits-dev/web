import { test, expect, loginAsRestaurantOwner } from '../../fixtures/base'

test.describe('Dashboard — Estadísticas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRestaurantOwner(page)
    await page.goto('/dashboard/stats')
    await page.waitForLoadState('networkidle')
  })

  test('muestra el encabezado con resumen', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Estadísticas' })).toBeVisible()
    await expect(page.getByText(/resumen de tu (comercio|restaurante)/i)).toBeVisible()
  })

  test('muestra las tarjetas con métricas del día', async ({ page }) => {
    // Stat cards for today's metrics
    await expect(page.getByText('Pedidos hoy', { exact: true })).toBeVisible()
    await expect(page.getByText('Revenue hoy', { exact: true })).toBeVisible()
    await expect(page.getByText('Ticket promedio', { exact: true })).toBeVisible()
    // today=12 in fixture appears multiple times (stat card + chart bar);
    // use first() to avoid strict-mode failure.
    await expect(page.getByText('12', { exact: true }).first()).toBeVisible()
  })

  test('muestra la tendencia y los pedidos por período', async ({ page }) => {
    await expect(page.getByText(/tendencia de ingresos/i)).toBeVisible()
    await expect(page.getByText(/pedidos por período/i)).toBeVisible()
    // this_week=58 and this_month=210 — also rendered in multiple places.
    await expect(page.getByText('58', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('210', { exact: true }).first()).toBeVisible()
  })
})
