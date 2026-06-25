import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'
import { MOBILE_VIEWPORT } from '../fixtures/mobile'
import { e2eLabel } from '../fixtures/testData'

test.describe('Mobile critical paths', { tag: '@mobile' }, () => {
  test.use({ viewport: MOBILE_VIEWPORT })
  authenticatedBeforeEach()
  test.setTimeout(90_000)

  test('home launchers visible and Finanzas hub loads', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('navigation', { name: 'Navegación por secciones' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: 'Finanzas' })).toBeVisible()

    await page.getByRole('button', { name: 'Finanzas' }).click()
    await expect(page).toHaveURL(/\/finanzas$/)
    await expect(page.locator('.finanzas-dashboard')).toBeVisible({ timeout: 20_000 })
  })

  test('finanzas hub modules navigate to cuentas on mobile', async ({ page }) => {
    await page.goto('/finanzas')

    await expect(page.locator('.finanzas-dashboard')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('navigation', { name: 'Módulos de Finanzas' })).toBeVisible()

    await page.getByRole('button', { name: /Ir a Cuentas/i }).click()
    await expect(page).toHaveURL(/\/finanzas\/cuentas$/)
    await expect(page.getByRole('button', { name: 'Agregar cuenta bancaria' })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('transacciones list and create modal on mobile', async ({ page }) => {
    await page.goto('/finanzas/transacciones')

    await expect(page.getByRole('button', { name: 'Agregar transacción' })).toBeVisible({
      timeout: 20_000,
    })

    await page.getByRole('button', { name: 'Agregar transacción' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Transacción' })).toBeVisible()
    await expect(page.locator('#monto')).toBeVisible()
  })

  test('utilidades hub navigates to cuadernos on mobile', async ({ page }) => {
    await page.goto('/registros')

    await expect(page.getByRole('navigation', { name: 'Módulos de Utilidades' })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /Ir a Cuadernos/i }).click()
    await expect(page).toHaveURL(/\/registros\/cuadernos$/)
    await expect(page.getByRole('button', { name: 'Nuevo cuaderno' }).first()).toBeVisible({
      timeout: 20_000,
    })
  })

  test('mi-dia completes today routine on mobile', async ({ page }) => {
    const title = `Rutina mobile ${e2eLabel()}`

    await page.goto('/tiempo/rutinas')
    await page.getByRole('button', { name: 'Agregar rutina' }).first().click()
    await page.locator('#title').fill(title)
    await page.getByRole('button', { name: 'Crear rutina' }).click()
    await expect(page.getByRole('button', { name: new RegExp(`Ver rutina ${title}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.goto('/tiempo/mi-dia')
    await expect(page.getByRole('region', { name: 'Rutinas de hoy' })).toBeVisible({
      timeout: 15_000,
    })

    const completeButton = page.getByRole('button', {
      name: new RegExp(`Marcar ${title} como completada`),
    })
    await expect(completeButton).toBeVisible({ timeout: 15_000 })
    await completeButton.click()

    await expect(page.getByRole('button', { name: new RegExp(`${title} completada`) })).toBeVisible({
      timeout: 15_000,
    })
  })
})
