import { test, expect } from '@playwright/test'
import { hasE2ECredentials, loginViaUi } from '../fixtures/auth'
import { e2eLabel } from '../fixtures/testData'

test.describe('Tiempo smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')
    await loginViaUi(page)
  })

  test('metas module renders', async ({ page }) => {
    await page.goto('/tiempo/metas')

    await expect(page.getByRole('button', { name: 'Nueva meta' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('searchbox', { name: 'Buscar metas' })).toBeVisible()
  })

  test('valores module renders', async ({ page }) => {
    await page.goto('/tiempo/valores')

    await expect(page.getByRole('button', { name: 'Nuevo valor' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('tab', { name: 'Valores' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Creencias' })).toBeVisible()
  })

  test('create meta with task and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const goalTitle = `Meta ${label}`
    const taskTitle = `Tarea ${label}`

    await page.goto('/tiempo/metas')
    await page.getByRole('button', { name: 'Nueva meta' }).click()

    await expect(page.getByRole('heading', { name: 'Nueva meta' })).toBeVisible()
    await page.getByPlaceholder('Ej: Correr un maratón').fill(goalTitle)
    await page.getByPlaceholder('Nueva tarea').fill(taskTitle)
    await page.getByRole('button', { name: 'Agregar' }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()
    await page.getByRole('button', { name: 'Crear meta' }).click()

    await expect(page.getByRole('heading', { name: goalTitle, level: 2 })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('heading', { name: goalTitle, level: 2 })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('create valor and creencia with kind filters', async ({ page }) => {
    const label = e2eLabel()
    const valueTitle = `Valor ${label}`
    const beliefTitle = `Creencia ${label}`

    await page.goto('/tiempo/valores')

    await page.getByRole('button', { name: 'Nuevo valor' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo valor' })).toBeVisible()
    await page.getByPlaceholder('Ej: Honestidad').fill(valueTitle)
    await page.getByRole('button', { name: 'Crear', exact: true }).click()
    await expect(page.getByRole('article', { name: `Valor: ${valueTitle}` })).toBeVisible({
      timeout: 15_000,
    })

    await page.getByRole('button', { name: 'Nueva creencia' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva creencia' })).toBeVisible()
    await page.getByPlaceholder('Ej: El esfuerzo constante da resultados').fill(beliefTitle)
    await page.getByRole('button', { name: 'Crear', exact: true }).click()
    await expect(page.getByRole('article', { name: `Creencia: ${beliefTitle}` })).toBeVisible({
      timeout: 15_000,
    })

    await page.getByRole('tab', { name: 'Valores' }).click()
    await expect(page.getByRole('article', { name: `Valor: ${valueTitle}` })).toBeVisible()
    await expect(page.getByRole('article', { name: `Creencia: ${beliefTitle}` })).not.toBeVisible()

    await page.getByRole('tab', { name: 'Creencias' }).click()
    await expect(page.getByRole('article', { name: `Creencia: ${beliefTitle}` })).toBeVisible()
    await expect(page.getByRole('article', { name: `Valor: ${valueTitle}` })).not.toBeVisible()

    await page.reload()
    await page.getByRole('tab', { name: 'Todas' }).click()
    await expect(page.getByRole('article', { name: `Valor: ${valueTitle}` })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('article', { name: `Creencia: ${beliefTitle}` })).toBeVisible()
  })
})
