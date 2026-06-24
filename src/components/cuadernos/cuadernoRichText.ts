import type { CuadernoBlock, CuadernoBlockType } from './cuadernoDocument'
import type { CuadernoInternalLink } from './cuadernoLinkUtils'
import { getCuadernoLinkPath } from './cuadernoLinkUtils'
import { isEmptyContentEditableHtml } from './cuadernoContentEditableUtils'

export type InlineMark = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code'

export interface RichTextSegment {
  text: string
  marks?: InlineMark[]
  link?: CuadernoInternalLink
}

const MARK_ORDER: InlineMark[] = ['bold', 'italic', 'underline', 'strikethrough', 'code']

export function supportsInlineFormatting(type: CuadernoBlockType): boolean {
  return type !== 'code' && type !== 'divider' && type !== 'column_2' && type !== 'table'
}

export function richTextToPlain(segments: RichTextSegment[]): string {
  return segments.map(segment => segment.text).join('')
}

export function plainToRichText(text: string): RichTextSegment[] {
  if (!text) {
    return [{ text: '' }]
  }
  return [{ text }]
}

export function getBlockRichText(block: CuadernoBlock): RichTextSegment[] {
  if (Array.isArray(block.richText) && block.richText.length > 0) {
    return normalizeRichText(block.richText)
  }
  return plainToRichText(block.text ?? '')
}

export function getBlockPlainText(block: CuadernoBlock): string {
  return richTextToPlain(getBlockRichText(block))
}

function sortMarks(marks: InlineMark[] | undefined): InlineMark[] | undefined {
  if (!marks || marks.length === 0) {
    return undefined
  }
  const unique = [...new Set(marks)]
  const sorted = MARK_ORDER.filter(mark => unique.includes(mark))
  return sorted.length > 0 ? sorted : undefined
}

function marksEqual(a: InlineMark[] | undefined, b: InlineMark[] | undefined): boolean {
  const left = sortMarks(a)?.join(',') ?? ''
  const right = sortMarks(b)?.join(',') ?? ''
  return left === right
}

function linksEqual(a: CuadernoInternalLink | undefined, b: CuadernoInternalLink | undefined): boolean {
  return (a?.noteId ?? '') === (b?.noteId ?? '')
}

function normalizeLink(link: unknown): CuadernoInternalLink | undefined {
  if (!link || typeof link !== 'object') {
    return undefined
  }
  const value = link as CuadernoInternalLink
  if (value.type !== 'cuaderno' || !value.noteId) {
    return undefined
  }
  return {
    type: 'cuaderno',
    noteId: value.noteId,
    title: typeof value.title === 'string' ? value.title : undefined,
  }
}

export function normalizeRichText(segments: RichTextSegment[]): RichTextSegment[] {
  const normalized: RichTextSegment[] = []

  segments.forEach(segment => {
    if (!segment || typeof segment.text !== 'string') {
      return
    }
    const marks = sortMarks(
      Array.isArray(segment.marks)
        ? segment.marks.filter((mark): mark is InlineMark => MARK_ORDER.includes(mark))
        : undefined
    )
    const link = normalizeLink(segment.link)
    const text = segment.text
    if (text.length === 0) {
      return
    }
    const last = normalized[normalized.length - 1]
    if (last && marksEqual(last.marks, marks) && linksEqual(last.link, link)) {
      last.text += text
      return
    }
    normalized.push({ text, marks, link })
  })

  return normalized.length > 0 ? normalized : [{ text: '' }]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;')
}

function wrapWithMarks(text: string, marks: InlineMark[] | undefined): string {
  let html = escapeHtml(text)
  const sorted = sortMarks(marks) ?? []
  if (sorted.includes('code')) {
    html = `<code>${html}</code>`
  }
  if (sorted.includes('strikethrough')) {
    html = `<s>${html}</s>`
  }
  if (sorted.includes('underline')) {
    html = `<u>${html}</u>`
  }
  if (sorted.includes('italic')) {
    html = `<em>${html}</em>`
  }
  if (sorted.includes('bold')) {
    html = `<strong>${html}</strong>`
  }
  return html
}

function segmentToHtml(segment: RichTextSegment): string {
  let html = wrapWithMarks(segment.text, segment.marks)
  if (segment.link?.type === 'cuaderno') {
    const href = getCuadernoLinkPath(segment.link.noteId)
    const title = segment.link.title ?? segment.text
    html = `<a class="cuaderno-internal-link" href="${href}" data-cuaderno-id="${segment.link.noteId}" data-cuaderno-title="${escapeAttr(title)}">${html}</a>`
  }
  return html
}

export function richTextToHtml(segments: RichTextSegment[]): string {
  const normalized = normalizeRichText(segments)
  if (normalized.length === 1 && normalized[0].text === '') {
    return ''
  }
  return normalized.map(segment => segmentToHtml(segment)).join('')
}

function addMarks(base: InlineMark[], extra: InlineMark[]): InlineMark[] {
  return sortMarks([...base, ...extra]) ?? []
}

