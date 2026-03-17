import { test, expect, loginAsRestaurantOwner } from '../../fixtures/base'

test.describe('Dashboard — Configuración', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRestaurantOwner(page)
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
  })

  test('muestra los datos del perfil en modo lectura', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible()
    await expect(page.getByRole('main').getByText('Carlos Pérez')).toBeVisible()
    await expect(page.getByText('owner@laburguesa.com').first()).toBeVisible()
    // Hay 2 botones Editar (perfil + restaurante), usamos first()
    await expect(page.getByRole('button', { name: 'Editar' }).first()).toBeVisible()
  })

  test('muestra los datos del restaurante en modo lectura', async ({ page }) => {
    await expect(page.getByText('La Burguesa').first()).toBeVisible()
    await expect(page.getByText('Av. Corrientes 1234, CABA')).toBeVisible()
  })

  test('abre modo edición al clickear Editar', async ({ page }) => {
    // Click en el primer botón Editar (perfil de usuario)
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await expect(page.getByRole('button', { name: 'Guardar' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar' }).first()).toBeVisible()
  })

  test('guarda cambios y muestra feedback de éxito', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click()
    const nameInput = page.getByRole('textbox').first()
    await nameInput.clear()
    await nameInput.fill('Carlos Rodríguez')
    await page.getByRole('button', { name: 'Guardar' }).first().click()
    await expect(page.getByText('Cambios guardados correctamente')).toBeVisible()
  })

  test('cancelar edición no guarda cambios', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click()
    const nameInput = page.getByRole('textbox').first()
    await nameInput.clear()
    await nameInput.fill('Nombre Temporal')
    await page.getByRole('button', { name: 'Cancelar' }).first().click()
    await expect(page.getByRole('main').getByText('Carlos Pérez')).toBeVisible()
    await expect(page.getByText('Nombre Temporal')).not.toBeVisible()
  })
})
