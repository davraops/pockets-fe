import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import LinkIcon from '@mui/icons-material/Link'
import {
  filterCuadernoLinkTargets,
  type CuadernoLinkTarget,
} from './cuadernoLinkUtils'
import './cuadernoEditor.css'

export interface CuadernoLinkPickerHandle {
  onKeyDown: (event: React.KeyboardEvent) => boolean
}

interface CuadernoLinkPickerProps {
  query: string
  notes: CuadernoLinkTarget[]
  currentNoteId?: string
  anchorRect: DOMRect | null
  onSelect: (note: CuadernoLinkTarget) => void
  onClose: () => void
}

const CuadernoLinkPicker = forwardRef<CuadernoLinkPickerHandle, CuadernoLinkPickerProps>(
  function CuadernoLinkPicker(
    { query, notes, currentNoteId, anchorRect, onSelect, onClose },
    ref
  ) {
    const menuRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const options = filterCuadernoLinkTargets(notes, query, currentNoteId)

    useEffect(() => {
      setHighlightedIndex(0)
    }, [query])

    useEffect(() => {
      setHighlightedIndex(index => Math.min(index, Math.max(options.length - 1, 0)))
    }, [options.length])

    useEffect(() => {
      itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }, [highlightedIndex, options])

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown(event: React.KeyboardEvent) {
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault()
            const selected = options[highlightedIndex]
            if (selected) {
              onSelect(selected)
            }
            return true
          }

          if (options.length === 0) {
            return false
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setHighlightedIndex(index => Math.min(index + 1, options.length - 1))
            return true
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setHighlightedIndex(index => Math.max(index - 1, 0))
            return true
          }

          return false
        },
      }),
      [highlightedIndex, onSelect, options]
    )

    useEffect(() => {
      const handlePointer = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose()
        }
      }
      document.addEventListener('mousedown', handlePointer)
      return () => document.removeEventListener('mousedown', handlePointer)
    }, [onClose])

    if (!anchorRect) {
      return null
    }

    const top = anchorRect.bottom + 6
    const left = anchorRect.left
    const activeId = `cuaderno-link-option-${options[highlightedIndex]?.id ?? 'none'}`

    return (
      <div
        ref={menuRef}
        className="cuaderno-link-picker"
        style={{ top, left }}
        role="listbox"
        aria-label="Enlazar cuaderno"
        aria-activedescendant={options.length > 0 ? activeId : undefined}
      >
        <p className="cuaderno-link-picker__title">Enlazar cuaderno</p>
        {options.length === 0 ? (
          <p className="cuaderno-link-picker__empty">No hay cuadernos que coincidan</p>
        ) : (
          options.map((note, index) => {
            const isHighlighted = index === highlightedIndex
            return (
              <button
                key={note.id}
                ref={element => {
                  itemRefs.current[index] = element
                }}
                id={`cuaderno-link-option-${note.id}`}
                type="button"
                className={[
                  'cuaderno-link-picker__item',
                  isHighlighted ? 'cuaderno-link-picker__item--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={event => {
                  event.preventDefault()
                  onSelect(note)
                }}
              >
                <LinkIcon className="cuaderno-link-picker__icon" fontSize="small" aria-hidden />
                <span className="cuaderno-link-picker__label">{note.titulo}</span>
              </button>
            )
          })
        )}
        <p className="cuaderno-link-picker__footer">
          <kbd>↑</kbd> <kbd>↓</kbd> navegar · <kbd>Enter</kbd> elegir · <kbd>Esc</kbd> cerrar
        </p>
      </div>
    )
  }
)

export default CuadernoLinkPicker
