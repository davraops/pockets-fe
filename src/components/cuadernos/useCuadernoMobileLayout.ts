import { useIsMobile } from '../../hooks/useBreakpoint'

export function useCuadernoMobileLayout(): boolean {
  return useIsMobile()
}
