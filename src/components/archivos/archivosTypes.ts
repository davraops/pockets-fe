export interface FileAPI {
  id: string
  title: string
  description?: string | null
  file_name: string
  file_size: number
  mime_type: string
  created_at: string
  updated_at: string
}

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

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

export function sortFilesByDate(files: FileAPI[]): FileAPI[] {
  return [...files].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
