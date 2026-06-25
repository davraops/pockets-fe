import { test, expect } from '@playwright/test'
import { hasE2ECredentials, loginViaUi } from '../fixtures/auth'
import { setupJudicialMocks, MOCK_JUDICIAL_SEARCH_RESPONSE } from '../fixtures/judicialMocks'

test.describe('Justicia smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')
    await setupJudicialMocks(page)
    await loginViaUi(page)
  })

  test('procesos judiciales page renders with mocked search results', async ({ page }) => {
    await page.goto('/justicia/procesos')

    await expect(page.getByRole('region', { name: 'Resumen de procesos' })).toBeVisible({
      timeout: 20_000,
    })

    const mockProcess = MOCK_JUDICIAL_SEARCH_RESPONSE.procesos[0]
    await expect(
      page.getByRole('heading', { name: mockProcess.llaveProceso, level: 3 })
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(mockProcess.despacho)).toBeVisible()
  })

  test('filters mocked judicial processes by search query', async ({ page }) => {
    await page.goto('/justicia/procesos')

    const mockProcess = MOCK_JUDICIAL_SEARCH_RESPONSE.procesos[0]
    await expect(
      page.getByRole('heading', { name: mockProcess.llaveProceso, level: 3 })
    ).toBeVisible({ timeout: 15_000 })

    await page.getByRole('searchbox', { name: 'Buscar procesos judiciales' }).fill('NO-MATCH-QUERY')
    await expect(
      page.getByRole('heading', { name: mockProcess.llaveProceso, level: 3 })
    ).not.toBeVisible()
    await expect(page.getByText('Ningún proceso coincide con el filtro')).toBeVisible()

    await page.getByRole('searchbox', { name: 'Buscar procesos judiciales' }).fill('E2E')
    await expect(
      page.getByRole('heading', { name: mockProcess.llaveProceso, level: 3 })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('opens process detail with mocked actuaciones', async ({ page }) => {
    await page.goto('/justicia/procesos')

    const mockProcess = MOCK_JUDICIAL_SEARCH_RESPONSE.procesos[0]
    await page.getByRole('heading', { name: mockProcess.llaveProceso, level: 3 }).click()

    await expect(page.getByRole('heading', { name: mockProcess.llaveProceso, level: 2 })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Auto admite demanda')).toBeVisible({ timeout: 15_000 })
  })
})
