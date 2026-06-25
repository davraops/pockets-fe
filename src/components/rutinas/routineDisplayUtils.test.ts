import { describe, expect, it } from 'vitest'
import {
  calculateRoutineHighlights,
  filterRoutinesByFrequency,
  filterRoutinesByQuery,
  formatRoutineMeta,
  formatRoutineRowValue,
  formatRoutineStreakLabel,
  groupRoutinesByFrequency,
  sortRoutinesForDisplay,
} from './routineDisplayUtils'

describe('routineDisplayUtils', () => {
  it('builds shared meta for weekly and monthly routines', () => {
    expect(
      formatRoutineMeta({
        frequency: 'weekly',
        days_of_week: [1, 3],
        scheduled_time: '07:30:00',
      })
    ).toBe('Semanal · Lun, Mié · 07:30')

    expect(
      formatRoutineMeta({
        frequency: 'monthly',
        day_of_month: 15,
        scheduled_time: '21:00:00',
      })
    ).toBe('Mensual · Día 15 del mes · 21:00')
  })

  it('shows streak in row value only when present', () => {
    expect(formatRoutineRowValue({ frequency: 'daily', current_streak: 5 })).toBe('5d')
    expect(formatRoutineRowValue({ frequency: 'daily', current_streak: 0 })).toBeUndefined()
  })

  it('formats streak labels for detail cards', () => {
    expect(formatRoutineStreakLabel(0)).toBe('Sin racha')
    expect(formatRoutineStreakLabel(1)).toBe('1 día')
    expect(formatRoutineStreakLabel(4)).toBe('4 días')
  })

  it('summarizes routine highlights including monthly count', () => {
    const routines = [
      { frequency: 'daily', current_streak: 3 },
      { frequency: 'weekly', current_streak: 0 },
      { frequency: 'weekly', current_streak: 2 },
      { frequency: 'monthly', current_streak: 1 },
    ]

    expect(calculateRoutineHighlights(routines)).toEqual({
      total: 4,
      diarias: 1,
      semanales: 2,
      mensuales: 1,
      conRacha: 3,
    })
  })

  it('filters routines by title, meta and frequency', () => {
    const routines = [
      { title: 'Meditación', description: 'Mañana', frequency: 'daily', current_streak: 0 },
      { title: 'Gimnasio', description: 'Fuerza', frequency: 'weekly', days_of_week: [1, 3], current_streak: 2 },
      { title: 'Cierre', description: 'Fin de mes', frequency: 'monthly', day_of_month: 1, current_streak: 0 },
    ]

    expect(filterRoutinesByQuery(routines, 'gim')).toHaveLength(1)
    expect(filterRoutinesByQuery(routines, 'semanal')).toHaveLength(1)
    expect(filterRoutinesByFrequency(routines, 'monthly')).toHaveLength(1)
  })

  it('groups and sorts routines for display', () => {
    const routines = [
      { title: 'Zumba', frequency: 'weekly', scheduled_time: '18:00' },
      { title: 'Leer', frequency: 'daily', scheduled_time: '21:00' },
      { title: 'Meditar', frequency: 'daily', scheduled_time: '07:00' },
      { title: 'Cierre', frequency: 'monthly', scheduled_time: '09:00' },
    ]

    const groups = groupRoutinesByFrequency(routines)
    expect(groups.map(group => group.key)).toEqual(['daily', 'weekly', 'monthly'])
    expect(groups[0]?.routines.map(routine => routine.title)).toEqual(['Meditar', 'Leer'])

    const sorted = sortRoutinesForDisplay(routines)
    expect(sorted[0]?.frequency).toBe('daily')
    expect(sorted[0]?.title).toBe('Meditar')
  })
})
