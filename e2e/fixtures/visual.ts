import { expect, type Locator, type Page } from '@playwright/test'
import { loginViaUi } from './auth'

/** Desktop viewport for layout review (not full HD — matches typical laptop). */
export const VISUAL_DESKTOP_VIEWPORT = { width: 1280, height: 900 } as const

export interface VisualRoute {
  /** Stable snapshot file stem, e.g. `home`. */
  id: string
  path: string
  auth: boolean
  /** Capture scrollable page; disable for tall dashboards with live polling. */
  fullPage?: boolean
  /** Mask regions with live API data (balances, lists) so layout CSS stays testable. */
  extraMaskSelectors?: string[]
  /** Optional setup (e.g. API mocks) before navigation. */
  setupBefore?: (page: Page) => Promise<void>
  ready: (page: Page) => Promise<void>
}

/** Elements that change every second/day or depend on live notification counts. */
export function visualMaskLocators(page: Page, extraSelectors: string[] = []): Locator[] {
  const dynamic = [
    page.locator('.status-bar-date'),
    page.locator('.status-bar-time'),
    page.locator('.status-bar-notification-badge'),
    page.locator('.footer-status-date'),
    page.locator('.footer-status-time'),
    page.locator('.footer-status-notification-badge'),
    page.locator('.footer-status-center'),
    page.locator('.hub-home-header-date'),
    page.locator('.finanzas-hub-meta'),
    page.locator('.tiempo-hub-meta'),
  ]

  const extra = extraSelectors.map(selector => page.locator(selector))
  return [...dynamic, ...extra]
}

/** Wait until spinners / skeleton loaders are gone before capturing layout. */
export async function waitForStableLayout(page: Page): Promise<void> {
  const loadingExact = page.getByText(/^Cargando\.{3}$/i)
  if (await loadingExact.isVisible().catch(() => false)) {
    await loadingExact.waitFor({ state: 'hidden', timeout: 30_000 })
  }

  const loadingPhrases = page.getByText(/^Cargando\s+\S/i)
  const loadingPhraseCount = await loadingPhrases.count()
  for (let i = 0; i < loadingPhraseCount; i++) {
    const phrase = loadingPhrases.nth(i)
    if (await phrase.isVisible().catch(() => false)) {
      await phrase.waitFor({ state: 'hidden', timeout: 30_000 })
    }
  }

  const skeletons = page.locator('[aria-label*="Cargando"]')
  const skeletonCount = await skeletons.count()
  if (skeletonCount > 0) {
    await skeletons.first().waitFor({ state: 'hidden', timeout: 30_000 })
  }

  // Avoid networkidle — StatusBar polls /notifications every 30s.
  await page.waitForTimeout(300)
}

export async function gotoVisualRoute(page: Page, route: VisualRoute): Promise<void> {
  if (route.setupBefore) {
    await route.setupBefore(page)
  }
  if (route.auth) {
    await loginViaUi(page)
  }
  await page.goto(route.path)
  await route.ready(page)
  await waitForStableLayout(page)
}

export async function captureVisualSnapshot(
  page: Page,
  routeId: string,
  options: { fullPage?: boolean; extraMaskSelectors?: string[] } = {}
): Promise<void> {
  const { fullPage = true, extraMaskSelectors = [] } = options

  await expect(page).toHaveScreenshot(`${routeId}.png`, {
    fullPage,
    animations: 'disabled',
    caret: 'hide',
    mask: visualMaskLocators(page, extraMaskSelectors),
    maxDiffPixelRatio: 0.02,
    timeout: 30_000,
  })
}
