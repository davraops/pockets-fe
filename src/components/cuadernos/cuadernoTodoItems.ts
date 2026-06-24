import { createBlockId, type CuadernoBlock } from './cuadernoDocument'
import {
  normalizeRichText,
  plainToRichText,
  richTextToPlain,
  type RichTextSegment,
} from './cuadernoRichText'

export interface CuadernoTodoItem {
  id: string
  richText: RichTextSegment[]
  checked: boolean
}

export function createTodoItem(
  richText: RichTextSegment[] = [{ text: '' }],
  checked = false
): CuadernoTodoItem {
  const normalized = normalizeRichText(richText)
  return {
    id: createBlockId(),
    richText: normalized,
    checked,
  }
}

export function normalizeTodoItems(items: unknown): CuadernoTodoItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [createTodoItem()]
  }

  const normalized = items
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const value = item as CuadernoTodoItem
      const richText = normalizeRichText(
        Array.isArray(value.richText) && value.richText.length > 0
          ? value.richText
          : plainToRichText(typeof (item as { text?: string }).text === 'string' ? (item as { text?: string }).text! : '')
      )
      return {
        id: typeof value.id === 'string' && value.id ? value.id : createBlockId(),
        richText,
        checked: Boolean(value.checked),
      }
    })
    .filter((item): item is CuadernoTodoItem => item !== null)

  return normalized.length > 0 ? normalized : [createTodoItem()]
}

export function getBlockTodoItems(block: CuadernoBlock): CuadernoTodoItem[] {
  if (block.type !== 'to_do') {
    return [createTodoItem()]
  }
  if (Array.isArray(block.todoItems) && block.todoItems.length > 0) {
    return normalizeTodoItems(block.todoItems)
  }
  const richText = normalizeRichText(
    Array.isArray(block.richText) && block.richText.length > 0
      ? block.richText
      : plainToRichText(block.text ?? '')
  )
  return [createTodoItem(richText, Boolean(block.checked))]
}

export function todoItemsToBlockPatch(items: CuadernoTodoItem[]): Pick<
  CuadernoBlock,
  'todoItems' | 'text' | 'richText' | 'checked'
> {
  const normalized = normalizeTodoItems(items)
  const joinedRichText = normalized.flatMap((item, index) => {
    const segments = normalizeRichText(item.richText)
    if (index === 0) {
      return segments
    }
    return [{ text: '\n' }, ...segments]
  })
  const text = normalized.map(item => richTextToPlain(item.richText)).join('\n')
  return {
    todoItems: normalized,
    text,
    richText: joinedRichText.length > 0 ? joinedRichText : [{ text: '' }],
    checked: normalized[0]?.checked ?? false,
  }
}

export function todoItemsEqual(a: CuadernoTodoItem[], b: CuadernoTodoItem[]): boolean {
  return JSON.stringify(normalizeTodoItems(a)) === JSON.stringify(normalizeTodoItems(b))
}
