import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'
import { e2eLabel } from '../fixtures/testData'

test.describe('Ajustes regression', { tag: '@regression' }, () => {
  authenticatedBeforeEach()
  test.setTimeout(60_000)

  test('settings page renders profile sections', async ({ page }) => {
    await page.goto('/ajustes')

    await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Resumen de ajustes')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('Nombre para mostrar')).toBeVisible()
    await expect(page.getByLabel('Nombre completo legal')).toBeVisible()
  })

  test('save display name', async ({ page }) => {
    const displayName = `E2E ${e2eLabel()}`

    await page.goto('/ajustes')
    await page.getByLabel('Nombre para mostrar').fill(displayName)
    await page.getByRole('button', { name: 'Guardar nombre', exact: true }).click()

    await expect(page.getByText('Nombre actualizado correctamente')).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(page.getByLabel('Nombre para mostrar')).toHaveValue(displayName, { timeout: 15_000 })
  })
})
