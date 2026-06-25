import { expect, type Page } from '@playwright/test'

/** Local dev defaults — see e2e/README.md and `create-test-user.js` in pockets. */
const DEFAULT_E2E_USERNAME = 'e2e'
const DEFAULT_E2E_PASSWORD = '123qweZ!'

export function e2eUsername(): string {
  return process.env.E2E_USERNAME ?? DEFAULT_E2E_USERNAME
}

export function e2ePassword(): string {
  return process.env.E2E_PASSWORD ?? DEFAULT_E2E_PASSWORD
}

export function hasE2ECredentials(): boolean {
  return Boolean(e2eUsername() && e2ePassword())
}

export async function loginViaUi(page: Page): Promise<void> {
  const username = e2eUsername()
  const password = e2ePassword()

  if (!username || !password) {
    throw new Error('E2E_USERNAME and E2E_PASSWORD are required for authenticated tests')
  }

  await page.goto('/login')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /Iniciar sesión/i }).click()

  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 })
}
