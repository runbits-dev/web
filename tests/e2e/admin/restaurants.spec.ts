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
    // Header now shows "{total} registrados · {filtered.length} mostrados"
    await expect(page.getByText(/2 registrados/)).toBeVisible()
  })

  test('muestra estado abierto/cerrado en las tarjetas', async ({ page }) => {
    // The page also has a "Estado: todos / Abierto / Cerrado" filter <select>
    // whose <option>s match "Abierto" / "Cerrado" by accessible text. Scope to
    // the row buttons (rendered as <button> with the badge text inside).
    const burguesaRow = page.getByRole('button', { name: /La Burguesa/i })
    await expect(burguesaRow.getByText('Abierto')).toBeVisible()
    const sushiRow = page.getByRole('button', { name: /Sushi Zen/i })
    await expect(sushiRow.getByText('Cerrado')).toBeVisible()
  })

  test('muestra plan de suscripción en cada tarjeta', async ({ page }) => {
    // Plan badges appear inside the row buttons. Scope to avoid matching the
    // "Plan: todos" <select> options.
    const burguesaRow = page.getByRole('button', { name: /La Burguesa/i })
    await expect(burguesaRow.getByText('growth')).toBeVisible()
    const sushiRow = page.getByRole('button', { name: /Sushi Zen/i })
    await expect(sushiRow.getByText('starter')).toBeVisible()
  })
})
