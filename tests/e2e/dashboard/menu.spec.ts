import { test, expect, loginAsRestaurantOwner } from '../../fixtures/base'

test.describe('Dashboard — Menú', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRestaurantOwner(page)
    await page.goto('/dashboard/menu')
    await page.waitForLoadState('networkidle')
  })

  test('lista los items del menú', async ({ page }) => {
    await expect(page.getByText('Hamburguesa Clásica')).toBeVisible()
    await expect(page.getByText('Papas Fritas')).toBeVisible()
    await expect(page.getByText('Coca Cola')).toBeVisible()
    await expect(page.getByText('3 productos')).toBeVisible()
  })

  test('muestra badge de disponibilidad correcto', async ({ page }) => {
    await expect(page.getByText('Disponible').first()).toBeVisible()
    await expect(page.getByText('No disponible')).toBeVisible()
  })

  test('abre modal al clickear + Agregar producto', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    // Modal heading "Agregar producto"
    await expect(page.getByRole('heading', { name: 'Agregar producto' })).toBeVisible()
    await expect(page.getByPlaceholder('Ej: Hamburguesa clásica')).toBeVisible()
    await expect(page.getByRole('spinbutton')).toBeVisible()
  })

  test('crea un nuevo item de menú', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    await page.getByPlaceholder('Ej: Hamburguesa clásica').fill('Pizza Margherita')
    await page.getByPlaceholder('Descripción opcional').fill('Salsa, mozzarella, albahaca')
    await page.getByRole('spinbutton').fill('1200')
    // Categoría is a <select>; pick the first non-empty option to avoid relying on a free-text input.
    // The select has "Sin categoría" + preset categories; we just leave it as "Sin categoría".
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Pizza Margherita')).toBeVisible()
  })

  test('cancela el modal sin guardar', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    await expect(page.getByRole('heading', { name: 'Agregar producto' })).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('heading', { name: 'Agregar producto' })).not.toBeVisible()
  })

  test('abre modal de edición al clickear Editar', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible()
    await expect(page.getByPlaceholder('Ej: Hamburguesa clásica')).toHaveValue('Hamburguesa Clásica')
  })

  test('toggle de disponibilidad cambia el badge', async ({ page }) => {
    const papasRow = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Papas Fritas' })
    await papasRow.getByRole('button', { name: 'Disponible' }).click()
    await expect(papasRow.getByText('No disponible')).toBeVisible()
  })

  test('elimina un item con confirmación', async ({ page }) => {
    await page.getByRole('button', { name: 'Eliminar' }).first().click()
    await expect(page.getByText('¿Eliminar producto?')).toBeVisible()
    // The confirmation modal also has an "Eliminar" button; use last() to pick it.
    await page.getByRole('button', { name: 'Eliminar' }).last().click()
    await expect(page.getByText('Hamburguesa Clásica')).not.toBeVisible()
  })

  test('cancela la eliminación', async ({ page }) => {
    await page.getByRole('button', { name: 'Eliminar' }).first().click()
    await expect(page.getByText('¿Eliminar producto?')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).last().click()
    await expect(page.getByText('Hamburguesa Clásica')).toBeVisible()
  })
})
