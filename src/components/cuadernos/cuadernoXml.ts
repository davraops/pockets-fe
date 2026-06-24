import { clampIndent, getBlockIndent } from './cuadernoBlockIndent'
import {
  BLOCK_TYPES_ORDER,
  createBlock,
  createBlockId,
  createEmptyDocument,
  normalizeDocument,
  type CuadernoBlock,
  type CuadernoBlockType,
  type CuadernoDocument,
} from './cuadernoDocument'
import { createListItem, getBlockListItems, listItemsToBlockPatch, normalizeListItems } from './cuadernoListItems'
import { getBlockTodoItems, normalizeTodoItems, todoItemsToBlockPatch } from './cuadernoTodoItems'
import {
  columnsToBlockPatch,
  getBlockColumnCells,
  getBlockTableRows,
  normalizeColumnCells,
  normalizeTableRows,
  tableToBlockPatch,
} from './cuadernoBlockLayouts'
import { normalizePageComment, normalizePageIcon, normalizePageCover, normalizeParentId } from './cuadernoPageMeta'
import {
  getBlockRichText,
  normalizeRichText,
  plainToRichText,
  richTextToPlain,
  type InlineMark,
  type RichTextSegment,
} from './cuadernoRichText'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function unescapeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

function runsToXml(segments: RichTextSegment[]): string {
  return normalizeRichText(segments)
    .map(segment => {
      const markAttrs =
        segment.marks?.map(mark => `${mark}="true"`).join(' ') ?? ''
      const linkAttrs =
        segment.link?.type === 'cuaderno'
          ? `link="${escapeXml(segment.link.noteId)}"${
              segment.link.title ? ` link-title="${escapeXml(segment.link.title)}"` : ''
            }`
          : ''
      const attrs = [markAttrs, linkAttrs].filter(Boolean).join(' ')
      const attrString = attrs ? ` ${attrs}` : ''
      return `<run${attrString}>${escapeXml(segment.text)}</run>`
    })
    .join('')
}

function parseRunElement(element: Element): RichTextSegment {
  const marks: InlineMark[] = []
  ;(['bold', 'italic', 'underline', 'strikethrough', 'code'] as InlineMark[]).forEach(mark => {
    if (element.getAttribute(mark) === 'true') {
      marks.push(mark)
    }
  })
  const linkId = element.getAttribute('link')
  const linkTitle = element.getAttribute('link-title')
  const link =
    linkId && linkId.length > 0
      ? {
          type: 'cuaderno' as const,
          noteId: linkId,
          title: linkTitle ?? undefined,
        }
      : undefined
  return {
    text: unescapeXml(element.textContent ?? ''),
    marks: marks.length > 0 ? marks : undefined,
    link,
  }
}

function parseRuns(element: Element): RichTextSegment[] {
  const runElements = element.querySelectorAll(':scope > run')
  if (runElements.length === 0) {
    return plainToRichText(unescapeXml(element.textContent ?? ''))
  }
  return normalizeRichText(Array.from(runElements).map(parseRunElement))
}

export function documentToXml(doc: CuadernoDocument): string {
  const normalized = normalizeDocument(doc)
  const metaAttrs = [
    normalized.icon ? ` icon="${escapeXml(normalized.icon)}"` : '',
    normalized.comment ? ` comment="${escapeXml(normalized.comment)}"` : '',
    normalized.cover ? ` cover="${escapeXml(normalized.cover)}"` : '',
    normalized.parentId ? ` parent="${escapeXml(normalized.parentId)}"` : '',
  ].join('')
  const lines = [`<cuaderno version="1"${metaAttrs}>`]

  normalized.blocks.forEach(block => {
    const indentAttr =
      getBlockIndent(block) > 0 ? ` indent="${getBlockIndent(block)}"` : ''

    if (block.type === 'divider') {
      lines.push(`  <block type="divider"${indentAttr} />`)
      return
    }

    const richText = getBlockRichText(block)
    const runsXml = runsToXml(richText)

    if (block.type === 'to_do') {
      const items = getBlockTodoItems(block)
      const itemsXml = items
        .map(
          item =>
            `    <item checked="${item.checked ? 'true' : 'false'}">${runsToXml(item.richText)}</item>`
        )
        .join('\n')
      lines.push(`  <block type="to_do"${indentAttr}>\n${itemsXml}\n  </block>`)
      return
    }

    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const items = getBlockListItems(block)
      const itemsXml = items
        .map(item => `    <item>${runsToXml(item.richText)}</item>`)
        .join('\n')
      lines.push(`  <block type="${block.type}"${indentAttr}>\n${itemsXml}\n  </block>`)
      return
    }

    if (block.type === 'column_2') {
      const columnsXml = getBlockColumnCells(block)
        .map(column => `    <column>${runsToXml(column.richText)}</column>`)
        .join('\n')
      lines.push(`  <block type="column_2"${indentAttr}>\n${columnsXml}\n  </block>`)
      return
    }

    if (block.type === 'table') {
      const rowsXml = getBlockTableRows(block)
        .map(
          row =>
            `    <row>${row.cells.map(cell => `<cell>${runsToXml(cell.richText)}</cell>`).join('')}</row>`
        )
        .join('\n')
      lines.push(`  <block type="table">\n${rowsXml}\n  </block>`)
      return
    }

    lines.push(`  <block type="${block.type}"${indentAttr}>${runsXml}</block>`)
  })

  lines.push('</cuaderno>')
  return lines.join('\n')
}

