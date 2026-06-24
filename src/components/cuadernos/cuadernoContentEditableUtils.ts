export function isEmptyContentEditableHtml(html: string): boolean {
  const normalized = html.replace(/\s/g, '').toLowerCase()
  return normalized === '' || normalized === '<br>' || normalized === '<br/>'
}

export function getContentEditableText(element: HTMLElement): string {
  if (isEmptyContentEditableHtml(element.innerHTML)) {
    return ''
  }
  return element.innerText.replace(/\u00a0/g, ' ').replace(/\n$/, '')
}

export function ensureContentEditableCaretHost(element: HTMLElement) {
  if (getContentEditableText(element).length > 0) {
    return
  }
  if (!isEmptyContentEditableHtml(element.innerHTML)) {
    return
  }
  if (element.innerHTML !== '<br>') {
    element.innerHTML = '<br>'
  }
}

export function placeCaretInEmptyContentEditable(element: HTMLElement, atEnd = false) {
  ensureContentEditableCaretHost(element)
  const selection = window.getSelection()
  if (!selection) {
    return
  }

  const range = document.createRange()
  const br = element.querySelector('br')
  if (br && getContentEditableText(element).length === 0) {
    if (atEnd) {
      range.setStartAfter(br)
    } else {
      range.setStartBefore(br)
    }
    range.collapse(true)
  } else {
    range.selectNodeContents(element)
    range.collapse(atEnd)
  }

  selection.removeAllRanges()
  selection.addRange(range)
}

export function getContentEditableCaret(element: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return getContentEditableText(element).length
  }

  const range = selection.getRangeAt(0)
  if (!element.contains(range.startContainer)) {
    return getContentEditableText(element).length
  }

  const preRange = range.cloneRange()
  preRange.selectNodeContents(element)
  preRange.setEnd(range.startContainer, range.startOffset)
  return preRange.toString().length
}

export function setContentEditableCaret(element: HTMLElement, offset: number) {
  const selection = window.getSelection()
  if (!selection) {
    return
  }

  const text = getContentEditableText(element)
  const targetOffset = Math.min(Math.max(0, offset), text.length)

  if (text.length === 0) {
    placeCaretInEmptyContentEditable(element, targetOffset > 0)
    return
  }

  if (!element.firstChild) {
    element.appendChild(document.createTextNode(text))
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let currentOffset = 0
  let textNode = walker.nextNode() as Text | null

  while (textNode) {
    const nodeLength = textNode.textContent?.length ?? 0
    if (currentOffset + nodeLength >= targetOffset) {
      const range = document.createRange()
      range.setStart(textNode, targetOffset - currentOffset)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      return
    }
    currentOffset += nodeLength
    textNode = walker.nextNode() as Text | null
  }

  const range = document.createRange()
  range.selectNodeContents(element)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function getContentEditableSelectionOffsets(element: HTMLElement): {
  start: number
  end: number
} {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    const caret = getContentEditableCaret(element)
    return { start: caret, end: caret }
  }

  const range = selection.getRangeAt(0)
  if (!element.contains(range.commonAncestorContainer)) {
    const caret = getContentEditableCaret(element)
    return { start: caret, end: caret }
  }

  const startRange = range.cloneRange()
  startRange.selectNodeContents(element)
  startRange.setEnd(range.startContainer, range.startOffset)

  const endRange = range.cloneRange()
  endRange.selectNodeContents(element)
  endRange.setEnd(range.endContainer, range.endOffset)

  const start = startRange.toString().length
  const end = endRange.toString().length
  return { start: Math.min(start, end), end: Math.max(start, end) }
}

export function focusContentEditableAtEnd(element: HTMLElement) {
  element.focus()
  if (getContentEditableText(element).length === 0) {
    placeCaretInEmptyContentEditable(element, true)
    return
  }
  setContentEditableCaret(element, getContentEditableText(element).length)
}

export function getCollapsedCaretRect(element: HTMLElement): DOMRect | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return null
  }

  const range = selection.getRangeAt(0)
  if (!element.contains(range.startContainer)) {
    return null
  }

  const rects = range.getClientRects()
  if (rects.length > 0 && rects[0].height > 0) {
    return rects[0]
  }

  const boundingRect = range.getBoundingClientRect()
  if (boundingRect.height > 0) {
    return boundingRect
  }

  const probe = document.createElement('span')
  probe.textContent = '\u200b'
  const probeRange = range.cloneRange()
  probeRange.collapse(true)

  try {
    probeRange.insertNode(probe)
    const probeRect = probe.getBoundingClientRect()
    if (probeRect.height > 0) {
      return probeRect
    }
  } finally {
    probe.remove()
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const elementRect = element.getBoundingClientRect()
  const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight)
  const height = Number.isFinite(lineHeight) ? lineHeight : 22
  return new DOMRect(elementRect.left, elementRect.top + 4, 0, height)
}

export function isCaretAtStart(element: HTMLElement): boolean {
  return getContentEditableCaret(element) === 0
}

export function isCaretAtEnd(element: HTMLElement): boolean {
  return getContentEditableCaret(element) === getContentEditableText(element).length
}

export function insertPlainTextAtSelection(text: string) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return
  }
  selection.deleteFromDocument()
  selection.getRangeAt(0).insertNode(document.createTextNode(text))
  selection.collapseToEnd()
}

export function normalizeInlineText(text: string, allowMultiline: boolean): string {
  const normalized = text.replace(/\u00a0/g, ' ')
  if (allowMultiline) {
    return normalized
  }
  return normalized.replace(/\n/g, ' ')
}

export function syncContentEditableText(element: HTMLElement, value: string) {
  const current = getContentEditableText(element)
  if (current === value) {
    return
  }
  element.textContent = value
}
