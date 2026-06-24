import { useEffect, useRef, type RefObject } from 'react'
import { getCollapsedCaretRect } from './cuadernoContentEditableUtils'

/** Positions a DOM caret overlay without React state so CSS blink animation is not reset. */
export function useCuadernoBlinkCaret(
  editableRef: RefObject<HTMLDivElement | null>,
  isFocused: boolean
) {
  const caretRef = useRef<HTMLSpanElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastPositionRef = useRef('')

  useEffect(() => {
    const editable = editableRef.current
    const caret = caretRef.current

    if (!isFocused || !editable || !caret) {
      if (caret) {
        caret.style.visibility = 'hidden'
      }
      return
    }

    const sync = () => {
      rafRef.current = null
      const active = editableRef.current
      const marker = caretRef.current
      if (!active || !marker || document.activeElement !== active) {
        if (marker) {
          marker.style.visibility = 'hidden'
        }
        return
      }

      const rect = getCollapsedCaretRect(active)
      if (!rect) {
        marker.style.visibility = 'hidden'
        return
      }

      const height = Math.max(Math.round(rect.height), 18)
      const top = Math.round(rect.top)
      const left = Math.round(rect.left)
      const nextPosition = `${top},${left},${height}`

      if (nextPosition !== lastPositionRef.current) {
        marker.style.top = `${top}px`
        marker.style.left = `${left}px`
        marker.style.height = `${height}px`
        lastPositionRef.current = nextPosition
      }

      marker.style.visibility = 'visible'
    }

    const schedule = () => {
      if (rafRef.current !== null) {
        return
      }
      rafRef.current = window.requestAnimationFrame(sync)
    }

    schedule()
    document.addEventListener('selectionchange', schedule)
    editable.addEventListener('input', schedule)
    editable.addEventListener('keyup', schedule)
    editable.addEventListener('click', schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
      document.removeEventListener('selectionchange', schedule)
      editable.removeEventListener('input', schedule)
      editable.removeEventListener('keyup', schedule)
      editable.removeEventListener('click', schedule)
      window.removeEventListener('resize', schedule, true)
      caret.style.visibility = 'hidden'
      lastPositionRef.current = ''
    }
  }, [editableRef, isFocused])

  return caretRef
}
