import { expect, type Page } from '@playwright/test'

export function hasE2ECredentials(): boolean {
  return Boolean(process.env.E2E_USERNAME && process.env.E2E_PASSWORD)
}

export async function loginViaUi(page: Page): Promise<void> {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD

  if (!username || !password) {
    throw new Error('E2E_USERNAME and E2E_PASSWORD are required for authenticated tests')
  }

  await page.goto('/login')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 })
}
