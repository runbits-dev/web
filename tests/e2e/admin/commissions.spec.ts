import { test, expect, loginAsSuperadmin } from '../../fixtures/base'

test.describe('Admin — Comisiones', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/dashboard/admin/commissions')
    await page.waitForLoadState('networkidle')
  })

  test('muestra el resumen de comisiones', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Comisiones' })).toBeVisible()
    // total_amount: 85000 centavos = $850.00
    await expect(page.getByText('$850.00')).toBeVisible()
    await expect(page.getByText('$500.00').first()).toBeVisible()
    await expect(page.getByText('$350.00').first()).toBeVisible()
  })

  test('lista las comisiones con agente y monto', async ({ page }) => {
    await expect(page.getByText('Martín López').first()).toBeVisible()
    await expect(page.getByRole('cell', { name: '$500.00' })).toBeVisible()
  })

  test('muestra botones Aprobar/Rechazar para comisión pending', async ({ page }) => {
    const pendingRow = page.locator('tr').filter({ hasText: 'pending' })
    await expect(pendingRow.getByRole('button', { name: 'Aprobar' })).toBeVisible()
    await expect(pendingRow.getByRole('button', { name: 'Rechazar' })).toBeVisible()
  })

  test('aprobar comisión cambia su estado', async ({ page }) => {
    const pendingRow = page.locator('tr').filter({ hasText: 'pending' })
    await pendingRow.getByRole('button', { name: 'Aprobar' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('approved').first()).toBeVisible()
  })

  test('rechazar comisión cambia su estado', async ({ page }) => {
    const pendingRow = page.locator('tr').filter({ hasText: 'pending' })
    await pendingRow.getByRole('button', { name: 'Rechazar' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('rejected')).toBeVisible()
  })
})
