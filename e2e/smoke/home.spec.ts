import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'

const HOME_LAUNCHERS = [
  'Finanzas',
  'Utilidades',
  'Lifestyle',
  'Justicia',
  'Trabajo',
  'Ajustes',
] as const

test.describe('Home smoke', () => {
  authenticatedBeforeEach()

  test('section launchers are visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Pockets.*Inicio/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('navigation', { name: 'Navegación por secciones' })).toBeVisible()

    for (const launcher of HOME_LAUNCHERS) {
      await expect(page.getByRole('button', { name: launcher })).toBeVisible()
    }
  })

  test('launcher navigates to Finanzas and Lifestyle hubs', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Finanzas' }).click()
    await expect(page).toHaveURL(/\/finanzas$/)
    await expect(page.locator('.finanzas-dashboard')).toBeVisible({ timeout: 20_000 })

    await page.goto('/')
    await page.getByRole('button', { name: 'Lifestyle' }).click()
    await expect(page).toHaveURL(/\/tiempo$/)
    await expect(page.locator('.tiempo-dashboard')).toBeVisible({ timeout: 20_000 })
  })
})
