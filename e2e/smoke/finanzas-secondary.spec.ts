import { test, expect } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'

const CRUD_SECONDARY_MODULES = [
  { path: '/finanzas/proyectos', action: 'Agregar proyecto' },
  { path: '/finanzas/subscripciones', action: 'Agregar subscripción' },
  { path: '/finanzas/tarjetas-debito', action: 'Agregar tarjeta' },
  { path: '/finanzas/listas-mercado', action: 'Agregar producto' },
  { path: '/finanzas/cripto-transacciones', action: 'Agregar transacción' },
] as const

test.describe('Finanzas secondary modules smoke', () => {
  authenticatedBeforeEach()

  test('secondary CRUD modules render create CTA', async ({ page }) => {
    for (const module of CRUD_SECONDARY_MODULES) {
      await page.goto(module.path)
      await expect(page.getByRole('button', { name: module.action })).toBeVisible({
        timeout: 20_000,
      })
    }
  })

  test('inflacion calculator renders with devaluation result', async ({ page }) => {
    await page.goto('/finanzas/inflacion')

    await expect(page.getByRole('heading', { name: 'Inflación', level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.locator('#amount')).toBeVisible()
    await expect(page.locator('#years')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Resultado de devaluación' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Proyección de inflación' })).toBeVisible()
  })

  test('diseñador presupuestos and crypto vendors inline forms render', async ({ page }) => {
    await page.goto('/finanzas/diseñador-presupuestos')
    await expect(
      page.getByRole('heading', { name: 'Diseñador de Presupuestos', level: 1 })
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Agregar Item' })).toBeVisible()
    await expect(page.locator('#name')).toBeVisible()

    await page.goto('/finanzas/crypto-vendors')
    await expect(page.getByRole('heading', { name: 'Vendedores de Cripto', level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('heading', { name: 'Agregar Vendedor' })).toBeVisible()
    await expect(page.locator('#name')).toBeVisible()
  })
})
