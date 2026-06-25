import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateEventHighlights,
  excludeFeaturedEvent,
  filterEventsByQuery,
  formatEventDateBadge,
  formatEventListValue,
  formatEventMeta,
  formatEventWhenLabel,
  formatRecurrenceLabel,
  getEffectiveEventDate,
  getNextFeaturedEvent,
  getRemainingListEvents,
  getUpcomingEvents,
  groupEventsByPeriod,
} from './fechasDisplayUtils'

const yearlyBirthday = {
  id: 'birthday',
  titulo: 'Cumpleaños',
  fecha: '1990-03-20',
  esTodoElDia: true,
  esRecurrente: true,
  frecuenciaRecurrencia: 'yearly',
  intervaloRecurrencia: 1,
}

describe('fechasDisplayUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats temporal labels for list value without duplicating date in meta', () => {
    const event = {
      fecha: '2026-06-24',
      hora: '14:30:00',
      esTodoElDia: false,
      ubicacion: 'Parque',
    }

    expect(formatEventWhenLabel(event)).toBe('Mañana')
    expect(formatEventListValue(event)).toBe('Mañana')

    const meta = formatEventMeta(event)
    expect(meta).toBe('14:30 · Parque')
    expect(meta).not.toMatch(/2026/)
  })

  it('splits upcoming and remaining events without duplicates', () => {
    const events = [
      { id: '1', titulo: 'Evento 1', fecha: '2026-06-23', esTodoElDia: true },
      { id: '2', titulo: 'Evento 2', fecha: '2026-06-25', esTodoElDia: true },
      { id: '3', titulo: 'Evento 3', fecha: '2026-07-30', esTodoElDia: true },
      { id: '4', titulo: 'Evento 4', fecha: '2025-01-01', esTodoElDia: true },
    ]

    const upcoming = getUpcomingEvents(events)
    const remaining = getRemainingListEvents(events, upcoming)

    expect(upcoming.map(event => event.id)).toEqual(['1', '2'])
    expect(remaining.map(event => event.id)).toEqual(['3', '4'])
  })

  it('filters events by searchable fields', () => {
    const events = [
      {
        id: '1',
        titulo: 'Cumpleaños',
        descripcion: 'Fiesta',
        ubicacion: 'Casa',
        fecha: '2026-06-25',
        esRecurrente: true,
        frecuenciaRecurrencia: 'yearly',
      },
      { id: '2', titulo: 'Concierto', descripcion: '', ubicacion: 'Teatro', fecha: '2026-07-01' },
    ]

    expect(filterEventsByQuery(events, 'cumple')).toHaveLength(1)
    expect(filterEventsByQuery(events, 'anual')).toHaveLength(1)
    expect(filterEventsByQuery(events, 'teatro')).toHaveLength(1)
  })

  it('counts highlights using the full 30-day horizon', () => {
    const events = [
      { id: 'a', titulo: 'Hoy', fecha: '2026-06-23', esTodoElDia: true },
      { id: 'b', titulo: 'Próximo', fecha: '2026-06-25', esTodoElDia: true },
      { id: 'c', titulo: 'Mes', fecha: '2026-07-20', esTodoElDia: true },
      { id: 'd', titulo: 'Lejano', fecha: '2026-08-01', esTodoElDia: true },
    ]

    expect(calculateEventHighlights(events)).toEqual({
      total: 4,
      hoy: 1,
      proximos: 3,
    })
  })

  it('builds date badges and groups events by period', () => {
    const events = [
      { id: '1', titulo: 'Hoy', fecha: '2026-06-23', esTodoElDia: true },
      { id: '2', titulo: 'Mañana', fecha: '2026-06-24', esTodoElDia: true },
      { id: '3', titulo: 'Semana', fecha: '2026-06-27', esTodoElDia: true },
      { id: '4', titulo: 'Pasado', fecha: '2026-06-01', esTodoElDia: true },
    ]

    expect(formatEventDateBadge(events[0])).toEqual({ primary: 'HOY', secondary: 'jun' })
    expect(getNextFeaturedEvent(events)?.id).toBe('1')

    const groups = groupEventsByPeriod(events)
    expect(groups.map(group => group.id)).toEqual(['today', 'tomorrow', 'this-week', 'past'])
    expect(excludeFeaturedEvent(events, events[0]).map(event => event.id)).toEqual([
      '2',
      '3',
      '4',
    ])
  })

  it('uses next yearly occurrence for recurring birthdays', () => {
    expect(getEffectiveEventDate(yearlyBirthday)).toBe('2027-03-20')
    expect(formatEventWhenLabel(yearlyBirthday)).toBe('En 270 días')
    expect(formatRecurrenceLabel(yearlyBirthday)).toBe('Anual')
    expect(formatEventDateBadge(yearlyBirthday).primary).toBe('20')
  })
})
