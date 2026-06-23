export interface CuadernoFormData {
  titulo: string
  contenido: string
}

export interface CuadernoFormErrors {
  titulo: string
  contenido: string
}

export const EMPTY_CUADERNO_FORM: CuadernoFormData = {
  titulo: '',
  contenido: '',
}

export const EMPTY_CUADERNO_FORM_ERRORS: CuadernoFormErrors = {
  titulo: '',
  contenido: '',
}

export function noteToFormData(note: { titulo: string; contenido: string }): CuadernoFormData {
  return {
    titulo: note.titulo,
    contenido: note.contenido,
  }
}

export function formDataToNotePayload(formData: CuadernoFormData): {
  title: string
  content: string
} {
  return {
    title: formData.titulo.trim(),
    content: formData.contenido.trim(),
  }
}

export function validateCuadernoForm(formData: CuadernoFormData): {
  isValid: boolean
  errors: CuadernoFormErrors
} {
  const errors = { ...EMPTY_CUADERNO_FORM_ERRORS }
  let isValid = true

  if (!formData.titulo.trim()) {
    errors.titulo = 'El título es requerido'
    isValid = false
  }

  if (!formData.contenido.trim()) {
    errors.contenido = 'El contenido es requerido'
    isValid = false
  }

  return { isValid, errors }
}
