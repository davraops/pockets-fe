import { test, expect } from '@playwright/test'
import { e2ePassword, e2eUsername, hasE2ECredentials, loginViaUi } from '../fixtures/auth'

test.describe('Auth smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /Pockets/i })).toBeVisible()
    await expect(page.locator('#username')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /Iniciar sesión/i })).toBeVisible()
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/finanzas')

    await expect(page).toHaveURL(/\/login/)
  })

  test('successful login lands on home', async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')

    await loginViaUi(page)

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: /Pockets.*Inicio/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: 'Finanzas' })).toBeVisible()
  })

  test('deep link returns to protected route after login', async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')

    await page.goto('/finanzas')
    await expect(page).toHaveURL(/\/login/)

    await page.locator('#username').fill(e2eUsername())
    await page.locator('#password').fill(e2ePassword())
    await page.getByRole('button', { name: /Iniciar sesión/i }).click()

    await expect(page).toHaveURL(/\/finanzas$/, { timeout: 15_000 })
    await expect(page.locator('.finanzas-dashboard')).toBeVisible({ timeout: 20_000 })
  })

  test('logout from home and re-login', async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')

    await loginViaUi(page)
    await page.goto('/')

    await page.getByRole('button', { name: 'Salir. Cerrar sesión' }).click()

    const confirmDialog = page.getByRole('dialog').filter({
      has: page.getByText('¿Cerrar sesión en Pockets?'),
    })
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Salir', exact: true }).click()

    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 })
    await expect(page.locator('#username')).toBeVisible()

    await page.locator('#username').fill(e2eUsername())
    await page.locator('#password').fill(e2ePassword())
    await page.getByRole('button', { name: /Iniciar sesión/i }).click()

    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /Pockets.*Inicio/i })).toBeVisible({
      timeout: 15_000,
    })
  })
})
