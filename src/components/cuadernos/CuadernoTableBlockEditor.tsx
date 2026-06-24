import { useLayoutEffect, useRef, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import CuadernoBlockInput, { type CuadernoBlockInputHandle } from './CuadernoBlockInput'
import {
  createTableCell,
  createTableRow,
  type CuadernoTableRow,
} from './cuadernoBlockLayouts'
import { richTextToPlain, type RichTextSegment } from './cuadernoRichText'
import './cuadernoEditor.css'

const MIN_TABLE_ROWS = 1
const MIN_TABLE_COLS = 1

interface CellFocusHint {
  row: number
  col: number
  caret: number
}

interface CuadernoTableBlockEditorProps {
  blockId: string
  rows: CuadernoTableRow[]
  onRowsChange: (rows: CuadernoTableRow[]) => void
  onFocus?: () => void
  onBlur?: () => void
}

function CuadernoTableBlockEditor({
  blockId,
  rows,
  onRowsChange,
  onFocus,
  onBlur,
}: CuadernoTableBlockEditorProps) {
  const inputRefs = useRef<Array<Array<CuadernoBlockInputHandle | null>>>([])
  const [focusHint, setFocusHint] = useState<CellFocusHint | null>(null)
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null)

  const colCount = Math.max(...rows.map(row => row.cells.length), 1)

  useLayoutEffect(() => {
    if (!focusHint) {
      return
    }
    const input = inputRefs.current[focusHint.row]?.[focusHint.col]
    if (!input) {
      return
    }
    if (focusHint.caret < 0) {
      input.focusAtEnd()
    } else {
      input.focusAtCaret(focusHint.caret)
    }
    setFocusHint(null)
  }, [focusHint, rows])

  const focusCell = (row: number, col: number, caret = 0) => {
    setFocusHint({ row, col, caret })
  }

  const updateCell = (rowIndex: number, colIndex: number, richText: RichTextSegment[]) => {
    const next = rows.map((row, currentRowIndex) => {
      if (currentRowIndex !== rowIndex) {
        return row
      }
      return {
        ...row,
        cells: row.cells.map((cell, currentColIndex) =>
          currentColIndex === colIndex ? { ...cell, richText } : cell
        ),
      }
    })
    onRowsChange(next)
  }

  const addRow = () => {
    onRowsChange([...rows, createTableRow(colCount)])
    focusCell(rows.length, 0, 0)
  }

  const addColumn = () => {
    onRowsChange(
      rows.map(row => ({
        ...row,
        cells: [...row.cells, createTableCell()],
      }))
    )
    focusCell(0, colCount, 0)
  }

  const removeRow = (rowIndex: number) => {
    if (rows.length <= MIN_TABLE_ROWS) {
      return
    }
    const next = rows.filter((_, index) => index !== rowIndex)
    onRowsChange(next)
    focusCell(Math.min(rowIndex, next.length - 1), 0, 0)
  }

  const removeColumn = (colIndex: number) => {
    if (colCount <= MIN_TABLE_COLS) {
      return
    }
    const next = rows.map(row => ({
      ...row,
      cells: row.cells.filter((_, index) => index !== colIndex),
    }))
    onRowsChange(next)
    focusCell(0, Math.min(colIndex, colCount - 2), 0)
  }

  const removeFocusedRow = () => {
    removeRow(activeCell?.row ?? rows.length - 1)
  }

  const removeFocusedColumn = () => {
    removeColumn(activeCell?.col ?? colCount - 1)
  }

  const handleKeyDown = (
    rowIndex: number,
    colIndex: number,
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    const input = inputRefs.current[rowIndex]?.[colIndex]
    const value = input?.getText() ?? richTextToPlain(rows[rowIndex]?.cells[colIndex]?.richText ?? [{ text: '' }])

    if (event.key === 'Tab') {
      event.preventDefault()
      const nextCol = colIndex + (event.shiftKey ? -1 : 1)
      if (nextCol >= 0 && nextCol < colCount) {
        focusCell(rowIndex, nextCol, event.shiftKey ? -1 : 0)
        return
      }
      const nextRow = rowIndex + (event.shiftKey ? -1 : 1)
      if (nextRow >= 0 && nextRow < rows.length) {
        focusCell(nextRow, event.shiftKey ? colCount - 1 : 0, event.shiftKey ? -1 : 0)
      }
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1
      const isLastCol = colIndex === colCount - 1
      const caretAtEnd = input ? input.getCaret() === value.length : true
      if (isLastRow && isLastCol && caretAtEnd) {
        event.preventDefault()
        addRow()
      }
    }
  }

  return (
    <div className="cuaderno-table-block" role="group" aria-label="Tabla">
      <div className="cuaderno-table-block__scroll">
        <table className="cuaderno-table-block__table">
          <thead>
            <tr>
              <th className="cuaderno-table-block__corner" aria-hidden="true" />
              {Array.from({ length: colCount }, (_, colIndex) => (
                <th key={`col-head-${colIndex}`} className="cuaderno-table-block__col-head">
                  <button
                    type="button"
                    className="cuaderno-table-block__remove"
                    onClick={() => removeColumn(colIndex)}
                    disabled={colCount <= MIN_TABLE_COLS}
                    aria-label={`Quitar columna ${colIndex + 1}`}
                    title={`Quitar columna ${colIndex + 1}`}
                  >
                    <RemoveIcon fontSize="inherit" aria-hidden />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id}>
                <th className="cuaderno-table-block__row-head" scope="row">
                  <button
                    type="button"
                    className="cuaderno-table-block__remove"
                    onClick={() => removeRow(rowIndex)}
                    disabled={rows.length <= MIN_TABLE_ROWS}
                    aria-label={`Quitar fila ${rowIndex + 1}`}
                    title={`Quitar fila ${rowIndex + 1}`}
                  >
                    <RemoveIcon fontSize="inherit" aria-hidden />
                  </button>
                </th>
                {row.cells.map((cell, colIndex) => (
                  <td key={cell.id} className="cuaderno-table-block__cell">
                    <CuadernoBlockInput
                      ref={handle => {
                        if (!inputRefs.current[rowIndex]) {
                          inputRefs.current[rowIndex] = []
                        }
                        inputRefs.current[rowIndex][colIndex] = handle
                      }}
                      blockId={`${blockId}:${cell.id}`}
                      richText={cell.richText}
                      enableFormatting
                      ariaLabel={`Fila ${rowIndex + 1}, columna ${colIndex + 1}`}
                      placeholder="—"
                      onRichTextChange={richText => updateCell(rowIndex, colIndex, richText)}
                      onKeyDown={event => handleKeyDown(rowIndex, colIndex, event)}
                      onFocus={() => {
                        setActiveCell({ row: rowIndex, col: colIndex })
                        onFocus?.()
                      }}
                      onBlur={onBlur}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cuaderno-table-block__toolbar" contentEditable={false}>
        <button type="button" className="cuaderno-table-block__tool" onClick={addRow}>
          <AddIcon fontSize="inherit" aria-hidden />
          Fila
        </button>
        <button
          type="button"
          className="cuaderno-table-block__tool cuaderno-table-block__tool--danger"
          onClick={removeFocusedRow}
          disabled={rows.length <= MIN_TABLE_ROWS}
          aria-label="Quitar fila activa"
          title="Quitar fila activa"
        >
          <RemoveIcon fontSize="inherit" aria-hidden />
          Fila
        </button>
        <button type="button" className="cuaderno-table-block__tool" onClick={addColumn}>
          <AddIcon fontSize="inherit" aria-hidden />
          Columna
        </button>
        <button
          type="button"
          className="cuaderno-table-block__tool cuaderno-table-block__tool--danger"
          onClick={removeFocusedColumn}
          disabled={colCount <= MIN_TABLE_COLS}
          aria-label="Quitar columna activa"
          title="Quitar columna activa"
        >
          <RemoveIcon fontSize="inherit" aria-hidden />
          Columna
        </button>
      </div>
    </div>
  )
}

export default CuadernoTableBlockEditor
