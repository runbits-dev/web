import { test, expect } from '@playwright/test'
import { setAuthToken } from '../../helpers/auth'

test.describe('Admin — Comisiones', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page, 'mock-token-superadmin')
    await page.goto('/dashboard/admin/commissions')
    await page.waitForLoadState('networkidle')
  })

  test('muestra el resumen de comisiones', async ({ page }) => {
    await expect(page.getByText('Comisiones')).toBeVisible()
    // summary: total $85000, pending $50000, paid $35000
    await expect(page.getByText('$850.00')).toBeVisible()   // total
    await expect(page.getByText('$500.00')).toBeVisible()   // pending
    await expect(page.getByText('$350.00')).toBeVisible()   // paid
  })

  test('lista las comisiones con agente y monto', async ({ page }) => {
    await expect(page.getByText('Martín López').first()).toBeVisible()
    await expect(page.getByText('$500.00').first()).toBeVisible()
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