function marksFromElement(element: HTMLElement): InlineMark[] {
  const tag = element.tagName.toLowerCase()
  const marks: InlineMark[] = []
  if (tag === 'strong' || tag === 'b') {
    marks.push('bold')
  }
  if (tag === 'em' || tag === 'i') {
    marks.push('italic')
  }
  if (tag === 'u') {
    marks.push('underline')
  }
  if (tag === 's' || tag === 'strike' || tag === 'del') {
    marks.push('strikethrough')
  }
  if (tag === 'code') {
    marks.push('code')
  }
  return marks
}

function linkFromAnchor(element: HTMLElement): CuadernoInternalLink | undefined {
  const noteId = element.getAttribute('data-cuaderno-id')
  if (!noteId) {
    return undefined
  }
  return {
    type: 'cuaderno',
    noteId,
    title: element.getAttribute('data-cuaderno-title') ?? undefined,
  }
}

function walkRichTextNode(
  node: Node,
  activeMarks: InlineMark[],
  activeLink: CuadernoInternalLink | undefined,
  segments: RichTextSegment[]
) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    if (text.length > 0) {
      segments.push({
        text,
        marks: activeMarks.length > 0 ? [...activeMarks] : undefined,
        link: activeLink,
      })
    }
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return
  }

  const element = node as HTMLElement
  const tag = element.tagName.toLowerCase()
  if (tag === 'br') {
    segments.push({ text: '\n' })
    return
  }

  const anchorLink = tag === 'a' ? linkFromAnchor(element) : undefined
  const nextLink = anchorLink ?? activeLink
  const nextMarks = anchorLink ? activeMarks : addMarks(activeMarks, marksFromElement(element))

  element.childNodes.forEach(child => walkRichTextNode(child, nextMarks, nextLink, segments))
}

export function htmlToRichText(html: string): RichTextSegment[] {
  if (isEmptyContentEditableHtml(html)) {
    return [{ text: '' }]
  }
  const template = document.createElement('div')
  template.innerHTML = html
  const segments: RichTextSegment[] = []
  template.childNodes.forEach(child => walkRichTextNode(child, [], undefined, segments))
  return normalizeRichText(segments)
}

export function richTextFromElement(element: HTMLElement): RichTextSegment[] {
  return htmlToRichText(element.innerHTML)
}

export function syncRichTextHtml(element: HTMLElement, segments: RichTextSegment[]) {
  const html = richTextToHtml(segments)
  const nextHtml = html || '<br>'
  const currentEmpty = isEmptyContentEditableHtml(element.innerHTML)
  const nextEmpty = !html

  if (currentEmpty && nextEmpty) {
    if (element.innerHTML !== '<br>') {
      element.innerHTML = '<br>'
    }
    return
  }

  if (element.innerHTML !== nextHtml) {
    element.innerHTML = nextHtml
  }
}

export function isRichTextEmpty(segments: RichTextSegment[]): boolean {
  return richTextToPlain(segments).trim().length === 0
}

export function splitRichTextAt(
  segments: RichTextSegment[],
  offset: number
): { before: RichTextSegment[]; after: RichTextSegment[] } {
  const normalized = normalizeRichText(segments)
  const plain = richTextToPlain(normalized)
  const clampedOffset = Math.min(Math.max(0, offset), plain.length)

  if (clampedOffset <= 0) {
    return { before: [{ text: '' }], after: normalized }
  }
  if (clampedOffset >= plain.length) {
    return { before: normalized, after: [{ text: '' }] }
  }

  const before: RichTextSegment[] = []
  const after: RichTextSegment[] = []
  let cursor = 0

  for (const segment of normalized) {
    const segmentEnd = cursor + segment.text.length
    if (segmentEnd <= clampedOffset) {
      before.push({ ...segment })
      cursor = segmentEnd
      continue
    }
    if (cursor >= clampedOffset) {
      after.push({ ...segment })
      continue
    }

    const splitAt = clampedOffset - cursor
    const leftText = segment.text.slice(0, splitAt)
    const rightText = segment.text.slice(splitAt)
    if (leftText) {
      before.push({ text: leftText, marks: segment.marks, link: segment.link })
    }
    if (rightText) {
      after.push({ text: rightText, marks: segment.marks, link: segment.link })
    }
    cursor = segmentEnd
  }

  return {
    before: normalizeRichText(before.length > 0 ? before : [{ text: '' }]),
    after: normalizeRichText(after.length > 0 ? after : [{ text: '' }]),
  }
}

export function resolveLinkTitles(
  segments: RichTextSegment[],
  notes: Array<{ id: string; titulo: string }>
): RichTextSegment[] {
  return normalizeRichText(
    segments.map(segment => {
      if (segment.link?.type !== 'cuaderno') {
        return segment
      }
      const note = notes.find(item => item.id === segment.link?.noteId)
      if (!note) {
        return segment
      }
      return {
        ...segment,
        text: segment.text || note.titulo,
        link: { ...segment.link, title: note.titulo },
      }
    })
  )
}
