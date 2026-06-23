import { test, expect } from '@playwright/test'

test.describe('Auth smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /Pockets/i })).toBeVisible()
    await expect(page.locator('#username')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible()
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/finanzas')

    await expect(page).toHaveURL(/\/login/)
  })
})