function parseBlockElement(element: Element): CuadernoBlock | null {
  const type = element.getAttribute('type') as CuadernoBlockType | null
  if (!type || !BLOCK_TYPES_ORDER.includes(type)) {
    return null
  }

  const indentAttr = element.getAttribute('indent')
  const indent = indentAttr ? clampIndent(Number.parseInt(indentAttr, 10)) : 0

  if (type === 'divider') {
    return { id: createBlockId(), type: 'divider', indent }
  }

  const richText = parseRuns(element)
  const text = richTextToPlain(richText)

  if (type === 'to_do') {
    const itemElements = element.querySelectorAll(':scope > item')
    if (itemElements.length > 0) {
      const todoItems = normalizeTodoItems(
        Array.from(itemElements).map(itemElement => ({
          id: createBlockId(),
          richText: parseRuns(itemElement),
          checked: itemElement.getAttribute('checked') === 'true',
        }))
      )
      return {
        id: createBlockId(),
        type: 'to_do',
        indent,
        ...todoItemsToBlockPatch(todoItems),
      }
    }

    return {
      id: createBlockId(),
      type: 'to_do',
      text,
      richText,
      checked: element.getAttribute('checked') === 'true',
      indent,
    }
  }

  if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
    const itemElements = element.querySelectorAll(':scope > item')
    if (itemElements.length > 0) {
      const listItems = normalizeListItems(
        Array.from(itemElements).map(itemElement => ({
          id: createBlockId(),
          richText: parseRuns(itemElement),
        }))
      )
      return {
        id: createBlockId(),
        type,
        indent,
        ...listItemsToBlockPatch(listItems),
      }
    }

    return {
      id: createBlockId(),
      type,
      indent,
      ...listItemsToBlockPatch([createListItem(richText)]),
    }
  }

  if (type === 'column_2') {
    const columnElements = element.querySelectorAll(':scope > column')
    const columns = normalizeColumnCells(
      Array.from(columnElements).map(columnElement => ({
        id: createBlockId(),
        richText: parseRuns(columnElement),
      }))
    )
    return {
      id: createBlockId(),
      type: 'column_2',
      indent,
      ...columnsToBlockPatch(columns),
    }
  }

  if (type === 'table') {
    const rowElements = element.querySelectorAll(':scope > row')
    const tableRows = normalizeTableRows(
      Array.from(rowElements).map(rowElement => ({
        id: createBlockId(),
        cells: Array.from(rowElement.querySelectorAll(':scope > cell')).map(cellElement => ({
          id: createBlockId(),
          richText: parseRuns(cellElement),
        })),
      }))
    )
    return {
      id: createBlockId(),
      type: 'table',
      ...tableToBlockPatch(tableRows),
    }
  }

  return { id: createBlockId(), type, text, richText, indent }
}

export function xmlToDocument(xml: string): CuadernoDocument {
  const trimmed = xml.trim()
  if (!trimmed) {
    return createEmptyDocument()
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(trimmed, 'application/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('XML inválido')
  }

  const root = doc.querySelector('cuaderno')
  if (!root) {
    throw new Error('Raíz <cuaderno> no encontrada')
  }

  const blocks: CuadernoBlock[] = []
  root.querySelectorAll(':scope > block').forEach(element => {
    const block = parseBlockElement(element)
    if (block) {
      blocks.push(block)
    }
  })

  if (blocks.length === 0) {
    return createEmptyDocument()
  }

  const icon = normalizePageIcon(root.getAttribute('icon') ?? undefined)
  const comment = normalizePageComment(root.getAttribute('comment') ?? undefined)
  const cover = normalizePageCover(root.getAttribute('cover') ?? undefined)
  const parentId = normalizeParentId(root.getAttribute('parent') ?? undefined)

  return normalizeDocument({
    version: 1,
    format: 'cuaderno-blocks',
    blocks,
    ...(icon ? { icon } : {}),
    ...(comment ? { comment } : {}),
    ...(cover ? { cover } : {}),
    ...(parentId ? { parentId } : {}),
  })
}

export function tryParseXmlDocument(xml: string): CuadernoDocument | null {
  try {
    return xmlToDocument(xml)
  } catch {
    return null
  }
}
