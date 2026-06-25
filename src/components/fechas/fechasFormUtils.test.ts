import { describe, expect, it } from 'vitest'
import {
  EMPTY_FECHAS_EVENT_FORM,
  formDataToEventPayload,
  validateFechasEventForm,
} from './fechasFormUtils'

describe('fechasFormUtils', () => {
  it('builds recurring payload for birthdays', () => {
    const payload = formDataToEventPayload({
      ...EMPTY_FECHAS_EVENT_FORM,
      titulo: 'Cumpleaños de Ana',
      fecha: '1990-03-20',
      esTodoElDia: true,
      esRecurrente: true,
      frecuenciaRecurrencia: 'yearly',
      intervaloRecurrencia: '1',
    })

    expect(payload).toMatchObject({
      title: 'Cumpleaños de Ana',
      event_date: '1990-03-20',
      is_all_day: true,
      is_recurring: true,
      recurrence_frequency: 'yearly',
      recurrence_interval: 1,
    })
  })

  it('requires frequency when recurrence is enabled', () => {
    const result = validateFechasEventForm({
      ...EMPTY_FECHAS_EVENT_FORM,
      titulo: 'Evento',
      fecha: '2026-06-24',
      esRecurrente: true,
      frecuenciaRecurrencia: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.frecuenciaRecurrencia).toBeTruthy()
  })

  it('clears recurrence fields when disabled', () => {
    const payload = formDataToEventPayload({
      ...EMPTY_FECHAS_EVENT_FORM,
      titulo: 'Una vez',
      fecha: '2026-06-24',
      esRecurrente: false,
      frecuenciaRecurrencia: 'yearly',
    })

    expect(payload.is_recurring).toBe(false)
    expect(payload.recurrence_frequency).toBeUndefined()
  })
})
