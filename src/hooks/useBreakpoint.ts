import { useEffect, useState } from 'react'

export const BREAKPOINTS = {
  mobile: 768,
  mobileSm: 480,
  tablet: 900,
  desktop: 1024,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

const QUERIES: Record<BreakpointKey, string> = {
  mobile: `(max-width: ${BREAKPOINTS.mobile}px)`,
  mobileSm: `(max-width: ${BREAKPOINTS.mobileSm}px)`,
  tablet: `(max-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(max-width: ${BREAKPOINTS.desktop}px)`,
}

function matchesQuery(key: BreakpointKey): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(QUERIES[key]).matches
}

/** Returns true when viewport is at or below the given breakpoint. */
export function useBreakpoint(key: BreakpointKey = 'mobile'): boolean {
  const [matches, setMatches] = useState(() => matchesQuery(key))

  useEffect(() => {
    const media = window.matchMedia(QUERIES[key])
    const handleChange = () => setMatches(media.matches)
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [key])

  return matches
}

/** Shorthand for useBreakpoint('mobile'). */
export function useIsMobile(): boolean {
  return useBreakpoint('mobile')
}
