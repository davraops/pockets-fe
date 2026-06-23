export interface SecretoFormData {
  titulo: string
  valor: string
}

export interface SecretoFormErrors {
  titulo: string
  valor: string
}

export type SecretoFormMode = 'create' | 'edit'

export const EMPTY_SECRETO_FORM: SecretoFormData = {
  titulo: '',
  valor: '',
}

export const EMPTY_SECRETO_FORM_ERRORS: SecretoFormErrors = {
  titulo: '',
  valor: '',
}

export function secretToFormData(secret: { titulo: string }): SecretoFormData {
  return {
    titulo: secret.titulo,
    valor: '',
  }
}

export function formDataToCreatePayload(formData: SecretoFormData): {
  title: string
  value: string
} {
  return {
    title: formData.titulo.trim(),
    value: formData.valor.trim(),
  }
}

export function formDataToUpdatePayload(formData: SecretoFormData): {
  title: string
  value?: string
} {
  const payload: { title: string; value?: string } = {
    title: formData.titulo.trim(),
  }
  if (formData.valor.trim()) {
    payload.value = formData.valor.trim()
  }
  return payload
}

export function validateSecretoForm(
  formData: SecretoFormData,
  mode: SecretoFormMode
): { isValid: boolean; errors: SecretoFormErrors } {
  const errors = { ...EMPTY_SECRETO_FORM_ERRORS }
  let isValid = true

  if (!formData.titulo.trim()) {
    errors.titulo = 'El título es requerido'
    isValid = false
  }

  if (mode === 'create' && !formData.valor.trim()) {
    errors.valor = 'El valor es requerido'
    isValid = false
  }

  return { isValid, errors }
}
