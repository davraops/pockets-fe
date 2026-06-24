import { clampIndent, getBlockIndent } from './cuadernoBlockIndent'
import {
  getBlockRichText,
  normalizeRichText,
  plainToRichText,
  richTextToPlain,
  type RichTextSegment,
} from './cuadernoRichText'
import type { CuadernoTodoItem } from './cuadernoTodoItems'
import { createListItem, getBlockListItems, listItemsToBlockPatch } from './cuadernoListItems'
import { getBlockTodoItems, todoItemsToBlockPatch } from './cuadernoTodoItems'
import { normalizePageComment, normalizePageIcon, normalizePageCover, normalizeParentId, resolvePageIcon, resolvePageCover } from './cuadernoPageMeta'
import {
  columnsToBlockPatch,
  createColumnCell,
  createDefaultTableRows,
  getBlockColumnCells,
  getBlockTableRows,
  getLayoutBlockPlainText,
  layoutBlockHasContent,
  tableToBlockPatch,
} from './cuadernoBlockLayouts'
import { isDataImageSrc } from './cuadernoImagePaste'
import { tryParseXmlDocument } from './cuadernoXml'

export const CUADERNO_DOCUMENT_FORMAT = 'cuaderno-blocks' as const
export const CUADERNO_DOCUMENT_VERSION = 1 as const

export type CuadernoBlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'column_2'
  | 'table'

export interface CuadernoBlock {
  id: string
  type: CuadernoBlockType
  text?: string
  richText?: RichTextSegment[]
  checked?: boolean
  todoItems?: CuadernoTodoItem[]
  listItems?: import('./cuadernoListItems').CuadernoListItem[]
  columns?: import('./cuadernoBlockLayouts').CuadernoColumnCell[]
  tableRows?: import('./cuadernoBlockLayouts').CuadernoTableRow[]
  /** Data URL for image blocks (paste / upload). */
  imageSrc?: string
  imageAlt?: string
  /** Nesting level for lists and paragraphs (0 = root). */
  indent?: number
}

export interface CuadernoDocument {
  version: typeof CUADERNO_DOCUMENT_VERSION
  format: typeof CUADERNO_DOCUMENT_FORMAT
  blocks: CuadernoBlock[]
  /** Emoji shown above the page title (Notion-style page icon). */
  icon?: string
  /** Short description under the title. */
  comment?: string
  /** Solid color or gradient cover id (Notion-style page cover). */
  cover?: string
  /** Parent cuaderno id for nested pages (client-side tree until API supports it). */
  parentId?: string
}

export const BLOCK_TYPE_LABELS: Record<CuadernoBlockType, string> = {
  paragraph: 'Texto',
  heading_1: 'Título 1',
  heading_2: 'Título 2',
  heading_3: 'Título 3',
  bulleted_list_item: 'Viñeta',
  numbered_list_item: 'Numerada',
  to_do: 'Tarea',
  quote: 'Cita',
  code: 'Código',
  divider: 'Divisor',
  image: 'Imagen',
  column_2: '2 columnas',
  table: 'Tabla',
}

export const BLOCK_TYPES_ORDER: CuadernoBlockType[] = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'quote',
  'code',
  'divider',
  'image',
  'column_2',
  'table',
]

export function createBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createBlock(
  type: CuadernoBlockType = 'paragraph',
  text = '',
  indent = 0
): CuadernoBlock {
  const block: CuadernoBlock = { id: createBlockId(), type, indent: clampIndent(indent) }
  if (type !== 'divider') {
    const richText = plainToRichText(text)
    block.richText = richText
    block.text = richTextToPlain(richText)
  }
  if (type === 'to_do') {
    block.checked = false
    block.todoItems = [
      {
        id: createBlockId(),
        richText: plainToRichText(text),
        checked: false,
      },
    ]
  }
  if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
    block.listItems = [createListItem(plainToRichText(text))]
  }
  if (type === 'column_2') {
    block.columns = [createColumnCell(plainToRichText(text)), createColumnCell()]
  }
  if (type === 'table') {
    block.tableRows = createDefaultTableRows()
  }
  return block
}

export function createImageBlock(imageSrc: string, imageAlt?: string, indent = 0): CuadernoBlock {
  return {
    id: createBlockId(),
    type: 'image',
    imageSrc,
    imageAlt: imageAlt?.trim() || undefined,
    indent: clampIndent(indent),
  }
}

export function createEmptyDocument(): CuadernoDocument {
  return {
    version: CUADERNO_DOCUMENT_VERSION,
    format: CUADERNO_DOCUMENT_FORMAT,
    blocks: [createBlock('paragraph')],
  }
}

export function createNewCuadernoDocument(pageMeta?: { icon?: string; cover?: string }): CuadernoDocument {
  const doc = createEmptyDocument()
  doc.icon = resolvePageIcon(pageMeta?.icon)
  doc.cover = resolvePageCover(pageMeta?.cover)
  return doc
}

