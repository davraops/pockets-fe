import { useEffect, useState } from 'react'
import { isMarkActive, toggleInlineMark } from './cuadernoInlineFormat'
import type { InlineMark } from './cuadernoRichText'
import './cuadernoEditor.css'

interface CuadernoInlineToolbarProps {
  anchorElement: HTMLElement | null
  enabled: boolean
  onFormat: () => void
}

function getSelectionRect(anchorElement: HTMLElement | null): DOMRect | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !anchorElement) {
    return null
  }
  const range = selection.getRangeAt(0)
  if (!anchorElement.contains(range.commonAncestorContainer)) {
    return null
  }
  return range.getBoundingClientRect()
}

function CuadernoInlineToolbar({ anchorElement, enabled, onFormat }: CuadernoInlineToolbarProps) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [activeMarks, setActiveMarks] = useState<InlineMark[]>([])

  useEffect(() => {
    if (!enabled) {
      setRect(null)
      return
    }

    const update = () => {
      const nextRect = getSelectionRect(anchorElement)
      setRect(nextRect)
      if (nextRect) {
        setActiveMarks(
          (['bold', 'italic', 'underline', 'strikethrough', 'code'] as InlineMark[]).filter(mark =>
            isMarkActive(mark)
          )
        )
      }
    }

    update()
    document.addEventListener('selectionchange', update)
    window.addEventListener('resize', update)
    return () => {
      document.removeEventListener('selectionchange', update)
      window.removeEventListener('resize', update)
    }
  }, [anchorElement, enabled])

  if (!enabled || !rect) {
    return null
  }

  const top = Math.max(8, rect.top - 44)
  const left = rect.left + rect.width / 2

  const buttons: Array<{ mark: InlineMark; label: string; title: string }> = [
    { mark: 'bold', label: 'B', title: 'Negrita (⌘B)' },
    { mark: 'italic', label: 'I', title: 'Cursiva (⌘I)' },
    { mark: 'underline', label: 'U', title: 'Subrayado (⌘U)' },
    { mark: 'strikethrough', label: 'S', title: 'Tachado (⌘⇧S)' },
    { mark: 'code', label: '</>', title: 'Código inline (⌘E)' },
  ]

  return (
    <div
      className="cuaderno-inline-toolbar"
      style={{ top, left }}
      role="toolbar"
      aria-label="Formato de texto"
      onMouseDown={event => event.preventDefault()}
    >
      {buttons.map(button => (
        <button
          key={button.mark}
          type="button"
          className={[
            'cuaderno-inline-toolbar__btn',
            activeMarks.includes(button.mark) ? 'cuaderno-inline-toolbar__btn--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={button.title}
          aria-label={button.title}
          aria-pressed={activeMarks.includes(button.mark)}
          onClick={() => {
            toggleInlineMark(button.mark)
            onFormat()
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}

export default CuadernoInlineToolbar
