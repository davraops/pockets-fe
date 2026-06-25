export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface FechasEventFormData {
  titulo: string
  descripcion: string
  fecha: string
  hora: string
  esTodoElDia: boolean
  ubicacion: string
  esRecurrente: boolean
  frecuenciaRecurrencia: RecurrenceFrequency | ''
  intervaloRecurrencia: string
  fechaFinRecurrencia: string
}

export interface FechasEventFormErrors {
  titulo: string
  fecha: string
  frecuenciaRecurrencia: string
}

export interface FechasEventSource {
  titulo: string
  descripcion?: string | null
  fecha: string
  hora?: string | null
  esTodoElDia: boolean
  ubicacion?: string | null
  esRecurrente: boolean
  frecuenciaRecurrencia?: string | null
  intervaloRecurrencia?: number | null
  fechaFinRecurrencia?: string | null
  cantidadRecurrencias?: number | null
}

export const RECURRENCE_FREQUENCY_OPTIONS: Array<{
  value: RecurrenceFrequency
  label: string
  hint: string
}> = [
  { value: 'yearly', label: 'Anual', hint: 'Cumpleaños, aniversarios' },
  { value: 'monthly', label: 'Mensual', hint: 'Cada mes' },
  { value: 'weekly', label: 'Semanal', hint: 'Cada semana' },
  { value: 'daily', label: 'Diario', hint: 'Cada día' },
]

export const EMPTY_FECHAS_EVENT_FORM: FechasEventFormData = {
  titulo: '',
  descripcion: '',
  fecha: '',
  hora: '',
  esTodoElDia: false,
  ubicacion: '',
  esRecurrente: false,
  frecuenciaRecurrencia: '',
  intervaloRecurrencia: '1',
  fechaFinRecurrencia: '',
}

export const EMPTY_FECHAS_EVENT_FORM_ERRORS: FechasEventFormErrors = {
  titulo: '',
  fecha: '',
  frecuenciaRecurrencia: '',
}

function isRecurrenceFrequency(value: string | null | undefined): value is RecurrenceFrequency {
  return value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'yearly'
}

export function eventToFormData(event: FechasEventSource): FechasEventFormData {
  return {
    titulo: event.titulo,
    descripcion: event.descripcion || '',
    fecha: event.fecha,
    hora: event.hora?.slice(0, 5) || '',
    esTodoElDia: event.esTodoElDia,
    ubicacion: event.ubicacion || '',
    esRecurrente: event.esRecurrente,
    frecuenciaRecurrencia: isRecurrenceFrequency(event.frecuenciaRecurrencia)
      ? event.frecuenciaRecurrencia
      : '',
    intervaloRecurrencia:
      event.intervaloRecurrencia != null && event.intervaloRecurrencia > 0
        ? String(event.intervaloRecurrencia)
        : '1',
    fechaFinRecurrencia: event.fechaFinRecurrencia || '',
  }
}

export function formDataToEventPayload(formData: FechasEventFormData): {
  title: string
  event_date: string
  description?: string
  event_time?: string
  is_all_day?: boolean
  is_recurring?: boolean
  recurrence_frequency?: string
  recurrence_interval?: number
  recurrence_end_date?: string
  location?: string
} {
  const payload: {
    title: string
    event_date: string
    description?: string
    event_time?: string
    is_all_day?: boolean
    is_recurring?: boolean
    recurrence_frequency?: string
    recurrence_interval?: number
    recurrence_end_date?: string
    location?: string
  } = {
    title: formData.titulo.trim(),
    event_date: formData.fecha,
    is_all_day: formData.esTodoElDia,
    is_recurring: formData.esRecurrente,
  }

  if (formData.descripcion.trim()) {
    payload.description = formData.descripcion.trim()
  }

  if (!formData.esTodoElDia && formData.hora) {
    payload.event_time = formData.hora
  }

  if (formData.ubicacion.trim()) {
    payload.location = formData.ubicacion.trim()
  }

  if (formData.esRecurrente) {
    payload.recurrence_frequency = formData.frecuenciaRecurrencia
    payload.recurrence_interval = Math.max(1, parseInt(formData.intervaloRecurrencia, 10) || 1)
    if (formData.fechaFinRecurrencia) {
      payload.recurrence_end_date = formData.fechaFinRecurrencia
    }
  }

  return payload
}

export function validateFechasEventForm(formData: FechasEventFormData): {
  isValid: boolean
  errors: FechasEventFormErrors
} {
  const errors = { ...EMPTY_FECHAS_EVENT_FORM_ERRORS }
  let isValid = true

  if (!formData.titulo.trim()) {
    errors.titulo = 'El título es requerido'
    isValid = false
  }

  if (!formData.fecha) {
    errors.fecha = 'La fecha es requerida'
    isValid = false
  }

  if (formData.esRecurrente && !formData.frecuenciaRecurrencia) {
    errors.frecuenciaRecurrencia = 'Selecciona una frecuencia'
    isValid = false
  }

  return { isValid, errors }
}

export function getRecurrenceIntervalLabel(frequency: RecurrenceFrequency | ''): string {
  switch (frequency) {
    case 'daily':
      return 'día(s)'
    case 'weekly':
      return 'semana(s)'
    case 'monthly':
      return 'mes(es)'
    case 'yearly':
      return 'año(s)'
    default:
      return 'intervalo'
  }
}
