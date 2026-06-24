import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
import { documentHasContent, getDocumentPlainText, parseCuadernoContent } from './cuadernoDocument'
import type { Note } from './cuadernosTypes'

export function formatNoteDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNotePreview(contenido: string, maxLength = 100): string {
  const doc = parseCuadernoContent(contenido)
  if (doc.comment) {
    return doc.comment.length > maxLength ? `${doc.comment.substring(0, maxLength)}...` : doc.comment
  }
  const plain = getDocumentPlainText(doc)
  return plain.length > maxLength ? `${plain.substring(0, maxLength)}...` : plain
}

export function getNotePageIcon(contenido: string): string | undefined {
  return parseCuadernoContent(contenido).icon
}

export function getNotePageCover(contenido: string): string | undefined {
  return parseCuadernoContent(contenido).cover
}

export function formatNoteMeta(note: Note): string {
  if (note.fechaCreacion === note.fechaActualizacion) {
    return `Creado: ${formatNoteDate(note.fechaCreacion)}`
  }
  return `Creado: ${formatNoteDate(note.fechaCreacion)} · Actualizado: ${formatNoteDate(note.fechaActualizacion)}`
}

export function calculateCuadernoHighlights(notes: Note[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const total = notes.length
  const conContenido = notes.filter(n => documentHasContent(parseCuadernoContent(n.contenido))).length
  const recientes = notes.filter(n => new Date(n.fechaCreacion).getTime() >= weekAgo).length
  const vacias = total - conContenido

  return { total, conContenido, recientes, vacias }
}

export function cuadernoSummaryItems(
  highlights: ReturnType<typeof calculateCuadernoHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Total', value: highlights.total, tone: 'info' },
    { label: 'Con contenido', value: highlights.conContenido, tone: 'available' },
    { label: 'Esta semana', value: highlights.recientes, tone: 'info' },
    { label: 'Vacías', value: highlights.vacias, tone: 'expense' },
  ]
}
