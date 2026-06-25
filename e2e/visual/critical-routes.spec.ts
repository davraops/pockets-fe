import { test } from '@playwright/test'
import { hasE2ECredentials } from '../fixtures/auth'
import { captureVisualSnapshot, gotoVisualRoute } from '../fixtures/visual'
import { VISUAL_ROUTES } from '../fixtures/visualRoutes'

/**
 * Visual regression for app routes. Baselines live under
 * `critical-routes.spec.ts-snapshots/`.
 *
 * Update baselines after intentional CSS changes:
 *   npm run test:e2e:visual:update
 */
test.describe('Visual regression — app routes', { tag: '@visual' }, () => {
  test.setTimeout(90_000)

  test.beforeEach(() => {
    const needsAuth = VISUAL_ROUTES.some(route => route.auth)
    if (needsAuth && !hasE2ECredentials()) {
      test.skip(true, 'Set E2E_USERNAME and E2E_PASSWORD for authenticated visual tests')
    }
  })

  for (const route of VISUAL_ROUTES) {
    test(route.id, async ({ page }) => {
      await gotoVisualRoute(page, route)
      await captureVisualSnapshot(page, route.id, {
        fullPage: route.fullPage ?? true,
        extraMaskSelectors: route.extraMaskSelectors,
      })
    })
  }
})
