export type FileUploadStatus = 'pending' | 'completed'

export interface FileAPI {
  id: string
  title: string
  description?: string | null
  file_name: string
  file_size: number
  mime_type: string
  upload_status?: FileUploadStatus
  created_at: string
  updated_at: string
}

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
/** Umbral API Gateway: ≤ este tamaño usa POST /files multipart; mayor usa presigned S3 */
export const PRESIGNED_UPLOAD_THRESHOLD_BYTES = 10 * 1024 * 1024
/** @deprecated use PRESIGNED_UPLOAD_THRESHOLD_BYTES */
export const MAX_DIRECT_UPLOAD_BYTES = PRESIGNED_UPLOAD_THRESHOLD_BYTES

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
] as const

const EXTENSION_MIME_MAP: Record<string, (typeof ALLOWED_MIME_TYPES)[number]> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
}

export function resolveUploadMimeType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension && EXTENSION_MIME_MAP[extension]) {
    return EXTENSION_MIME_MAP[extension]
  }

  return file.type
}

export function sortFilesByDate(files: FileAPI[]): FileAPI[] {
  return [...files].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
