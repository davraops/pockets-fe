import type { InlineMark } from './cuadernoRichText'

export function isModKey(event: React.KeyboardEvent | KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

const EXEC_COMMANDS: Partial<Record<InlineMark, string>> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strikethrough: 'strikeThrough',
}

export function toggleInlineMark(mark: InlineMark): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false
  }

  if (mark === 'code') {
    return wrapSelectionWithTag('code')
  }

  const command = EXEC_COMMANDS[mark]
  if (!command) {
    return false
  }

  return document.execCommand(command)
}

function wrapSelectionWithTag(tagName: string): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false
  }

  const range = selection.getRangeAt(0)
  const wrapper = document.createElement(tagName)

  try {
    range.surroundContents(wrapper)
  } catch {
    const fragment = range.extractContents()
    wrapper.appendChild(fragment)
    range.insertNode(wrapper)
  }

  selection.removeAllRanges()
  const nextRange = document.createRange()
  nextRange.selectNodeContents(wrapper)
  nextRange.collapse(false)
  selection.addRange(nextRange)
  return true
}

export function isMarkActive(mark: InlineMark): boolean {
  if (mark === 'code') {
    const selection = window.getSelection()
    if (!selection?.anchorNode) {
      return false
    }
    const element =
      selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as Element)
        : selection.anchorNode.parentElement
    return Boolean(element?.closest('code'))
  }

  const command = EXEC_COMMANDS[mark]
  if (!command) {
    return false
  }

  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

export function matchInlineShortcut(event: React.KeyboardEvent): InlineMark | null {
  if (!isModKey(event) || event.altKey) {
    return null
  }

  const key = event.key.toLowerCase()

  if (key === 'b') {
    return 'bold'
  }
  if (key === 'i') {
    return 'italic'
  }
  if (key === 'u') {
    return 'underline'
  }
  if (key === 'e') {
    return 'code'
  }
  if (key === 's' && event.shiftKey) {
    return 'strikethrough'
  }

  return null
}
