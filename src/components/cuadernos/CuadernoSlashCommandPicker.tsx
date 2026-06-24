import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CuadernoBlockCommand } from './cuadernoBlockCommands'
import { filterSlashCommands } from './cuadernoSlashCommand'
import './cuadernoEditor.css'

export interface CuadernoSlashCommandPickerHandle {
  onKeyDown: (event: React.KeyboardEvent) => boolean
}

interface CuadernoSlashCommandPickerProps {
  query: string
  anchorRect: DOMRect | null
  onSelect: (command: CuadernoBlockCommand) => void
  onClose: () => void
}

const CuadernoSlashCommandPicker = forwardRef<
  CuadernoSlashCommandPickerHandle,
  CuadernoSlashCommandPickerProps
>(function CuadernoSlashCommandPicker({ query, anchorRect, onSelect, onClose }, ref) {
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const options = filterSlashCommands(query)

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
  const activeId = `cuaderno-slash-option-${options[highlightedIndex]?.type ?? 'none'}`

  return (
    <div
      ref={menuRef}
      className="cuaderno-slash-picker"
      style={{ top, left }}
      role="listbox"
      aria-label="Comandos de bloque"
      aria-activedescendant={options.length > 0 ? activeId : undefined}
    >
      <p className="cuaderno-slash-picker__title">Comandos</p>
      {options.length === 0 ? (
        <p className="cuaderno-slash-picker__empty">No hay comandos que coincidan</p>
      ) : (
        options.map((command, index) => {
          const isHighlighted = index === highlightedIndex
          return (
            <button
              key={command.type}
              ref={element => {
                itemRefs.current[index] = element
              }}
              id={`cuaderno-slash-option-${command.type}`}
              type="button"
              className={[
                'cuaderno-slash-picker__option',
                isHighlighted ? 'cuaderno-slash-picker__option--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="option"
              aria-selected={isHighlighted}
              onMouseDown={event => event.preventDefault()}
              onClick={() => onSelect(command)}
            >
              <span className="cuaderno-slash-picker__icon" aria-hidden="true">
                {command.icon}
              </span>
              <span className="cuaderno-slash-picker__copy">
                <span className="cuaderno-slash-picker__label">{command.label}</span>
                <span className="cuaderno-slash-picker__description">{command.description}</span>
              </span>
            </button>
          )
        })
      )}
    </div>
  )
})

export default CuadernoSlashCommandPicker
