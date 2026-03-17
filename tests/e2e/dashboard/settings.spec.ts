import { test, expect, loginAsRestaurantOwner } from '../../fixtures/base'

test.describe('Dashboard — Configuración', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRestaurantOwner(page)
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
  })

  test('muestra los datos del perfil en modo lectura', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible()
    // Buscar en el main para evitar el sidebar
    await expect(page.getByRole('main').getByText('Carlos Pérez')).toBeVisible()
    await expect(page.getByText('owner@laburguesa.com').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible()
  })

  test('abre modo edición al clickear Editar', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })

  test('guarda cambios y muestra feedback de éxito', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    const nameInput = page.getByRole('textbox').first()
    await nameInput.clear()
    await nameInput.fill('Carlos Rodríguez')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Cambios guardados correctamente')).toBeVisible()
  })

  test('cancelar edición no guarda cambios', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    const nameInput = page.getByRole('textbox').first()
    await nameInput.clear()
    await nameInput.fill('Nombre Temporal')
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('main').getByText('Carlos Pérez')).toBeVisible()
    await expect(page.getByText('Nombre Temporal')).not.toBeVisible()
  })
})