export function plainTextToDocument(text: string): CuadernoDocument {
  const trimmed = text.trim()
  if (!trimmed) {
    return createEmptyDocument()
  }

  const lines = text.split('\n')
  const blocks: CuadernoBlock[] = lines.map(line => {
    const leadingSpaces = line.match(/^( *)/)?.[1]?.length ?? 0
    const indent = clampIndent(Math.floor(leadingSpaces / 2))
    const trimmedLine = line.trimStart()

    const todoMatch = trimmedLine.match(/^- \[( |x|X)\] (.+)$/)
    if (todoMatch) {
      return {
        id: createBlockId(),
        type: 'to_do',
        text: todoMatch[2],
        checked: todoMatch[1].toLowerCase() === 'x',
        indent,
      }
    }
    if (trimmedLine.startsWith('- ')) {
      return createBlock('bulleted_list_item', trimmedLine.slice(2), indent)
    }
    if (/^\d+\.\s/.test(trimmedLine)) {
      return createBlock('numbered_list_item', trimmedLine.replace(/^\d+\.\s/, ''), indent)
    }
    if (trimmedLine.startsWith('# ')) {
      return createBlock('heading_1', trimmedLine.slice(2), 0)
    }
    if (trimmedLine.startsWith('## ')) {
      return createBlock('heading_2', trimmedLine.slice(3), 0)
    }
    if (trimmedLine.startsWith('### ')) {
      return createBlock('heading_3', trimmedLine.slice(4), 0)
    }
    if (trimmedLine.trim() === '---') {
      return createBlock('divider')
    }
    return createBlock('paragraph', trimmedLine, indent)
  })

  return {
    version: CUADERNO_DOCUMENT_VERSION,
    format: CUADERNO_DOCUMENT_FORMAT,
    blocks: blocks.length > 0 ? blocks : [createBlock('paragraph')],
  }
}

function isCuadernoDocument(value: unknown): value is CuadernoDocument {
  if (!value || typeof value !== 'object') {
    return false
  }
  const doc = value as CuadernoDocument
  return (
    doc.version === CUADERNO_DOCUMENT_VERSION &&
    doc.format === CUADERNO_DOCUMENT_FORMAT &&
    Array.isArray(doc.blocks)
  )
}

function normalizeBlock(raw: unknown): CuadernoBlock | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const block = raw as CuadernoBlock
  if (!block.id || typeof block.id !== 'string') {
    return null
  }
  if (!BLOCK_TYPES_ORDER.includes(block.type)) {
    return null
  }
  if (block.type === 'divider') {
    return { id: block.id, type: 'divider' }
  }
  if (block.type === 'image') {
    const imageSrc = isDataImageSrc(block.imageSrc) ? block.imageSrc : undefined
    if (!imageSrc) {
      return null
    }
    const imageAlt =
      typeof block.imageAlt === 'string' && block.imageAlt.trim()
        ? block.imageAlt.trim().slice(0, 200)
        : undefined
    return {
      id: block.id,
      type: 'image',
      imageSrc,
      imageAlt,
      indent: clampIndent(typeof block.indent === 'number' ? block.indent : 0),
    }
  }
  if (block.type === 'column_2') {
    return {
      id: block.id,
      type: 'column_2',
      indent: clampIndent(typeof block.indent === 'number' ? block.indent : 0),
      ...columnsToBlockPatch(getBlockColumnCells(block)),
    }
  }
  if (block.type === 'table') {
    return {
      id: block.id,
      type: 'table',
      ...tableToBlockPatch(getBlockTableRows(block)),
    }
  }
  if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
    return {
      id: block.id,
      type: block.type,
      indent: clampIndent(typeof block.indent === 'number' ? block.indent : 0),
      ...listItemsToBlockPatch(getBlockListItems(block)),
    }
  }
  const indent = clampIndent(typeof block.indent === 'number' ? block.indent : 0)
  const richText = normalizeRichText(
    Array.isArray(block.richText) && block.richText.length > 0
      ? block.richText
      : plainToRichText(typeof block.text === 'string' ? block.text : '')
  )
  const text = richTextToPlain(richText)
  if (block.type === 'to_do') {
    return {
      id: block.id,
      type: 'to_do',
      indent,
      ...todoItemsToBlockPatch(getBlockTodoItems({ ...block, type: 'to_do', text, richText })),
    }
  }

  return {
    id: block.id,
    type: block.type,
    text,
    richText,
    indent,
  }
}

export function normalizeDocument(doc: CuadernoDocument): CuadernoDocument {
  const blocks = doc.blocks.map(normalizeBlock).filter((b): b is CuadernoBlock => b !== null)
  const normalized: CuadernoDocument = {
    version: CUADERNO_DOCUMENT_VERSION,
    format: CUADERNO_DOCUMENT_FORMAT,
    blocks: blocks.length > 0 ? blocks : [createBlock('paragraph')],
  }
  const icon = normalizePageIcon(doc.icon)
  const comment = normalizePageComment(doc.comment)
  const cover = normalizePageCover(doc.cover)
  const parentId = normalizeParentId(doc.parentId)
  if (icon) {
    normalized.icon = icon
  }
  if (comment) {
    normalized.comment = comment
  }
  if (cover) {
    normalized.cover = cover
  }
  if (parentId) {
    normalized.parentId = parentId
  }
  return normalized
}

