import { test, expect } from '../../fixtures/base'

const API = 'https://api.runbits.dev'

test.describe('Store Checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Mock store data
    await page.route(`${API}/api/restaurants/slug/test-store`, async (route) => {
      await route.fulfill({
        json: {
          id: 'store-001',
          name: 'Test Store',
          slug: 'test-store',
          is_open: true,
          description: 'Test',
          category: 'food',
          avg_delivery_time_min: 30,
          min_order_amount: 0,
          brand_color: '#4f46e5',
          brand_bg: '#f9fafb',
        },
      })
    })

    await page.route(`${API}/api/restaurants/store-001/menu`, async (route) => {
      await route.fulfill({
        json: [
          { id: 'item-1', name: 'Hamburguesa', price: 150000, category: 'Principales', is_available: true, available: 1 },
          { id: 'item-2', name: 'Papas', price: 80000, category: 'Acompañamientos', is_available: true, available: 1 },
        ],
      })
    })

    await page.route(`${API}/api/orders/restaurants/store-001/ratings`, async (route) => {
      await route.fulfill({ json: [] })
    })

    await page.route(`${API}/api/promotions/active`, async (route) => {
      await route.fulfill({ json: [] })
    })
  })

  test('shows store with menu items', async ({ page }) => {
    await page.goto('/store?s=test-store')
    await expect(page.getByText('Test Store')).toBeVisible()
    await expect(page.getByText('Hamburguesa')).toBeVisible()
    await expect(page.getByText('Papas')).toBeVisible()
  })

  test('can add items to cart', async ({ page }) => {
    await page.goto('/store?s=test-store')
    await page.click('button:has-text("Agregar"):first-of-type')
    await expect(page.getByText('Ver pedido (1)')).toBeVisible()
  })

  test('shows checkout modal', async ({ page }) => {
    await page.goto('/store?s=test-store')
    await page.click('button:has-text("Agregar"):first-of-type')
    await page.click('button:has-text("Ver pedido")')
    await expect(page.getByText('Tu pedido')).toBeVisible()
    await expect(page.getByText('Confirmar pedido')).toBeVisible()
  })
})
