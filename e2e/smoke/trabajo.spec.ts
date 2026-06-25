import { test, expect } from '@playwright/test'
import { hasE2ECredentials, loginViaUi } from '../fixtures/auth'
import { e2eLabel } from '../fixtures/testData'

test.describe('Trabajo smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')
    await loginViaUi(page)
  })

  test('procesos de contratación pipeline renders', async ({ page }) => {
    await page.goto('/trabajo/procesos')

    await expect(page.getByRole('region', { name: 'Resumen de procesos de contratación' })).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByRole('tab', { name: 'Pipeline' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Motivos de cierre' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Agenda' })).toBeVisible()
  })

  test('create hiring process with minimal fields', async ({ page }) => {
    const label = e2eLabel()
    const processName = `Proceso ${label}`
    const companyName = `Empresa ${label}`

    await page.goto('/trabajo/procesos')
    await page.getByRole('button', { name: 'Opciones' }).click()
    await page.getByRole('button', { name: 'Nuevo proceso' }).click()

    await expect(page.getByRole('heading', { name: 'Nuevo Proceso de Contratación' })).toBeVisible()
    await page.locator('#name').fill(processName)
    await page.locator('#company').fill(companyName)
    await page.getByRole('button', { name: 'Crear Proceso' }).click()

    await expect(page.getByRole('heading', { name: processName, level: 3 })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('heading', { name: processName, level: 3 })).toBeVisible({
      timeout: 15_000,
    })
  })
})
