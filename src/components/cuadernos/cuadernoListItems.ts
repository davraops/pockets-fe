import { createBlockId, type CuadernoBlock } from './cuadernoDocument'
import {
  normalizeRichText,
  plainToRichText,
  richTextToPlain,
  type RichTextSegment,
} from './cuadernoRichText'

export interface CuadernoListItem {
  id: string
  richText: RichTextSegment[]
}

export function createListItem(richText: RichTextSegment[] = [{ text: '' }]): CuadernoListItem {
  return {
    id: createBlockId(),
    richText: normalizeRichText(richText),
  }
}

export function normalizeListItems(items: unknown): CuadernoListItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [createListItem()]
  }

  const normalized = items
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const value = item as CuadernoListItem
      const richText = normalizeRichText(
        Array.isArray(value.richText) && value.richText.length > 0
          ? value.richText
          : plainToRichText(
              typeof (item as { text?: string }).text === 'string' ? (item as { text?: string }).text! : ''
            )
      )
      return {
        id: typeof value.id === 'string' && value.id ? value.id : createBlockId(),
        richText,
      }
    })
    .filter((item): item is CuadernoListItem => item !== null)

  return normalized.length > 0 ? normalized : [createListItem()]
}

export function getBlockListItems(block: CuadernoBlock): CuadernoListItem[] {
  if (block.type !== 'bulleted_list_item' && block.type !== 'numbered_list_item') {
    return [createListItem()]
  }
  if (Array.isArray(block.listItems) && block.listItems.length > 0) {
    return normalizeListItems(block.listItems)
  }
  const richText = normalizeRichText(
    Array.isArray(block.richText) && block.richText.length > 0
      ? block.richText
      : plainToRichText(block.text ?? '')
  )
  return [createListItem(richText)]
}

export function listItemsToBlockPatch(
  items: CuadernoListItem[]
): Pick<CuadernoBlock, 'listItems' | 'text' | 'richText'> {
  const normalized = normalizeListItems(items)
  const joinedRichText = normalized.flatMap((item, index) => {
    const segments = normalizeRichText(item.richText)
    if (index === 0) {
      return segments
    }
    return [{ text: '\n' }, ...segments]
  })
  const text = normalized.map(item => richTextToPlain(item.richText)).join('\n')
  return {
    listItems: normalized,
    text,
    richText: joinedRichText.length > 0 ? joinedRichText : [{ text: '' }],
  }
}

export function listItemsEqual(a: CuadernoListItem[], b: CuadernoListItem[]): boolean {
  return JSON.stringify(normalizeListItems(a)) === JSON.stringify(normalizeListItems(b))
}
