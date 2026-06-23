import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './archivosTypes'

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
    return 'El archivo es demasiado grande. El tamaño máximo es 25MB.'
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Tipo de archivo no permitido. Solo se permiten PDFs, documentos, imágenes y archivos de texto.'
  }

  return null
}

export function getUploadErrorMessage(err: unknown): string {
  let errorMessage = 'Error al subir el archivo. Por favor, intenta de nuevo.'

  const error = err as {
    data?: { error?: string; message?: string; details?: { message?: string } }
    message?: string
    response?: { status?: number }
  }

  if (error?.data?.error) {
    errorMessage = error.data.error
  } else if (error?.data?.message) {
    errorMessage = error.data.message
  } else if (error?.data?.details?.message) {
    errorMessage = error.data.details.message
  } else if (error?.message) {
    errorMessage = error.message
  } else {
    errorMessage = getTranslatedErrorMessage(err, errorMessage)
  }

  if (error?.response?.status) {
    errorMessage += ` (Error ${error.response.status})`
  }

  return errorMessage
}
