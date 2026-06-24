import { createBlockId, type CuadernoBlock } from './cuadernoDocument'
import {
  normalizeRichText,
  plainToRichText,
  richTextToPlain,
  type RichTextSegment,
} from './cuadernoRichText'

export interface CuadernoColumnCell {
  id: string
  richText: RichTextSegment[]
}

export interface CuadernoTableCell {
  id: string
  richText: RichTextSegment[]
}

export interface CuadernoTableRow {
  id: string
  cells: CuadernoTableCell[]
}

export const DEFAULT_TABLE_ROWS = 3
export const DEFAULT_TABLE_COLS = 3

export function createColumnCell(
  richText: RichTextSegment[] = [{ text: '' }],
  id?: string
): CuadernoColumnCell {
  return {
    id: typeof id === 'string' && id.length > 0 ? id : createBlockId(),
    richText: normalizeRichText(richText),
  }
}

export function createTableCell(
  richText: RichTextSegment[] = [{ text: '' }],
  id?: string
): CuadernoTableCell {
  return {
    id: typeof id === 'string' && id.length > 0 ? id : createBlockId(),
    richText: normalizeRichText(richText),
  }
}

export function createTableRow(cols = DEFAULT_TABLE_COLS): CuadernoTableRow {
  return {
    id: createBlockId(),
    cells: Array.from({ length: cols }, () => createTableCell()),
  }
}

export function createDefaultTableRows(
  rows = DEFAULT_TABLE_ROWS,
  cols = DEFAULT_TABLE_COLS
): CuadernoTableRow[] {
  return Array.from({ length: rows }, () => createTableRow(cols))
}

export function normalizeColumnCells(value: unknown): CuadernoColumnCell[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [createColumnCell(), createColumnCell()]
  }

  const cells = value
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const cell = item as CuadernoColumnCell
      return createColumnCell(
        Array.isArray(cell.richText) && cell.richText.length > 0
          ? cell.richText
          : plainToRichText(typeof (item as { text?: string }).text === 'string' ? (item as { text: string }).text : ''),
        typeof cell.id === 'string' ? cell.id : undefined
      )
    })
    .filter((cell): cell is CuadernoColumnCell => cell !== null)

  if (cells.length === 1) {
    return [cells[0], createColumnCell()]
  }
  return [cells[0], cells[1]]
}

export function normalizeTableRows(value: unknown): CuadernoTableRow[] {
  if (!Array.isArray(value) || value.length === 0) {
    return createDefaultTableRows()
  }

  const rows = value
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const row = item as CuadernoTableRow
      const cells = Array.isArray(row.cells) ? row.cells : []
      const normalizedCells = cells
        .map(cell => {
          if (!cell || typeof cell !== 'object') {
            return null
          }
          return createTableCell(
            Array.isArray(cell.richText) && cell.richText.length > 0
              ? cell.richText
              : plainToRichText(typeof (cell as { text?: string }).text === 'string' ? (cell as { text?: string }).text! : ''),
            typeof cell.id === 'string' ? cell.id : undefined
          )
        })
        .filter((cell): cell is CuadernoTableCell => cell !== null)

      if (normalizedCells.length === 0) {
        return null
      }

      return {
        id: typeof row.id === 'string' && row.id ? row.id : createBlockId(),
        cells: normalizedCells,
      }
    })
    .filter((row): row is CuadernoTableRow => row !== null)

  if (rows.length === 0) {
    return createDefaultTableRows()
  }

  const colCount = Math.max(...rows.map(row => row.cells.length), DEFAULT_TABLE_COLS)
  return rows.map(row => ({
    ...row,
    cells: [
      ...row.cells,
      ...Array.from({ length: Math.max(0, colCount - row.cells.length) }, () => createTableCell()),
    ],
  }))
}

export function getBlockColumnCells(block: CuadernoBlock): CuadernoColumnCell[] {
  if (block.type !== 'column_2') {
    return [createColumnCell(), createColumnCell()]
  }
  if (Array.isArray(block.columns) && block.columns.length > 0) {
    return normalizeColumnCells(block.columns)
  }
  const richText = normalizeRichText(
    Array.isArray(block.richText) && block.richText.length > 0
      ? block.richText
      : plainToRichText(block.text ?? '')
  )
  return [createColumnCell(richText), createColumnCell()]
}

export function getBlockTableRows(block: CuadernoBlock): CuadernoTableRow[] {
  if (block.type !== 'table') {
    return createDefaultTableRows()
  }
  if (Array.isArray(block.tableRows) && block.tableRows.length > 0) {
    return normalizeTableRows(block.tableRows)
  }
  return createDefaultTableRows()
}

export function columnsToBlockPatch(
  columns: CuadernoColumnCell[]
): Pick<CuadernoBlock, 'columns' | 'text' | 'richText'> {
  const normalized = normalizeColumnCells(columns)
  const joinedRichText = normalized.flatMap((cell, index) => {
    const segments = normalizeRichText(cell.richText)
    if (index === 0) {
      return segments
    }
    return [{ text: ' | ' }, ...segments]
  })
  return {
    columns: normalized,
    richText: joinedRichText,
    text: richTextToPlain(joinedRichText),
  }
}

export function tableToBlockPatch(
  rows: CuadernoTableRow[]
): Pick<CuadernoBlock, 'tableRows' | 'text' | 'richText'> {
  const normalized = normalizeTableRows(rows)
  const joinedRichText = normalized.flatMap((row, rowIndex) => {
    const rowText = row.cells.flatMap((cell, cellIndex) => {
      const segments = normalizeRichText(cell.richText)
      if (cellIndex === 0) {
        return segments
      }
      return [{ text: '\t' }, ...segments]
    })
    if (rowIndex === 0) {
      return rowText
    }
    return [{ text: '\n' }, ...rowText]
  })
  return {
    tableRows: normalized,
    richText: joinedRichText,
    text: richTextToPlain(joinedRichText),
  }
}

export function getLayoutBlockPlainText(block: CuadernoBlock): string {
  if (block.type === 'column_2') {
    return getBlockColumnCells(block)
      .map(cell => richTextToPlain(cell.richText).trim())
      .filter(Boolean)
      .join(' | ')
  }
  if (block.type === 'table') {
    return getBlockTableRows(block)
      .map(row =>
        row.cells
          .map(cell => richTextToPlain(cell.richText).trim())
          .join('\t')
      )
      .join('\n')
  }
  return ''
}

export function layoutBlockHasContent(block: CuadernoBlock): boolean {
  if (block.type === 'column_2') {
    return getBlockColumnCells(block).some(cell => richTextToPlain(cell.richText).trim().length > 0)
  }
  if (block.type === 'table') {
    return getBlockTableRows(block).some(row =>
      row.cells.some(cell => richTextToPlain(cell.richText).trim().length > 0)
    )
  }
  return false
}

export function columnsEqual(left: CuadernoColumnCell[], right: CuadernoColumnCell[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  return left.every((cell, index) => {
    const other = right[index]
    return (
      cell.id === other.id &&
      JSON.stringify(cell.richText) === JSON.stringify(other.richText)
    )
  })
}

export function tableRowsEqual(left: CuadernoTableRow[], right: CuadernoTableRow[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
