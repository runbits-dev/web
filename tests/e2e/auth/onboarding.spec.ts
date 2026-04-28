import { test, expect } from '../../fixtures/base'

test.describe('Onboarding', () => {
  test('new user without profiles sees onboarding', async ({ page }) => {
    // Override /api/auth/me to return a user with no profiles
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          account: { id: 'new-user', email: 'new@test.com', name: 'New User', status: 'active' },
          roles: [{ role: 'customer' }],
          activeRole: 'customer',
          profiles: [],
          activeProfile: null,
        },
      })
    })

    await page.evaluate(() => localStorage.setItem('token', 'mock-token'))
    await page.goto('/dashboard')

    // Should see onboarding step 1
    await expect(page.getByText('¿Qué ofrece tu negocio?')).toBeVisible()
  })
})
