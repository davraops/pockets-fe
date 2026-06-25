import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  resolveUploadMimeType,
} from './archivosTypes'

export interface ArchivoMetadataFormData {
  title: string
  description: string
}

export const EMPTY_ARCHIVO_METADATA_FORM: ArchivoMetadataFormData = {
  title: '',
  description: '',
}

export function fileToMetadataForm(file: {
  title: string
  description?: string | null
}): ArchivoMetadataFormData {
  return {
    title: file.title,
    description: file.description ?? '',
  }
}

export function validateSelectedUploadFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'El archivo es demasiado grande. El tamaño máximo es 50 MB.'
  }

  const mimeType = resolveUploadMimeType(file)
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Tipo de archivo no permitido. Solo PDF, documentos Office, texto, CSV e imágenes.'
  }

  return null
}

export function getUploadErrorMessage(err: unknown): string {
  let errorMessage = 'Error al subir el archivo. Por favor, intenta de nuevo.'

  const error = err as {
    data?: {
      error?: string
      message?: string
      details?: { message?: string }
    }
    message?: string
    response?: { status?: number }
  }

  if (error?.data?.error) {
    errorMessage = error.data.error
  } else if (error?.data?.message) {
    errorMessage = String(error.data.message)
  } else if (error?.data?.details?.message) {
    errorMessage = error.data.details.message
  } else if (error?.message) {
    errorMessage = error.message
  } else {
    errorMessage = getTranslatedErrorMessage(err, errorMessage)
  }

  if (error?.response?.status === 504) {
    errorMessage =
      'La subida tardó demasiado. Si el archivo pesa más de 10 MB debería usar subida presigned; prueba de nuevo o reinicia lifestyle.'
  } else if (error?.response?.status === 502 || error?.response?.status === 500) {
    errorMessage =
      'El servidor no pudo procesar la subida. Verifica que lifestyle esté activo y los endpoints /files estén desplegados.'
  } else if (error?.response?.status === 413) {
    errorMessage =
      'El archivo es demasiado grande para subida directa (máx. 10 MB). Los archivos mayores deben usar el flujo presigned automáticamente.'
  } else if (error?.response?.status === 401) {
    errorMessage = 'Sesión expirada. Vuelve a iniciar sesión e intenta de nuevo.'
  }

  if (error?.response?.status) {
    errorMessage += ` (HTTP ${error.response.status})`
  }

  return errorMessage
}
