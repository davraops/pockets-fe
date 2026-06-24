import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { CUADERNO_BLOCK_COMMANDS } from './cuadernoBlockCommands'
import { computeFloatingMenuPosition } from './cuadernoBlockMenuPosition'
import type { CuadernoBlockType } from './cuadernoDocument'
import './cuadernoEditor.css'

interface CuadernoBlockMenuProps {
  anchorEl: HTMLElement | null
  currentType: CuadernoBlockType
  canDelete: boolean
  onSelectType: (type: CuadernoBlockType) => void
  onDelete: () => void
  onClose: () => void
}

function CuadernoBlockMenu({
  anchorEl,
  currentType,
  canDelete,
  onSelectType,
  onDelete,
  onClose,
}: CuadernoBlockMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const typeOptions = CUADERNO_BLOCK_COMMANDS
  const activeTypeIndex = Math.max(
    0,
    typeOptions.findIndex(command => command.type === currentType)
  )

  const updatePosition = useCallback(() => {
    if (!anchorEl || !menuRef.current) {
      return
    }
    const anchor = anchorEl.getBoundingClientRect()
    const menu = menuRef.current.getBoundingClientRect()
    setPosition(
      computeFloatingMenuPosition(anchor, menu.width || 320, menu.height || 280)
    )
  }, [anchorEl])

  useLayoutEffect(() => {
    setHighlightedIndex(activeTypeIndex)
  }, [activeTypeIndex, anchorEl])

  useLayoutEffect(() => {
    updatePosition()
  }, [updatePosition, currentType, canDelete])

  useEffect(() => {
    if (!anchorEl) {
      return
    }
    const handleReposition = () => updatePosition()
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [anchorEl, updatePosition])

  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target)) {
        return
      }
      if (anchorEl?.contains(target)) {
        return
      }
      onClose()
    }

    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [anchorEl, onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIndex(index => Math.min(index + 1, typeOptions.length - 1))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIndex(index => Math.max(index - 1, 0))
        return
      }

      if (event.key === 'Enter') {
        const selected = typeOptions[highlightedIndex]
        if (selected) {
          event.preventDefault()
          onSelectType(selected.type)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [highlightedIndex, onClose, onSelectType, typeOptions])

  if (!anchorEl) {
    return null
  }

  const menu = (
    <div
      ref={menuRef}
      className="cuaderno-block-menu"
      style={position}
      role="menu"
      aria-label="Opciones del bloque"
      onMouseDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
    >
      <p className="cuaderno-block-menu__title">Tipo de bloque</p>
      <div className="cuaderno-block-menu__types">
        {typeOptions.map((command, index) => {
          const isActive = command.type === currentType
          const isHighlighted = index === highlightedIndex
          return (
            <button
              key={command.type}
              ref={element => {
                itemRefs.current[index] = element
              }}
              type="button"
              className={[
                'cuaderno-block-menu__type',
                isActive ? 'cuaderno-block-menu__type--active' : '',
                isHighlighted ? 'cuaderno-block-menu__type--highlighted' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="menuitemradio"
              aria-checked={isActive}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => onSelectType(command.type)}
            >
              <span className="cuaderno-block-menu__type-icon" aria-hidden="true">
                {command.icon}
              </span>
              <span className="cuaderno-block-menu__type-text">
                <span className="cuaderno-block-menu__type-label">{command.label}</span>
                <span className="cuaderno-block-menu__type-desc">{command.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="cuaderno-block-menu__separator" role="separator" />

      <button
        type="button"
        className="cuaderno-block-menu__item cuaderno-block-menu__item--danger"
        role="menuitem"
        disabled={!canDelete}
        onClick={() => {
          if (!canDelete) {
            return
          }
          onDelete()
        }}
      >
        <DeleteOutlineIcon fontSize="small" aria-hidden />
        Eliminar bloque
      </button>
      {!canDelete ? (
        <p className="cuaderno-block-menu__hint">Debe quedar al menos un bloque</p>
      ) : null}
    </div>
  )

  return createPortal(menu, document.body)
}

export default CuadernoBlockMenu
