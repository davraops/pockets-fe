import { defineConfig, devices } from '@playwright/test'
import { MOBILE_VIEWPORT } from './e2e/fixtures/mobile'
import { VISUAL_DESKTOP_VIEWPORT } from './e2e/fixtures/visual'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /e2e\/visual\//,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual-desktop',
      testDir: './e2e/visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: VISUAL_DESKTOP_VIEWPORT,
      },
    },
    {
      name: 'visual-mobile',
      testDir: './e2e/visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: MOBILE_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
