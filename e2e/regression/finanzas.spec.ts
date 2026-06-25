import { test, expect, type Page } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'
import { e2eDaysAhead, e2eLabel, e2eToday } from '../fixtures/testData'

async function createBankAccount(page: Page, label: string): Promise<string> {
  const accountName = `Cuenta ${label}`
  const accountNumber = `${Date.now()}`.slice(-10)

  await page.goto('/finanzas/cuentas')
  await page.getByRole('button', { name: 'Agregar cuenta bancaria' }).click()
  await page.locator('#nombre').fill(accountName)
  await page.locator('#banco').selectOption('Bancolombia')
  await page.locator('#numeroCuenta').fill(accountNumber)
  await page.locator('#balanceInicial').fill('1000000')
  await page.locator('form').getByRole('button', { name: 'Agregar' }).click()

  await expect(
    page.getByRole('button', { name: new RegExp(`Ver cuenta ${accountName}`) })
  ).toBeVisible({ timeout: 15_000 })

  return accountName
}

async function createDebitCard(page: Page, label: string, accountName: string): Promise<string> {
  const cardName = `Debito ${label}`
  const lastFour = `${Date.now()}`.slice(-4)

  await page.goto('/finanzas/tarjetas-debito')
  await page.getByRole('button', { name: 'Agregar tarjeta' }).click()
  await expect(page.getByRole('heading', { name: 'Nueva Tarjeta de Débito' })).toBeVisible()

  await page.locator('#nombre').fill(cardName)
  const accountOption = page.locator('#cuentaId option').filter({ hasText: accountName })
  await expect(accountOption).toHaveCount(1, { timeout: 15_000 })
  const accountId = await accountOption.getAttribute('value')
  await page.locator('#cuentaId').selectOption(accountId!)
  await page.locator('#ultimos4Digitos').fill(lastFour)
  await page.locator('#fechaVencimiento').fill('12/2028')
  await page.locator('form.modal-form').getByRole('button', { name: 'Agregar', exact: true }).click()

  const cardRow = page.getByRole('button', { name: new RegExp(`Ver detalles de ${cardName}`) })
  await expect(cardRow).toBeVisible({ timeout: 15_000 })

  return cardName
}

