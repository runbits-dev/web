import { Page } from '@playwright/test'

export async function loginAsRestaurantOwner(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'owner@laburguesa.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

export async function loginAsSuperadmin(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'admin@runbits.dev')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Inyecta el token directamente en localStorage para saltear el login
 * y navegar directo a una página protegida. Más rápido para tests
 * que no testean el flujo de auth en sí.
 */
export async function setAuthToken(
  page: Page,
  token: 'mock-token-restaurant' | 'mock-token-superadmin'
) {
  await page.goto('/')
  await page.evaluate((t) => localStorage.setItem('token', t), token)
}
