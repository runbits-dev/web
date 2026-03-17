import { test, expect } from '../../fixtures/base'

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('muestra el formulario de login', async ({ page }) => {
    await expect(page.getByText('Ingresá a tu panel')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  test('login exitoso como restaurant owner → redirect a /dashboard', async ({ page }) => {
    await page.fill('input[type="email"]', 'owner@laburguesa.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('login exitoso como superadmin → redirect a /dashboard', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@runbits.dev')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('credenciales inválidas → muestra error', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Credenciales inválidas')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('sin token → /dashboard redirige a /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })
})
