import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'

const FINANZAS_SECTION_HUBS = [
  {
    hubPath: '/finanzas/credito',
    title: 'Crédito y pagos',
    leafNav: 'Ir a Tarjetas de Crédito',
    leafPath: '/finanzas/tarjetas-credito',
    createAction: 'Agregar tarjeta',
  },
  {
    hubPath: '/finanzas/cripto',
    title: 'Criptomonedas',
    leafNav: 'Ir a Cripto Wallet',
    leafPath: '/finanzas/cripto-wallet',
    createAction: 'Agregar wallet',
  },
  {
    hubPath: '/finanzas/ahorro',
    title: 'Ahorro e inflación',
    leafNav: 'Ir a CDTs',
    leafPath: '/finanzas/cdts',
    createAction: 'Agregar CDT',
  },
] as const

test.describe('Finanzas section hubs smoke', () => {
  authenticatedBeforeEach()

  test('credito, cripto and ahorro hubs render', async ({ page }) => {
    for (const section of FINANZAS_SECTION_HUBS) {
      await page.goto(section.hubPath)
      await expect(page.getByRole('heading', { name: section.title, level: 1 })).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByRole('button', { name: 'Volver a Finanzas' })).toBeVisible()
    }
  })

  test('navigate from section hub to leaf module create CTA', async ({ page }) => {
    for (const section of FINANZAS_SECTION_HUBS) {
      await page.goto(section.hubPath)
      await page.getByRole('button', { name: section.leafNav }).click()

      await expect(page).toHaveURL(new RegExp(`${section.leafPath}$`))
      await expect(page.getByRole('button', { name: section.createAction })).toBeVisible({
        timeout: 20_000,
      })
    }
  })
})
