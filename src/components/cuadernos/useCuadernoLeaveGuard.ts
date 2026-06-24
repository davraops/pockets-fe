import { useEffect, useRef } from 'react'
import type { ConfirmOptions } from '../../contexts/ConfirmContext'

interface UseCuadernoLeaveGuardOptions {
  isDirty: boolean
  persistIfDirty: () => Promise<void>
  confirm: (options: ConfirmOptions) => Promise<boolean>
  navigate: (to: string) => void
  pathname: string
  search: string
}

/**
 * Persists before in-app link navigation when dirty.
 * Works with BrowserRouter (useBlocker requires a data router).
 */
export function useCuadernoLeaveGuard({
  isDirty,
  persistIfDirty,
  confirm,
  navigate,
  pathname,
  search,
}: UseCuadernoLeaveGuardOptions) {
  const persistRef = useRef(persistIfDirty)
  const navigateRef = useRef(navigate)
  const confirmRef = useRef(confirm)

  persistRef.current = persistIfDirty
  navigateRef.current = navigate
  confirmRef.current = confirm

  useEffect(() => {
    if (!isDirty) {
      return
    }

    const currentPath = `${pathname}${search}`

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const anchor = (
        event.target instanceof Element ? event.target.closest('a[href]') : null
      ) as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank') {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      let url: URL
      try {
        url = new URL(href, window.location.origin)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) {
        return
      }

      const nextPath = `${url.pathname}${url.search}${url.hash}`
      if (nextPath === currentPath) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      void (async () => {
        try {
          await persistRef.current()
          navigateRef.current(nextPath)
        } catch {
          const leave = await confirmRef.current({
            message: 'No se pudo guardar el cuaderno. ¿Salir sin guardar los cambios?',
            confirmLabel: 'Salir sin guardar',
            cancelLabel: 'Seguir editando',
          })
          if (leave) {
            navigateRef.current(nextPath)
          }
        }
      })()
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isDirty, pathname, search])
}
