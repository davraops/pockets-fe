import { test, expect } from '@playwright/test'
import { hasE2ECredentials, loginViaUi } from '../fixtures/auth'

const uniqueSuffix = () => Date.now().toString(36)

test.describe('Finanzas smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')
    await loginViaUi(page)
  })

  test('hub loads and shows financial summary', async ({ page }) => {
    await page.goto('/finanzas')

    await expect(page.locator('.finanzas-dashboard')).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByRole('group', { name: 'Acciones rápidas' }).getByRole('button', { name: 'Transacción' })).toBeVisible()
  })

  test('core modules render after navigation', async ({ page }) => {
    const routes = [
      { path: '/finanzas/cuentas', action: 'Agregar cuenta bancaria' },
      { path: '/finanzas/presupuestos', action: 'Agregar presupuesto' },
      { path: '/finanzas/deudas', action: 'Agregar deuda' },
      { path: '/finanzas/transacciones', action: 'Agregar transacción' },
    ] as const

    for (const route of routes) {
      await page.goto(route.path)
      await expect(page.getByRole('button', { name: route.action })).toBeVisible({
        timeout: 20_000,
      })
    }
  })

  test('create cuenta, transacción and edit transacción', async ({ page }) => {
    const label = `E2E ${uniqueSuffix()}`
    const accountName = `Cuenta ${label}`
    const accountNumber = `${Date.now()}`.slice(-10)
    const updatedDescription = `${label} editada`

    await page.goto('/finanzas/cuentas')
    await page.getByRole('button', { name: 'Agregar cuenta bancaria' }).click()
    await page.locator('#nombre').fill(accountName)
    await page.locator('#banco').selectOption('Bancolombia')
    await page.locator('#numeroCuenta').fill(accountNumber)
    await page.locator('#balanceInicial').fill('1000000')
    await page.locator('form').getByRole('button', { name: 'Agregar' }).click()

    await expect(
      page.getByRole('button', { name: new RegExp(`Ver cuenta ${accountName}`) })
    ).toBeVisible({
      timeout: 15_000,
    })

    await page.goto('/finanzas/transacciones')
    await page.getByRole('button', { name: 'Agregar transacción' }).click()
    await page.locator('#descripcion').fill(label)
    await page.locator('#categoria').fill('E2E')
    await page.locator('#monto').fill('50000')

    const accountOption = page.locator('#cuentaBancariaId option').filter({ hasText: accountName })
    await expect(accountOption).toHaveCount(1, { timeout: 15_000 })
    const accountId = await accountOption.getAttribute('value')
    await page.locator('#cuentaBancariaId').selectOption(accountId!)
    await page.locator('form').getByRole('button', { name: 'Agregar' }).click()

    const transactionRow = page.getByRole('button', { name: new RegExp(`Ver detalles de transacción ${label}`) })

    await expect(transactionRow).toBeVisible({
      timeout: 15_000,
    })

    await transactionRow.click()
    await page.getByRole('button', { name: 'Editar transacción' }).click()
    await expect(page.getByRole('heading', { name: 'Editar Transacción' })).toBeVisible()

    const today = new Date().toISOString().slice(0, 10)
    await page.getByLabel('Fecha').fill(today)

    const descriptionField = page.getByRole('textbox', { name: 'Descripción' })
    await descriptionField.fill(updatedDescription)

    await page.getByRole('button', { name: 'Guardar Cambios' }).click()

    await expect(page.getByRole('heading', { name: 'Editar Transacción' })).not.toBeVisible({
      timeout: 15_000,
    })
    await expect(
      page.getByRole('button', { name: new RegExp(`Ver detalles de transacción ${updatedDescription}`) })
    ).toBeVisible({
      timeout: 15_000,
    })
  })
})