test.describe('Finanzas regression', { tag: '@regression' }, () => {
  authenticatedBeforeEach()
  test.setTimeout(90_000)

  test('create presupuesto and edit name', async ({ page }) => {
    const label = e2eLabel()
    const budgetName = `Presupuesto ${label}`
    const updatedName = `${budgetName} editado`

    await page.goto('/finanzas/presupuestos')
    await page.getByRole('button', { name: 'Agregar presupuesto' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo Presupuesto' })).toBeVisible()

    await page.locator('#nombre').fill(budgetName)
    await page.locator('#periodicidad').selectOption('mensual')
    await page.locator('#montoMaximo').fill('500000')
    await page.locator('form').getByRole('button', { name: 'Agregar' }).click()

    const budgetRow = page.getByRole('button', { name: new RegExp(`Ver detalles de presupuesto ${budgetName}`) })
    await expect(budgetRow).toBeVisible({ timeout: 15_000 })

    await budgetRow.click()
    await page.getByRole('button', { name: 'Editar presupuesto' }).click()
    await page.locator('#edit-nombre').fill(updatedName)
    await page.locator('form.modal-form').getByRole('button', { name: 'Guardar Cambios' }).click()

    await expect(
      page.getByRole('button', { name: new RegExp(`Ver detalles de presupuesto ${updatedName}`) })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('create deuda and edit concepto', async ({ page }) => {
    const label = e2eLabel()
    const concept = `Deuda ${label}`
    const updatedConcept = `${concept} editada`

    await page.goto('/finanzas/deudas')
    await page.getByRole('button', { name: 'Agregar deuda' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Deuda' })).toBeVisible()

    await page.locator('#concepto').fill(concept)
    await page.locator('#divisa').selectOption('COP')
    await page.locator('#valor').fill('1000000')
    await page.locator('#adeudado').fill('800000')
    await page.locator('#fechaCorte').fill(e2eToday())
    await page.locator('form').getByRole('button', { name: 'Agregar' }).click()

    const debtRow = page.getByRole('button', { name: new RegExp(`Ver detalles de deuda ${concept}`) })
    await expect(debtRow).toBeVisible({ timeout: 15_000 })

    await debtRow.click()
    await page.getByRole('button', { name: 'Editar deuda' }).click()
    await page.locator('#edit-concepto').fill(updatedConcept)
    await page.locator('#edit-fechaCorte').fill(e2eToday())
    await page.locator('form.modal-form').getByRole('button', { name: 'Guardar Cambios' }).click()

    await expect(
      page.getByRole('button', { name: new RegExp(`Ver detalles de deuda ${updatedConcept}`) })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('create tarjeta de crédito and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const cardName = `Tarjeta ${label}`
    const bank = 'Bancolombia'

    await page.goto('/finanzas/tarjetas-credito')
    await page.getByRole('button', { name: 'Agregar tarjeta' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Tarjeta de Crédito' })).toBeVisible()

    await page.locator('#nombre').fill(cardName)
    await page.locator('#banco').selectOption(bank)
    await page.locator('#cupo').fill('5000000')
    await page.locator('#tasaMensual').fill('2.5')
    await page.locator('form.modal-form').first().getByRole('button', { name: 'Agregar' }).click()

    const cardRow = page.getByRole('button', {
      name: new RegExp(`Ver detalles de tarjeta ${cardName} de ${bank}`),
    })
    await expect(cardRow).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(cardRow).toBeVisible({ timeout: 15_000 })
  })

  test('create deudor in me deben and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const debtorName = `Deudor ${label}`
    const concept = `Préstamo ${label}`

    await page.goto('/finanzas/me-deben')
    await page.getByRole('button', { name: 'Agregar deudor' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo Deudor' })).toBeVisible()

    await page.locator('#nombreDeudor').fill(debtorName)
    await page.locator('#concepto').fill(concept)
    await page.locator('#valor').fill('250000')
    await page.locator('form.modal-form').getByRole('button', { name: 'Agregar' }).click()

    const debtorRow = page.getByRole('button', {
      name: new RegExp(`Ver detalles de ${debtorName}`),
    })
    await expect(debtorRow).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(debtorRow).toBeVisible({ timeout: 15_000 })
  })

  test('create CDT and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const cdtName = `CDT ${label}`

    await page.goto('/finanzas/cdts')
    await page.getByRole('button', { name: 'Agregar CDT' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo CDT' })).toBeVisible()

    await page.locator('#nombre').fill(cdtName)
    await page.locator('#valor').fill('10000000')
    await page.locator('#tasa').fill('10')
    await page.locator('#fechaRetiro').fill(e2eDaysAhead(90))
    await page.locator('form.modal-form').getByRole('button', { name: 'Guardar' }).click()

    const cdtRow = page.getByRole('button', {
      name: new RegExp(`Ver detalles de ${cdtName}`),
    })
    await expect(cdtRow).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(cdtRow).toBeVisible({ timeout: 15_000 })
  })

  test('create crypto wallet and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const walletName = `Wallet ${label}`
    const address = `1E2E${label.replace(/\s+/g, '')}TestAddress00000001`

    await page.goto('/finanzas/cripto-wallet')
    await page.getByRole('button', { name: 'Agregar wallet' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Wallet' })).toBeVisible()

    await page.locator('#wallet_name').fill(walletName)
    await page.locator('#crypto_name').fill('Bitcoin')
    await page.locator('#address').fill(address)
    await page.locator('form.modal-form').getByRole('button', { name: 'Crear' }).click()

    const walletRow = page.getByRole('button', {
      name: new RegExp(`Ver detalles de ${walletName}`),
    })
    await expect(walletRow).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(walletRow).toBeVisible({ timeout: 15_000 })
  })

  test('create proyecto de ahorro and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const projectName = `Proyecto ${label}`

    await page.goto('/finanzas/proyectos')
    await page.getByRole('button', { name: 'Agregar proyecto' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo Proyecto de Ahorro' })).toBeVisible()

    await page.locator('#nombre').fill(projectName)
    await page.locator('#montoObjetivo').fill('5000001')
    await page.locator('#montoActual').fill('0')
    await page.locator('#duracionMeses').fill('6')
    await page.locator('#fechaInicio').fill(e2eToday())
    await page.locator('#fechaFin').fill(e2eDaysAhead(180))
    await page.locator('#nombre').click()

    const submitButton = page
      .locator('.modal-overlay')
      .filter({ has: page.getByRole('heading', { name: 'Nuevo Proyecto de Ahorro' }) })
      .getByRole('button', { name: 'Agregar', exact: true })

    const createResponse = page.waitForResponse(
      response =>
        response.url().includes('/projects/with-budget') && response.request().method() === 'POST',
      { timeout: 20_000 }
    )
    await submitButton.click()
    const response = await createResponse
    expect(response.ok(), `create project failed: ${response.status()} ${await response.text()}`).toBeTruthy()
    await expect(page.getByRole('heading', { name: 'Nuevo Proyecto de Ahorro' })).not.toBeVisible({
      timeout: 15_000,
    })

    const projectRow = page.getByRole('button', {
      name: new RegExp(`Ver detalles de ${projectName}`),
    })
    await expect(projectRow).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(projectRow).toBeVisible({ timeout: 15_000 })
  })

  test('create tarjeta de débito and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const accountName = await createBankAccount(page, label)
    const cardName = await createDebitCard(page, label, accountName)

    await page.reload()
    await expect(
      page.getByRole('button', { name: new RegExp(`Ver detalles de ${cardName}`) })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('create subscripción linked to debit card and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const subscriptionName = `Sub ${label}`
    const accountName = await createBankAccount(page, label)
    const cardName = await createDebitCard(page, label, accountName)

    await page.goto('/finanzas/subscripciones')
    await page.getByRole('button', { name: 'Agregar subscripción' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Subscripción' })).toBeVisible()

    await page.locator('#nombre').fill(subscriptionName)
    await page.locator('#precio').fill('29900')
    await page.locator('#fechaCorte').fill(e2eDaysAhead(15))
    const cardOption = page.locator('#tarjetaId option').filter({ hasText: cardName })
    await expect(cardOption).toHaveCount(1, { timeout: 15_000 })
    const cardId = await cardOption.getAttribute('value')
    await page.locator('#tarjetaId').selectOption(cardId!)
    await page.locator('form.modal-form').getByRole('button', { name: 'Agregar' }).click()

    const subscriptionRow = page.getByRole('button', {
      name: new RegExp(`Ver detalles de ${subscriptionName}`),
    })
    await expect(subscriptionRow).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(subscriptionRow).toBeVisible({ timeout: 15_000 })
  })
})
