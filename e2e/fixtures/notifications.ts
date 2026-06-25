import type { Page } from '@playwright/test'

/** Creates a lifestyle notification via the authenticated session (dev proxy /api/lifestyle). */
export async function createE2eNotification(
  page: Page,
  title: string,
  message: string
): Promise<void> {
  await page.evaluate(
    async ({ title, message }) => {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/lifestyle/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: 'general',
          title,
          message,
          priority: 'normal',
        }),
      })

      const body = await response.text()
      if (!response.ok) {
        throw new Error(`createNotification failed: ${response.status} ${body}`)
      }
    },
    { title, message }
  )
}
