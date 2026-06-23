import { test, expect } from '@playwright/test'
import { hasE2ECredentials, loginViaUi } from '../fixtures/auth'

const uniqueSuffix = () => Date.now().toString(36)

test.describe('Registros smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')
    await loginViaUi(page)
  })

  test('hub loads and lists utilidades sections', async ({ page }) => {
    await page.goto('/registros')

    await expect(page.getByRole('heading', { name: 'Utilidades' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Cuadernos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Secretos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Calculadora' })).toBeVisible()
  })

  test('cuadernos and secretos modules render', async ({ page }) => {
    await page.goto('/registros/cuadernos')
    await expect(page.getByRole('button', { name: 'Agregar nota' })).toBeVisible({
      timeout: 20_000,
    })

    await page.goto('/registros/secretos')
    await expect(page.getByRole('button', { name: 'Agregar secreto' })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('calculadora renders and accepts input', async ({ page }) => {
    await page.goto('/registros/calculadora')

    await expect(page.getByRole('heading', { name: 'Calculadora' })).toBeVisible()
    await page.getByRole('button', { name: '7' }).click()
    await page.getByRole('button', { name: '8' }).click()
    await expect(page.locator('.calculadora-display-value')).toHaveText('78')
  })

  test('create nota and secreto', async ({ page }) => {
    const label = `E2E ${uniqueSuffix()}`
    const noteTitle = `Nota ${label}`
    const secretTitle = `Secreto ${label}`

    await page.goto('/registros/cuadernos')
    await page.getByRole('button', { name: 'Agregar nota' }).click()
    await page.locator('#titulo').fill(noteTitle)
    await page.locator('#contenido').fill(`Contenido ${label}`)
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('button', { name: `Ver nota ${noteTitle}` })).toBeVisible({
      timeout: 15_000,
    })

    await page.goto('/registros/secretos')
    await page.getByRole('button', { name: 'Agregar secreto' }).click()
    await page.locator('#titulo').fill(secretTitle)
    await page.locator('#valor').fill(`valor-${label}`)
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('button', { name: `Ver secreto ${secretTitle}` })).toBeVisible({
      timeout: 15_000,
    })
  })
})
