import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
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
  return contenido.length > maxLength ? `${contenido.substring(0, maxLength)}...` : contenido
}

export function formatNoteMeta(note: Note): string {
  return note.fechaCreacion === note.fechaActualizacion
    ? `Creada: ${formatNoteDate(note.fechaCreacion)}`
    : `Actualizada: ${formatNoteDate(note.fechaActualizacion)}`
}

export function calculateCuadernoHighlights(notes: Note[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const total = notes.length
  const conContenido = notes.filter(n => n.contenido.trim().length > 0).length
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
