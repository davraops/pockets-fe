import { useLayoutEffect, useRef, useState } from 'react'
import CuadernoBlockInput, { type CuadernoBlockInputHandle } from './CuadernoBlockInput'
import {
  createColumnCell,
  type CuadernoColumnCell,
} from './cuadernoBlockLayouts'
import type { RichTextSegment } from './cuadernoRichText'
import './cuadernoEditor.css'

interface ColumnFocusHint {
  index: number
  caret: number
}

interface CuadernoColumnBlockEditorProps {
  blockId: string
  columns: CuadernoColumnCell[]
  onColumnsChange: (columns: CuadernoColumnCell[]) => void
  onFocus?: () => void
  onBlur?: () => void
}

function CuadernoColumnBlockEditor({
  blockId,
  columns,
  onColumnsChange,
  onFocus,
  onBlur,
}: CuadernoColumnBlockEditorProps) {
  const inputRefs = useRef<Array<CuadernoBlockInputHandle | null>>([])
  const [focusHint, setFocusHint] = useState<ColumnFocusHint | null>(null)

  useLayoutEffect(() => {
    if (!focusHint) {
      return
    }
    const input = inputRefs.current[focusHint.index]
    if (!input) {
      return
    }
    if (focusHint.caret < 0) {
      input.focusAtEnd()
    } else {
      input.focusAtCaret(focusHint.caret)
    }
    setFocusHint(null)
  }, [focusHint, columns])

  const updateColumn = (index: number, richText: RichTextSegment[]) => {
    const next = columns.map((column, columnIndex) =>
      columnIndex === index ? { ...column, richText } : column
    )
    onColumnsChange(next)
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' && index === 0) {
      const input = inputRefs.current[0]
      const value = input?.getText() ?? ''
      if (input && input.getCaret() === value.length) {
        event.preventDefault()
        setFocusHint({ index: 1, caret: 0 })
      }
    }
    if (event.key === 'ArrowLeft' && index === 1) {
      const input = inputRefs.current[1]
      if (input && input.getCaret() === 0) {
        event.preventDefault()
        setFocusHint({ index: 0, caret: -1 })
      }
    }
  }

  const safeColumns =
    columns.length >= 2 ? columns : [columns[0] ?? createColumnCell(), createColumnCell()]

  return (
    <div className="cuaderno-column-block" role="group" aria-label="Bloque de dos columnas">
      {safeColumns.map((column, index) => (
        <div key={column.id} className="cuaderno-column-block__col">
          <CuadernoBlockInput
            ref={handle => {
              inputRefs.current[index] = handle
            }}
            blockId={`${blockId}:${column.id}`}
            richText={column.richText}
            enableFormatting
            allowMultiline
            ariaLabel={`Columna ${index + 1}`}
            placeholder={index === 0 ? 'Columna izquierda' : 'Columna derecha'}
            onRichTextChange={richText => updateColumn(index, richText)}
            onKeyDown={event => handleKeyDown(index, event)}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
      ))}
    </div>
  )
}

export default CuadernoColumnBlockEditor
