import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'
import { e2eLabel } from '../fixtures/testData'

test.describe('Trabajo regression', { tag: '@regression' }, () => {
  authenticatedBeforeEach()
  test.setTimeout(90_000)

  test('hub loads trabajo modules', async ({ page }) => {
    await page.goto('/trabajo')

    await expect(page.locator('.trabajo-dashboard')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Ir a Contratos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Actividades' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a Procesos' })).toBeVisible()
  })

  test('create contract then activity on kanban', async ({ page }) => {
    const label = e2eLabel()
    const contractName = `Contrato ${label}`
    const clientName = `Cliente ${label}`
    const activityName = `Actividad ${label}`

    await page.goto('/trabajo/contratos')
    await page.getByRole('button', { name: 'Crear contrato' }).click()
    await expect(page.getByRole('heading', { name: 'Crear Contrato' })).toBeVisible()

    await page.locator('#name').fill(contractName)
    await page.locator('#clientName').fill(clientName)
    await page.getByRole('button', { name: 'Guardar Contrato' }).click()

    await expect(page.getByRole('button', { name: new RegExp(`Editar contrato ${contractName}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.goto('/trabajo/actividades')
    await page.getByRole('button', { name: 'Crear actividad' }).click()
    await expect(page.getByRole('heading', { name: 'Crear Actividad' })).toBeVisible()

    await page.locator('#name').fill(activityName)
    await page.locator('#client').selectOption({ label: clientName })
    await page.getByRole('button', { name: 'Guardar Actividad' }).click()

    await expect(page.getByRole('button', { name: new RegExp(`Abrir ${activityName}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('button', { name: new RegExp(`Abrir ${activityName}`) })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('move activity card to in progress on kanban', async ({ page }) => {
    const label = e2eLabel()
    const contractName = `Contrato ${label}`
    const clientName = `Cliente ${label}`
    const activityName = `Actividad ${label}`

    await page.goto('/trabajo/contratos')
    await page.getByRole('button', { name: 'Crear contrato' }).click()
    await page.locator('#name').fill(contractName)
    await page.locator('#clientName').fill(clientName)
    await page.getByRole('button', { name: 'Guardar Contrato' }).click()
    await expect(page.getByRole('button', { name: new RegExp(`Editar contrato ${contractName}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.goto('/trabajo/actividades')
    await page.getByRole('button', { name: 'Crear actividad' }).click()
    await page.locator('#name').fill(activityName)
    await page.locator('#client').selectOption({ label: clientName })
    await page.getByRole('button', { name: 'Guardar Actividad' }).click()
    await expect(page.getByRole('button', { name: new RegExp(`Abrir ${activityName}`) })).toBeVisible({
      timeout: 15_000,
    })

    await expect(page.getByRole('region', { name: 'Tablero kanban de actividades' })).toBeVisible()

    const card = page.locator('article.actividad-kanban-card').filter({ hasText: activityName })
    const inProgressColumn = page.locator('section.actividad-kanban-column').filter({
      has: page.getByRole('heading', { name: 'En progreso', level: 2 }),
    })

    await card.dragTo(inProgressColumn)
    await expect(inProgressColumn.locator('article.actividad-kanban-card').filter({ hasText: activityName })).toBeVisible({
      timeout: 15_000,
    })
    await expect(card.getByText(/en progreso/i)).toBeVisible({ timeout: 15_000 })
  })

  test('close hiring process with closure modal', async ({ page }) => {
    const label = e2eLabel()
    const processName = `Proceso ${label}`
    const companyName = `Empresa ${label}`

    await page.goto('/trabajo/procesos')
    await page.getByRole('button', { name: 'Opciones' }).click()
    await page.getByRole('button', { name: 'Nuevo proceso' }).click()
    await page.locator('#name').fill(processName)
    await page.locator('#company').fill(companyName)
    await page.getByRole('button', { name: 'Crear Proceso' }).click()

    const processHeading = page.getByRole('heading', { name: processName, level: 3 })
    await expect(processHeading).toBeVisible({ timeout: 15_000 })

    await processHeading.click()
    await page.getByRole('button', { name: 'Cerrar proceso' }).click()

    const closeModal = page.locator('.modal-panel.proceso-contratacion-close-modal')
    await expect(closeModal.getByRole('heading', { name: 'Cerrar proceso' })).toBeVisible()
    await closeModal.getByRole('button', { name: 'Confirmar cierre' }).click()

    await expect(page.getByText('Proceso cerrado con motivo registrado')).toBeVisible({
      timeout: 15_000,
    })
    await expect(processHeading).not.toBeVisible({ timeout: 15_000 })

    await page.getByRole('tab', { name: 'Motivos de cierre' }).click()
    await expect(page.getByText(processName)).toBeVisible({ timeout: 15_000 })
  })
})
