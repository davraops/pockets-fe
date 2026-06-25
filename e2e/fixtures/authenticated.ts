import { test, type Page } from '@playwright/test'
import { hasE2ECredentials, loginViaUi } from './auth'

export async function ensureAuthenticated(page: Page): Promise<void> {
  if (!hasE2ECredentials()) {
    test.skip(true, 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated e2e tests')
  }
  await loginViaUi(page)
}

export function authenticatedBeforeEach(): void {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page)
  })
}
