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

export function formatSecretDateCompact(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatSecretListMeta(secret: Secret): string {
  const isCreatedOnly = secret.fechaCreacion === secret.fechaActualizacion
  const dateString = isCreatedOnly ? secret.fechaCreacion : secret.fechaActualizacion
  const prefix = isCreatedOnly ? 'Creado' : 'Actualizado'
  return `${prefix} · ${formatSecretDateCompact(dateString)}`
}

export function formatSecretListMetaTitle(secret: Secret): string {
  const isCreatedOnly = secret.fechaCreacion === secret.fechaActualizacion
  return isCreatedOnly
    ? `Creado: ${formatSecretDate(secret.fechaCreacion)}`
    : `Actualizado: ${formatSecretDate(secret.fechaActualizacion)}`
}

export function sortSecretsByRecent(secrets: Secret[]): Secret[] {
  return [...secrets].sort(
    (a, b) =>
      new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime()
  )
}

export function filterSecretsByQuery(secrets: Secret[], query: string): Secret[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return secrets
  }

  return secrets.filter(secret => secret.titulo.toLowerCase().includes(normalized))
}

export function calculateSecretoHighlights(secrets: Secret[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recientes = secrets.filter(s => new Date(s.fechaCreacion).getTime() >= weekAgo).length
  const actualizados = secrets.filter(s => s.fechaCreacion !== s.fechaActualizacion).length

  return { recientes, actualizados }
}

export function secretoSummaryItems(
  highlights: ReturnType<typeof calculateSecretoHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Recientes (7d)', value: highlights.recientes, tone: 'available' },
    { label: 'Modificados', value: highlights.actualizados, tone: 'info', emphasis: true },
  ]
}
