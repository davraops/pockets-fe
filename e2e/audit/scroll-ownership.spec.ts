import { test, expect, type Page } from '@playwright/test'
import { authenticatedBeforeEach } from '../fixtures/authenticated'

/** Routes checked for a single page-level scroll owner (plus document). */
const SCROLL_ROUTES: Array<{ path: string; maxOwners: number; ready: string; note?: string }> = [
  { path: '/', maxOwners: 1, ready: '.hub-home-body' },
  { path: '/finanzas', maxOwners: 1, ready: '.finanzas-dashboard' },
  { path: '/trabajo', maxOwners: 1, ready: '.trabajo-dashboard' },
  { path: '/tiempo', maxOwners: 1, ready: '.tiempo-dashboard' },
  { path: '/registros', maxOwners: 1, ready: '.utilidades-dashboard' },
  { path: '/registros/calculadora', maxOwners: 1, ready: '.calculadora-content' },
  { path: '/registros/generador-contrasenas', maxOwners: 1, ready: '.generador-contrasenas-content' },
  {
    path: '/registros/cuadernos',
    maxOwners: 2,
    ready: '.cuadernos-shell',
    note: 'Split workspace: sidebar list + editor pane may each scroll',
  },
]

const MODAL_ANCESTOR =
  '.modal-overlay, .modal-backdrop, [role="dialog"], .cuaderno-emoji-picker, .cuaderno-cover-picker, .cuaderno-block-menu, .cuaderno-subpages-modal'

export interface ScrollOwnershipReport {
  documentScrollable: boolean
  pageOwners: Array<{ className: string; tag: string }>
  pageOwnerCount: number
}

export async function measureScrollOwnership(page: Page): Promise<ScrollOwnershipReport> {
  return page.evaluate((modalSelector) => {
    const isScrollable = (el: Element): boolean => {
      const style = getComputedStyle(el)
      const overflowY = style.overflowY
      if (overflowY !== 'auto' && overflowY !== 'scroll') return false
      const node = el as HTMLElement
      return node.scrollHeight > node.clientHeight + 1
    }

    const inModal = (el: Element): boolean => Boolean(el.closest(modalSelector))

    const main = document.querySelector('#main-content')
    if (!main) {
      return { documentScrollable: false, pageOwners: [], pageOwnerCount: 0 }
    }

    const scrollable: HTMLElement[] = []
    main.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (inModal(el)) return
      if (isScrollable(el)) scrollable.push(el)
    })

    const pageOwners = scrollable.filter((el) => {
      let parent = el.parentElement
      while (parent && parent !== main && parent !== document.body) {
        if (scrollable.includes(parent as HTMLElement)) return false
        parent = parent.parentElement
      }
      return true
    })

    const docScrollable =
      document.documentElement.scrollHeight > document.documentElement.clientHeight + 1 ||
      document.body.scrollHeight > document.body.clientHeight + 1

    return {
      documentScrollable: docScrollable,
      pageOwners: pageOwners.map((el) => ({
        className: el.className || '(no class)',
        tag: el.tagName.toLowerCase(),
      })),
      pageOwnerCount: pageOwners.length,
    }
  }, MODAL_ANCESTOR)
}

authenticatedBeforeEach()

test.describe('Scroll ownership audit @audit', () => {
  for (const { path, maxOwners, ready, note } of SCROLL_ROUTES) {
    test(`${path} has at most ${maxOwners} in-page scroll owner(s)`, async ({ page }) => {
      await page.goto(path)
      await page.locator(ready).waitFor({ state: 'visible', timeout: 20_000 })
      await page.waitForLoadState('domcontentloaded')

      const report = await measureScrollOwnership(page)
      const totalOwners = report.pageOwnerCount + (report.documentScrollable ? 1 : 0)

      expect(
        report.pageOwnerCount,
        [
          `path=${path}`,
          note,
          `documentScrollable=${report.documentScrollable}`,
          `owners=${JSON.stringify(report.pageOwners)}`,
        ]
          .filter(Boolean)
          .join(' | '),
      ).toBeLessThanOrEqual(maxOwners)

      expect(totalOwners, `competing scroll surfaces on ${path}`).toBeLessThanOrEqual(maxOwners + 1)
    })
  }
})
