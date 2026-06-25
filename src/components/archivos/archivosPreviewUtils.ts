import type { FileAPI } from './archivosTypes'
import { formatFileSize } from './archivosDisplayUtils'

export type ArchivoPreviewKind = 'pdf' | 'image' | 'text'

/** Límite práctico para previsualizar en el navegador sin bloquear la pestaña */
export const PREVIEW_MAX_BYTES = 15 * 1024 * 1024

export function getArchivoPreviewKind(mimeType: string): ArchivoPreviewKind | null {
  if (mimeType === 'application/pdf') {
    return 'pdf'
  }

  if (mimeType.startsWith('image/')) {
    return 'image'
  }

  if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    return 'text'
  }

  return null
}

export function canPreviewArchivo(file: Pick<FileAPI, 'mime_type' | 'file_size'>): boolean {
  if (!getArchivoPreviewKind(file.mime_type)) {
    return false
  }

  return file.file_size <= PREVIEW_MAX_BYTES
}

export function getPreviewUnavailableMessage(
  file: Pick<FileAPI, 'mime_type' | 'file_size'>
): string | null {
  if (!getArchivoPreviewKind(file.mime_type)) {
    return 'Este tipo de archivo no se puede previsualizar aquí. Descárgalo para abrirlo en tu equipo.'
  }

  if (file.file_size > PREVIEW_MAX_BYTES) {
    return `El archivo supera ${formatFileSize(PREVIEW_MAX_BYTES)}. Usa Descargar para verlo fuera del navegador.`
  }

  return null
}
