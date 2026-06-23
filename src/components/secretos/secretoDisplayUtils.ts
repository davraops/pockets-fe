import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
import type { Secret } from './secretosTypes'

export function formatSecretDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatSecretMeta(secret: Secret): string {
  return secret.fechaCreacion === secret.fechaActualizacion
    ? `Creado: ${formatSecretDate(secret.fechaCreacion)}`
    : `Actualizado: ${formatSecretDate(secret.fechaActualizacion)}`
}

export function calculateSecretoHighlights(secrets: Secret[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const total = secrets.length
  const recientes = secrets.filter(s => new Date(s.fechaCreacion).getTime() >= weekAgo).length
  const actualizados = secrets.filter(s => s.fechaCreacion !== s.fechaActualizacion).length

  return { total, recientes, actualizados }
}

export function secretoSummaryItems(
  highlights: ReturnType<typeof calculateSecretoHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Total', value: highlights.total, tone: 'info' },
    { label: 'Esta semana', value: highlights.recientes, tone: 'available' },
    { label: 'Actualizados', value: highlights.actualizados, tone: 'info', emphasis: true },
  ]
}
