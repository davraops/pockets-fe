import type { ViewportSize } from '@playwright/test'

/** Matches src/hooks/useBreakpoint.ts BREAKPOINTS.mobile (768px). */
export const MOBILE_VIEWPORT: ViewportSize = { width: 390, height: 844 }
