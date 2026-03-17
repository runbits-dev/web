import { test, expect } from '@playwright/test'
import { setAuthToken } from '../../helpers/auth'

test.describe('Dashboard — Configuración', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page, 'mock-token-restaurant')
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
  })

  test('muestra los datos del perfil en modo lectura', async ({ page }) => {
    await expect(page.getByText('Configuración')).toBeVisible()
    await expect(page.getByText('Carlos Pérez')).toBeVisible()
    await expect(page.getByText('owner@laburguesa.com')).toBeVisible()
    await expect(page.getByText('Dueño de restaurante')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible()
  })

  test('abre modo edición al clickear Editar', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByLabel('Nombre *')).toBeVisible()
    await expect(page.getByLabel('Teléfono')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })

  test('campos precargados con datos actuales', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByLabel('Nombre *')).toHaveValue('Carlos Pérez')
    await expect(page.getByLabel('Teléfono')).toHaveValue('+54 9 11 1234-5678')
  })

  test('guarda cambios y muestra feedback de éxito', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Nombre *').clear()
    await page.getByLabel('Nombre *').fill('Carlos Rodríguez')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Cambios guardados correctamente')).toBeVisible()
    await expect(page.getByText('Carlos Rodríguez')).toBeVisible()
    // Vuelve a modo lectura
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible()
  })

  test('validación: no permite guardar sin nombre', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Nombre *').clear()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('El nombre es obligatorio')).toBeVisible()
  })

  test('cancelar edición no guarda cambios', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Nombre *').clear()
    await page.getByLabel('Nombre *').fill('Nombre Temporal')
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByText('Carlos Pérez')).toBeVisible()
    await expect(page.getByText('Nombre Temporal')).not.toBeVisible()
  })

  test('email no es editable', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByText('(no editable)')).toBeVisible()
    // No hay input de email
    await expect(page.getByLabel('Email')).not.toBeVisible()
  })
})
