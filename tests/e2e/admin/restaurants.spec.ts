import { test, expect, loginAsSuperadmin } from '../../fixtures/base'

test.describe('Admin — Restaurantes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/dashboard/admin/restaurants')
    await page.waitForLoadState('networkidle')
  })

  test('lista los restaurantes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Restaurantes' })).toBeVisible()
    await expect(page.getByText('La Burguesa')).toBeVisible()
    await expect(page.getByText('Sushi Zen')).toBeVisible()
    await expect(page.getByText('2 registrados')).toBeVisible()
  })

  test('muestra estado abierto/cerrado', async ({ page }) => {
    await expect(page.getByText('Abierto')).toBeVisible()
    await expect(page.getByText('Cerrado')).toBeVisible()
  })

  test('muestra plan de suscripción', async ({ page }) => {
    await expect(page.getByText('growth')).toBeVisible()
    await expect(page.getByText('starter')).toBeVisible()
  })
})
