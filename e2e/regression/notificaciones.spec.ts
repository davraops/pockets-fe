import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'
import { createE2eNotification } from '../fixtures/notifications'
import { e2eLabel } from '../fixtures/testData'

test.describe('Notificaciones regression', { tag: '@regression' }, () => {
  authenticatedBeforeEach()

  test('notifications page renders and marks item as read', async ({ page }) => {
    const label = e2eLabel()
    const title = `E2E Notif ${label}`
    const message = `Mensaje de prueba ${label}`

    await page.goto('/')
    await createE2eNotification(page, title, message)

    await page.goto('/notificaciones')
    await expect(page.getByRole('heading', { name: 'Notificaciones', level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('region', { name: 'Resumen de notificaciones' })).toBeVisible()

    const row = page.locator('.crud-inset-row').filter({
      has: page.getByRole('heading', { name: title, level: 3 }),
    })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await expect(row).toHaveClass(/crud-inset-row--unread/)

    await row.getByRole('button', { name: 'Marcar como leída' }).click()
    await expect(row).toHaveClass(/crud-inset-row--read/, { timeout: 15_000 })
    await expect(row.getByRole('button', { name: 'Marcar como no leída' })).toBeVisible()
  })
})
