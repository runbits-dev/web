import { test, expect, loginAsSuperadmin } from '../../fixtures/base'

test.describe('Admin — Agentes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/dashboard/admin/agents')
    await page.waitForLoadState('networkidle')
  })

  test('lista los agentes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Agentes' })).toBeVisible()
    await expect(page.getByText('Martín López')).toBeVisible()
    await expect(page.getByText('Laura García')).toBeVisible()
  })

  test('muestra botón Aprobar para agente pending', async ({ page }) => {
    const lauraRow = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Laura García' })
    await expect(lauraRow.getByRole('button', { name: 'Aprobar' })).toBeVisible()
  })

  test('muestra botón Suspender para agente active', async ({ page }) => {
    const martinRow = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Martín López' })
    await expect(martinRow.getByRole('button', { name: 'Suspender' })).toBeVisible()
  })

  test('aprobar agente actualiza su estado', async ({ page }) => {
    const lauraRow = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Laura García' })
    await lauraRow.getByRole('button', { name: 'Aprobar' }).click()
    await page.waitForLoadState('networkidle')
    await expect(lauraRow.getByRole('button', { name: 'Activar' })).toBeVisible()
  })

  test('suspender agente actualiza su estado', async ({ page }) => {
    const martinRow = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Martín López' })
    await martinRow.getByRole('button', { name: 'Suspender' }).click()
    await page.waitForLoadState('networkidle')
    await expect(martinRow.getByText('suspended')).toBeVisible()
  })
})
