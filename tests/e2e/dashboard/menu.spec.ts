import { test, expect } from '@playwright/test'
import { setAuthToken } from '../../helpers/auth'

test.describe('Dashboard — Menú', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page, 'mock-token-restaurant')
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
    // Hamburguesa y Papas → Disponible; Coca Cola → No disponible
    const rows = page.locator('[data-testid="menu-item"]').or(
      page.locator('.bg-white.rounded-2xl.border')
    )
    await expect(page.getByText('Disponible').first()).toBeVisible()
    await expect(page.getByText('No disponible')).toBeVisible()
  })

  test('abre modal al clickear + Agregar producto', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    await expect(page.getByText('Agregar producto').nth(1)).toBeVisible()
    await expect(page.getByLabel('Nombre *')).toBeVisible()
    await expect(page.getByLabel('Precio ($) *')).toBeVisible()
  })

  test('crea un nuevo item de menú', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    await page.getByLabel('Nombre *').fill('Pizza Margherita')
    await page.getByLabel('Descripción').fill('Salsa, mozzarella, albahaca')
    await page.getByLabel('Precio ($) *').fill('1200')
    await page.getByLabel('Categoría').fill('Pizzas')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Pizza Margherita')).toBeVisible()
  })

  test('validación: no permite guardar sin nombre', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    await page.getByLabel('Precio ($) *').fill('500')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('El nombre es obligatorio')).toBeVisible()
  })

  test('validación: no permite precio inválido', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    await page.getByLabel('Nombre *').fill('Test')
    await page.getByLabel('Precio ($) *').fill('abc')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Precio inválido')).toBeVisible()
  })

  test('cancela el modal sin guardar', async ({ page }) => {
    await page.getByRole('button', { name: '+ Agregar producto' }).click()
    await page.getByLabel('Nombre *').fill('No se guarda')
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByText('No se guarda')).not.toBeVisible()
    // El modal se cierra
    await expect(page.getByLabel('Nombre *')).not.toBeVisible()
  })

  test('abre modal de edición con datos precargados', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await expect(page.getByText('Editar producto')).toBeVisible()
    await expect(page.getByLabel('Nombre *')).toHaveValue('Hamburguesa Clásica')
    await expect(page.getByLabel('Precio ($) *')).toHaveValue('1500.00')
  })

  test('edita un item existente', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await page.getByLabel('Nombre *').clear()
    await page.getByLabel('Nombre *').fill('Hamburguesa Doble')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Hamburguesa Doble')).toBeVisible()
  })

  test('toggle de disponibilidad cambia el badge', async ({ page }) => {
    // Papas Fritas está disponible → clickear toggle → pasa a No disponible
    const papasRow = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Papas Fritas' })
    await papasRow.getByRole('button', { name: 'Disponible' }).click()
    await expect(papasRow.getByText('No disponible')).toBeVisible()
  })

  test('elimina un item con confirmación', async ({ page }) => {
    await page.getByRole('button', { name: 'Eliminar' }).first().click()
    // Aparece modal de confirmación
    await expect(page.getByText('¿Eliminar producto?')).toBeVisible()
    await page.getByRole('button', { name: 'Eliminar' }).last().click()
    // El item desaparece
    await expect(page.getByText('Hamburguesa Clásica')).not.toBeVisible()
  })

  test('cancela la eliminación', async ({ page }) => {
    await page.getByRole('button', { name: 'Eliminar' }).first().click()
    await expect(page.getByText('¿Eliminar producto?')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).last().click()
    await expect(page.getByText('Hamburguesa Clásica')).toBeVisible()
  })
})
