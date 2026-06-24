import { useLayoutEffect, useRef, useState } from 'react'
import CuadernoBlockInput, { type CuadernoBlockInputHandle } from './CuadernoBlockInput'
import { isCaretAtStart } from './cuadernoContentEditableUtils'
import {
  createTodoItem,
  type CuadernoTodoItem,
} from './cuadernoTodoItems'
import {
  richTextFromElement,
  richTextToPlain,
  splitRichTextAt,
  type RichTextSegment,
} from './cuadernoRichText'
import './cuadernoEditor.css'

interface TodoFocusHint {
  index: number
  caret: number
}

interface CuadernoTodoBlockEditorProps {
  blockId: string
  items: CuadernoTodoItem[]
  enableFormatting?: boolean
  onItemsChange: (items: CuadernoTodoItem[]) => void
  onItemTextChange?: (index: number, richText: RichTextSegment[], plainText: string, caret: number) => void
  onFocus?: () => void
  onBlur?: () => void
  onRemoveBlock?: () => void
}

function CuadernoTodoBlockEditor({
  blockId,
  items,
  enableFormatting = false,
  onItemsChange,
  onItemTextChange,
  onFocus,
  onBlur,
  onRemoveBlock,
}: CuadernoTodoBlockEditorProps) {
  const inputRefs = useRef<Array<CuadernoBlockInputHandle | null>>([])
  const [focusHint, setFocusHint] = useState<TodoFocusHint | null>(null)

  const focusItem = (index: number, caret: number) => {
    setFocusHint({ index, caret })
  }

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
  }, [focusHint])

  const updateItem = (index: number, patch: Partial<CuadernoTodoItem>) => {
    const next = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    )
    onItemsChange(next)
  }

  const handleItemRichTextChange = (
    index: number,
    richText: RichTextSegment[],
    plainText: string,
    caret: number
  ) => {
    updateItem(index, { richText })
    onItemTextChange?.(index, richText, plainText, caret)
  }

  const handleItemKeyDown = (index: number, event: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRefs.current[index]
    const el = input?.getElement()
    const value = input?.getText() ?? richTextToPlain(items[index]?.richText ?? [{ text: '' }])

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!el) {
        const next = [...items]
        next.splice(index + 1, 0, createTodoItem())
        onItemsChange(next)
        focusItem(index + 1, 0)
        return
      }

      const richText = richTextFromElement(el)
      const caret = input?.getCaret() ?? richTextToPlain(richText).length
      const { before, after } = splitRichTextAt(richText, caret)
      const next = [...items]
      next[index] = { ...items[index], richText: before }
      next.splice(index + 1, 0, createTodoItem(after))
      input.applyRichText(before, richTextToPlain(before).length, { focus: false })
      onItemsChange(next)
      focusItem(index + 1, 0)
      return
    }

    if (event.key === 'Backspace' && value === '') {
      event.preventDefault()
      if (items.length > 1) {
        const next = items.filter((_, itemIndex) => itemIndex !== index)
        onItemsChange(next)
        focusItem(Math.max(index - 1, 0), -1)
        return
      }
      onRemoveBlock?.()
    }

    if (event.key === 'ArrowUp' && el && isCaretAtStart(el) && index > 0) {
      event.preventDefault()
      focusItem(index - 1, -1)
    }

    if (event.key === 'ArrowDown' && el && input && index < items.length - 1) {
      const caretAtEnd = input.getCaret() === value.length
      if (caretAtEnd) {
        event.preventDefault()
        focusItem(index + 1, 0)
      }
    }
  }

  return (
    <div className="cuaderno-todo-block" role="group" aria-label="Lista de tareas">
      {items.map((item, index) => (
        <div key={item.id} className="cuaderno-todo-item">
          <label className="cuaderno-block-todo">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={event => updateItem(index, { checked: event.target.checked })}
              aria-label={`Marcar tarea ${index + 1}`}
            />
          </label>
          <CuadernoBlockInput
            ref={handle => {
              inputRefs.current[index] = handle
            }}
            blockId={`${blockId}:${item.id}`}
            richText={item.richText}
            enableFormatting={enableFormatting}
            ariaLabel={`Tarea ${index + 1}`}
            onRichTextChange={(richText, plainText, caret) =>
              handleItemRichTextChange(index, richText, plainText, caret)
            }
            onKeyDown={event => handleItemKeyDown(index, event)}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
      ))}
    </div>
  )
}

export default CuadernoTodoBlockEditor
