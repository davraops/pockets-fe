import {
  normalizeRichText,
  plainToRichText,
  type RichTextSegment,
} from './cuadernoRichText'

export interface CuadernoInternalLink {
  type: 'cuaderno'
  noteId: string
  title?: string
}

export interface CuadernoLinkTarget {
  id: string
  titulo: string
}

export type CuadernoLinkTrigger = '@' | '[['

export function detectCuadernoLinkTrigger(
  value: string,
  caret: number
): { open: boolean; query: string; trigger: CuadernoLinkTrigger } | null {
  const beforeCaret = value.slice(0, caret)

  const atIndex = beforeCaret.lastIndexOf('@')
  if (atIndex >= 0) {
    const query = beforeCaret.slice(atIndex + 1)
    if (!query.includes('\n') && !query.includes(' ')) {
      return { open: true, query, trigger: '@' }
    }
  }

  const wikiIndex = beforeCaret.lastIndexOf('[[')
  if (wikiIndex >= 0) {
    const query = beforeCaret.slice(wikiIndex + 2)
    if (!query.includes('\n') && !query.includes(']]')) {
      return { open: true, query, trigger: '[[' }
    }
  }

  return null
}

export function buildLinkedRichText(
  plainText: string,
  caret: number,
  trigger: CuadernoLinkTrigger,
  note: CuadernoLinkTarget
): { richText: RichTextSegment[]; plainText: string; caret: number } {
  const beforeCaret = plainText.slice(0, caret)
  const triggerIndex = trigger === '@' ? beforeCaret.lastIndexOf('@') : beforeCaret.lastIndexOf('[[')

  if (triggerIndex === -1) {
    return {
      richText: plainToRichText(plainText),
      plainText,
      caret,
    }
  }

  const prefix = plainText.slice(0, triggerIndex)
  const suffix = plainText.slice(caret)
  const linkText = note.titulo.trim() || 'Cuaderno sin título'
  const newPlain = `${prefix}${linkText}${suffix}`

  const segments: RichTextSegment[] = []
  if (prefix) {
    segments.push({ text: prefix })
  }
  segments.push({
    text: linkText,
    link: { type: 'cuaderno', noteId: note.id, title: linkText },
  })
  if (suffix) {
    segments.push({ text: suffix })
  }

  return {
    richText: normalizeRichText(segments),
    plainText: newPlain,
    caret: prefix.length + linkText.length,
  }
}

export function wrapTextAsCuadernoLink(
  plainText: string,
  selectionStart: number,
  selectionEnd: number,
  note: CuadernoLinkTarget
): { richText: RichTextSegment[]; plainText: string; caret: number } {
  const selected = plainText.slice(selectionStart, selectionEnd).trim()
  const linkText = selected || note.titulo.trim() || 'Cuaderno sin título'
  const prefix = plainText.slice(0, selectionStart)
  const suffix = plainText.slice(selectionEnd)
  const newPlain = `${prefix}${linkText}${suffix}`

  const segments: RichTextSegment[] = []
  if (prefix) {
    segments.push({ text: prefix })
  }
  segments.push({
    text: linkText,
    link: { type: 'cuaderno', noteId: note.id, title: note.titulo },
  })
  if (suffix) {
    segments.push({ text: suffix })
  }

  return {
    richText: normalizeRichText(segments),
    plainText: newPlain,
    caret: prefix.length + linkText.length,
  }
}

export function filterCuadernoLinkTargets(
  notes: CuadernoLinkTarget[],
  query: string,
  excludeNoteId?: string
): CuadernoLinkTarget[] {
  const q = query.trim().toLowerCase()
  return notes
    .filter(note => note.id !== excludeNoteId)
    .filter(note => !q || note.titulo.toLowerCase().includes(q))
    .slice(0, 8)
}

export function getCuadernoLinkPath(noteId: string): string {
  return `/registros/cuadernos/${noteId}`
}
