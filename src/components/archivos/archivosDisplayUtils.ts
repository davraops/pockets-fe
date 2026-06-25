import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
import type { FileAPI } from './archivosTypes'

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes'
  }
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export function formatFileDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) {
    return '📄'
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return '📝'
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return '📊'
  }
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return '📽️'
  }
  if (mimeType.includes('image')) {
    return '🖼️'
  }
  if (mimeType.includes('text') || mimeType.includes('csv')) {
    return '📃'
  }
  return '📎'
}

export function calculateArchivoHighlights(files: FileAPI[]) {
  const tamanoBytes = files.reduce((sum, file) => sum + file.file_size, 0)
  return {
    total: files.length,
    tamano: formatFileSize(tamanoBytes),
    pdfs: files.filter(file => file.mime_type.includes('pdf')).length,
    imagenes: files.filter(file => file.mime_type.includes('image')).length,
  }
}

export function archivoSummaryItems(
  highlights: ReturnType<typeof calculateArchivoHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Total', value: highlights.total, tone: 'info' },
    { label: 'Tamaño', value: highlights.tamano, tone: 'available' },
    { label: 'PDFs', value: highlights.pdfs, tone: 'info' },
    { label: 'Imágenes', value: highlights.imagenes, tone: 'info' },
  ]
}

export function filterFilesByQuery(files: FileAPI[], query: string): FileAPI[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return files
  }

  return files.filter(file => {
    const haystack = [file.title, file.file_name, file.description ?? '']
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

export function formatFileListMeta(file: FileAPI): string {
  return `${file.file_name} · ${formatFileDate(file.created_at)}`
}
