import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'
import { e2eLabel, e2eToday, e2eYesterday } from '../fixtures/testData'

test.describe('Tiempo regression', { tag: '@regression' }, () => {
  authenticatedBeforeEach()
  test.setTimeout(90_000)

  test('hub loads lifestyle modules', async ({ page }) => {
    await page.goto('/tiempo')

    await expect(page.locator('.tiempo-dashboard')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Ir a Fechas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Rutinas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Mi Diario' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Mi Día' })).toBeVisible()
  })

  test('create calendar event and persist after reload', async ({ page }) => {
    const title = `Evento ${e2eLabel()}`
    const eventDate = e2eToday()

    await page.goto('/tiempo/fechas')
    const eventDialog = page.getByRole('dialog', { name: 'Nuevo evento' })
    await page.getByRole('button', { name: 'Agregar evento' }).click()
    await expect(eventDialog.getByRole('heading', { name: 'Nuevo evento' })).toBeVisible()

    await eventDialog.locator('#titulo').fill(title)
    await eventDialog.locator('#fecha').fill(eventDate)
    await eventDialog.getByRole('checkbox', { name: 'Todo el día' }).check()
    await eventDialog.locator('form.fechas-modal-form').evaluate(form => form.requestSubmit())

    await expect(page.getByText('Evento creado exitosamente')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: new RegExp(`Ver evento ${title}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('button', { name: new RegExp(`Ver evento ${title}`) })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('create daily routine and persist after reload', async ({ page }) => {
    const title = `Rutina ${e2eLabel()}`

    await page.goto('/tiempo/rutinas')
    await page.getByRole('button', { name: 'Agregar rutina' }).first().click()
    await expect(page.getByRole('heading', { name: 'Nueva rutina' })).toBeVisible()

    await page.locator('#title').fill(title)
    await page.getByRole('button', { name: 'Crear rutina' }).click()

    await expect(page.getByRole('button', { name: new RegExp(`Ver rutina ${title}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('button', { name: new RegExp(`Ver rutina ${title}`) })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('complete today routine from Mi Día', async ({ page }) => {
    const title = `Rutina día ${e2eLabel()}`

    await page.goto('/tiempo/rutinas')
    await page.getByRole('button', { name: 'Agregar rutina' }).first().click()
    await page.locator('#title').fill(title)
    await page.getByRole('button', { name: 'Crear rutina' }).click()
    await expect(page.getByRole('button', { name: new RegExp(`Ver rutina ${title}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.goto('/tiempo/mi-dia')
    await expect(page.getByRole('region', { name: 'Rutinas de hoy' })).toBeVisible({ timeout: 15_000 })

    const completeButton = page.getByRole('button', { name: new RegExp(`Marcar ${title} como completada`) })
    await expect(completeButton).toBeVisible({ timeout: 15_000 })
    await completeButton.click()

    await expect(page.getByRole('button', { name: new RegExp(`${title} completada`) })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('create diary entry and persist after reload', async ({ page }) => {
    const content = `Entrada ${e2eLabel()} — reflexión del día.`
    const entryDate = e2eYesterday()

    await page.goto('/tiempo/mi-diario')
    await page.getByRole('button', { name: 'Nueva entrada' }).first().click()
    await expect(page.getByRole('heading', { name: 'Nueva entrada' })).toBeVisible()

    await page.locator('#entry_date').fill(entryDate)
    await page.locator('#content').fill(content)
    await page.getByRole('button', { name: 'Crear entrada' }).click()

    await expect(page.getByText('Entrada de diario creada exitosamente')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: /Ver entrada del/ })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('button', { name: /Ver entrada del/ })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('delete routine with confirm dialog', async ({ page }) => {
    const title = `Rutina ${e2eLabel()}`

    await page.goto('/tiempo/rutinas')
    await page.getByRole('button', { name: 'Agregar rutina' }).first().click()
    await page.locator('#title').fill(title)
    await page.getByRole('button', { name: 'Crear rutina' }).click()

    const routineRow = page.getByRole('button', { name: new RegExp(`Ver rutina ${title}`) })
    await expect(routineRow).toBeVisible({ timeout: 15_000 })
    await routineRow.click()

    const detailDialog = page.getByRole('dialog', { name: title })
    await expect(detailDialog.getByRole('heading', { name: title, level: 2 })).toBeVisible()
    await detailDialog.getByRole('button', { name: 'Eliminar' }).click()

    const confirmDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Confirmar eliminación' }),
    })
    await expect(confirmDialog.getByText(/eliminar esta rutina/i)).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Eliminar', exact: true }).click()

    await expect(routineRow).not.toBeVisible({ timeout: 15_000 })
  })

  test('delete meta with confirm dialog', async ({ page }) => {
    const label = e2eLabel()
    const goalTitle = `Meta ${label}`

    await page.goto('/tiempo/metas')
    await page.getByRole('button', { name: 'Nueva meta' }).click()
    await page.getByPlaceholder('Ej: Correr un maratón').fill(goalTitle)
    await page.getByRole('button', { name: 'Crear meta' }).click()

    const goalHeading = page.getByRole('heading', { name: goalTitle, level: 2 })
    await expect(goalHeading).toBeVisible({ timeout: 15_000 })

    const goalCard = page.locator('.metas-goal-card').filter({ has: goalHeading })
    await goalCard.getByRole('button', { name: 'Eliminar meta' }).click()

    const confirmDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Eliminar meta' }),
    })
    await expect(confirmDialog.getByText(new RegExp(goalTitle))).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Eliminar', exact: true }).click()

    await expect(goalHeading).not.toBeVisible({ timeout: 15_000 })
  })
})