/** Actualiza solo bloques preservando metadatos de página sin re-normalizar (p. ej. comentario en edición). */
export function patchDocumentBlocks(doc: CuadernoDocument, blocks: CuadernoBlock[]): CuadernoDocument {
  const normalizedBlocks = blocks.map(normalizeBlock).filter((b): b is CuadernoBlock => b !== null)
  return {
    ...doc,
    version: CUADERNO_DOCUMENT_VERSION,
    format: CUADERNO_DOCUMENT_FORMAT,
    blocks: normalizedBlocks.length > 0 ? normalizedBlocks : [createBlock('paragraph')],
  }
}

export function parseCuadernoContent(content: string): CuadernoDocument {
  const trimmed = content.trim()
  if (!trimmed) {
    return createEmptyDocument()
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (isCuadernoDocument(parsed)) {
        return normalizeDocument(parsed)
      }
    } catch {
      // fallback to plain text
    }
  }

  if (trimmed.startsWith('<cuaderno')) {
    const fromXml = tryParseXmlDocument(trimmed)
    if (fromXml) {
      return fromXml
    }
  }

  return plainTextToDocument(content)
}

export function serializeDocument(doc: CuadernoDocument): string {
  return JSON.stringify(normalizeDocument(doc))
}

export function getDocumentPlainText(doc: CuadernoDocument): string {
  const pad = (indent: number) => '  '.repeat(clampIndent(indent))

  return normalizeDocument(doc)
    .blocks.map(block => {
      if (block.type === 'divider') {
        return '---'
      }
      const text = getBlockPlainText(block).trim()
      const indent = getBlockIndent(block)
      switch (block.type) {
        case 'heading_1':
          return `# ${text}`
        case 'heading_2':
          return `## ${text}`
        case 'heading_3':
          return `### ${text}`
        case 'bulleted_list_item':
          return getBlockListItems(block)
            .map(item => `${pad(indent)}- ${richTextToPlain(item.richText).trim()}`)
            .join('\n')
        case 'numbered_list_item':
          return getBlockListItems(block)
            .map((item, itemIndex) => `${pad(indent)}${itemIndex + 1}. ${richTextToPlain(item.richText).trim()}`)
            .join('\n')
        case 'to_do':
          return getBlockTodoItems(block)
            .map(item => {
              const itemText = richTextToPlain(item.richText).trim()
              return `${pad(indent)}- [${item.checked ? 'x' : ' '}] ${itemText}`
            })
            .join('\n')
        default:
          return indent > 0 ? `${pad(indent)}${text}` : text
      }
    })
    .filter(line => line.length > 0)
    .join('\n')
}

export function documentHasContent(doc: CuadernoDocument): boolean {
  const normalized = normalizeDocument(doc)
  if (normalized.icon || normalized.comment || normalized.cover) {
    return true
  }
  return normalized.blocks.some(block => {
    if (block.type === 'divider') {
      return true
    }
    if (block.type === 'image') {
      return Boolean(block.imageSrc)
    }
    if (block.type === 'column_2' || block.type === 'table') {
      return layoutBlockHasContent(block)
    }
    return Boolean(getBlockPlainText(block).trim())
  })
}

export function getBlockPlainText(block: CuadernoBlock): string {
  if (block.type === 'image') {
    return block.imageAlt?.trim() ?? ''
  }
  if (block.type === 'column_2' || block.type === 'table') {
    return getLayoutBlockPlainText(block)
  }
  return richTextToPlain(getBlockRichText(block))
}

export { getBlockRichText } from './cuadernoRichText'

export function getNumberedListIndex(blocks: CuadernoBlock[], index: number): number {
  const block = blocks[index]
  const indent = getBlockIndent(block)
  let count = 0
  for (let i = index; i >= 0; i -= 1) {
    const current = blocks[i]
    if (current.type !== 'numbered_list_item' || getBlockIndent(current) !== indent) {
      break
    }
    count += 1
  }
  return count
}

/** First list number for a numbered block within a consecutive run at the same indent. */
export function getNumberedBlockStartNumber(blocks: CuadernoBlock[], blockIndex: number): number {
  const block = blocks[blockIndex]
  if (block.type !== 'numbered_list_item') {
    return 1
  }

  const indent = getBlockIndent(block)
  let start = 1
  for (let i = blockIndex - 1; i >= 0; i -= 1) {
    const previous = blocks[i]
    if (previous.type !== 'numbered_list_item' || getBlockIndent(previous) !== indent) {
      break
    }
    start += getBlockListItems(previous).length
  }
  return start
}
