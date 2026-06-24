import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    el => el.offsetParent !== null || el.getClientRects().length > 0
  )
}

function isModalDismissControl(element: HTMLElement): boolean {
  return (
    element.classList.contains('modal-close') || element.classList.contains('modal-panel-close')
  )
}

function pickInitialFocus(container: HTMLElement): HTMLElement | undefined {
  const focusables = getFocusableElements(container)
  const active = document.activeElement

  if (
    active instanceof HTMLElement &&
    container.contains(active) &&
    active !== container &&
    focusables.includes(active)
  ) {
    return active
  }

  return (
    focusables.find(
      el => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
    ) ??
    focusables.find(el => !isModalDismissControl(el)) ??
    focusables[0]
  )
}

/**
 * Focus trap, Escape to close, and focus restore for modal dialogs.
 */
export function useModalAccessibility(
  isOpen: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>
) {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement
    const container = containerRef.current
    if (!container) return

    const focusInitial = () => {
      pickInitialFocus(container)?.focus()
    }

    const raf = requestAnimationFrame(focusInitial)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusables = getFocusableElements(container)
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen, containerRef])
}
