import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyRoutineCompletionToHubData,
  buildTiempoHubData,
  buildTiempoHubStats,
  EMPTY_TIEMPO_HUB_STATS,
  formatTiempoHeroSubline,
  formatTiempoHeroValue,
  formatTiempoHubSubtitle,
  formatTiempoRoutineStreak,
  formatTiempoRoutineStreakBadge,
} from './tiempoHubUtils'
import { getRoutineStreakAfterCompletion } from '../../utils/routineCompletion'

describe('tiempoHubUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds hub stats from lifestyle API payloads', () => {
    const stats = buildTiempoHubStats({
      events: [{ event_date: '2026-06-23' }, { event_date: '2026-06-25' }],
      todayRoutines: [{ isCompleted: true }, { isCompleted: false }],
      allRoutines: [{}, {}, {}],
      diaryEntries: [{ entry_date: '2026-06-23' }, { entry_date: '2026-06-22' }],
    })

    expect(stats.eventosHoy).toBe(1)
    expect(stats.rutinasHoy).toBe(2)
    expect(stats.rutinasCompletadasHoy).toBe(1)
    expect(stats.rutinasTotal).toBe(3)
    expect(stats.diarioEntradas).toBe(2)
    expect(stats.diarioRacha).toBe(2)
  })

  it('builds hub data with pending routines and diary flag', () => {
    const data = buildTiempoHubData({
      events: [
        { id: 'e1', title: 'Cumpleaños', event_date: '2026-06-25', event_time: '18:00' },
        { id: 'e2', title: 'Reunión', event_date: '2026-06-23', event_time: '09:00' },
      ],
      todayRoutines: [
        { id: 'r1', title: 'Meditar', scheduled_time: '07:00' },
        { id: 'r2', title: 'Correr', scheduled_time: '06:30' },
      ],
      completedRoutineIds: new Set(['r2']),
      allRoutines: [
        { id: 'r1', title: 'Meditar', current_streak: 4, frequency: 'daily' },
        { id: 'r2', title: 'Correr', current_streak: 12, frequency: 'daily' },
      ],
      diaryEntries: [{ entry_date: '2026-06-22' }],
      today: '2026-06-23',
    })

    expect(data.stats.rutinasCompletadasHoy).toBe(1)
    expect(data.stats.rutinasConRacha).toBe(2)
    expect(data.stats.mejorRachaRutina).toBe(12)
    expect(data.todayRoutines).toHaveLength(2)
    expect(data.pendingRoutines).toHaveLength(1)
    expect(data.pendingRoutines[0].title).toBe('Meditar')
    expect(data.routineStreaks).toHaveLength(2)
    expect(data.routineStreaks[0].title).toBe('Correr')
    expect(data.upcomingEvents.length).toBeGreaterThan(0)
    expect(data.hasDiaryEntryToday).toBe(false)
    expect(data.diaryStreakMessage).toContain('racha')
  })

  it('formats contextual hub subtitles', () => {
    const stats = {
      ...EMPTY_TIEMPO_HUB_STATS,
      eventosHoy: 2,
      eventosProximos: 5,
      rutinasHoy: 4,
      rutinasCompletadasHoy: 1,
      rutinasTotal: 6,
      diarioEntradas: 12,
      diarioRacha: 3,
      diarioRachaRecord: 7,
      rutinasConRacha: 2,
      mejorRachaRutina: 5,
    }

    expect(formatTiempoHubSubtitle('fechas', stats)).toBe('2 hoy · 5 próximos')
    expect(formatTiempoHubSubtitle('mi-dia', stats)).toBe('1/4 completadas hoy')
    expect(formatTiempoHubSubtitle('rutinas', stats)).toBe('6 rutinas · 2 con racha')
    expect(formatTiempoHubSubtitle('mi-diario', stats)).toBe('12 entradas · racha 3 días')
  })

  it('formats hero value and subline for dashboard', () => {
    const data = buildTiempoHubData({
      events: [{ id: 'e1', title: 'Cena', event_date: '2026-06-24' }],
      todayRoutines: [{ id: 'r1', title: 'Leer' }],
      completedRoutineIds: new Set(),
      allRoutines: [{}],
      diaryEntries: [{ entry_date: '2026-06-22' }, { entry_date: '2026-06-21' }],
      today: '2026-06-23',
    })

    expect(formatTiempoHeroValue(data.stats)).toBe('0/1')
    expect(formatTiempoHeroSubline(data)).toContain('Próximo: Cena')
    expect(formatTiempoHeroSubline(data)).toContain('1 rutina pendiente')
  })

  it('applies optimistic routine completion to hub data', () => {
    const data = buildTiempoHubData({
      events: [],
      todayRoutines: [{ id: 'r1', title: 'Meditar', scheduled_time: '07:00', current_streak: 2 }],
      completedRoutineIds: new Set(),
      allRoutines: [{ id: 'r1', title: 'Meditar', current_streak: 2, frequency: 'daily' }],
      diaryEntries: [],
      today: '2026-06-23',
    })

    const streaks = getRoutineStreakAfterCompletion({
      id: 'r1',
      title: 'Meditar',
      current_streak: 2,
    })
    const updated = applyRoutineCompletionToHubData(data, 'r1', streaks)

    expect(updated.stats.rutinasCompletadasHoy).toBe(1)
    expect(updated.pendingRoutines).toHaveLength(0)
    expect(updated.todayRoutines[0].isCompleted).toBe(true)
    expect(updated.todayRoutines[0].currentStreak).toBe(3)
  })

  it('formats routine streak labels for hub rows', () => {
    expect(formatTiempoRoutineStreak(0)).toBe('Sin racha')
    expect(formatTiempoRoutineStreak(1)).toBe('1 día')
    expect(formatTiempoRoutineStreak(5)).toBe('5 días')
    expect(formatTiempoRoutineStreakBadge(5)).toBe('5d')
    expect(formatTiempoRoutineStreakBadge(0)).toBeNull()
  })
})
