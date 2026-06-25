import { describe, expect, it } from 'vitest'
import {
  filterMiDiaEventsByQuery,
  formatMiDiaRowMeta,
  formatMiDiaRowValue,
  partitionTodayRoutineEvents,
  sortRoutineEventsByScheduledTime,
} from './miDiaDisplayUtils'

const sampleEvent = {
  routine: {
    id: '1',
    title: 'Meditación',
    description: 'Mañana',
    frequency: 'daily',
    scheduled_time: '07:30:00',
    current_streak: 3,
  },
  isCompleted: false,
}

describe('miDiaDisplayUtils', () => {
  it('sorts by scheduled time with timed routines first', () => {
    const events = [
      { ...sampleEvent, routine: { ...sampleEvent.routine, id: 'a', scheduled_time: null } },
      { ...sampleEvent, routine: { ...sampleEvent.routine, id: 'b', scheduled_time: '21:00:00' } },
      { ...sampleEvent, routine: { ...sampleEvent.routine, id: 'c', scheduled_time: '07:00:00' } },
    ]

    expect(sortRoutineEventsByScheduledTime(events).map(event => event.routine.id)).toEqual([
      'c',
      'b',
      'a',
    ])
  })

  it('uses time in value slot and streak in meta without duplicating hour', () => {
    expect(formatMiDiaRowValue(sampleEvent.routine, false)).toBe('07:30')
    expect(formatMiDiaRowValue(sampleEvent.routine, true)).toBe('Hecho')
    expect(formatMiDiaRowMeta(sampleEvent.routine)).toBe('Diaria · Racha 3d')
    expect(formatMiDiaRowMeta(sampleEvent.routine)).not.toContain('07:30')
  })

  it('partitions pending and completed groups', () => {
    const events = [
      sampleEvent,
      { ...sampleEvent, routine: { ...sampleEvent.routine, id: '2', title: 'Leer' }, isCompleted: true },
    ]

    const { pending, completed } = partitionTodayRoutineEvents(events)
    expect(pending).toHaveLength(1)
    expect(completed).toHaveLength(1)
  })

  it('filters events by routine searchable fields', () => {
    const events = [
      sampleEvent,
      {
        ...sampleEvent,
        routine: { ...sampleEvent.routine, id: '2', title: 'Gimnasio', frequency: 'weekly' },
      },
    ]

    expect(filterMiDiaEventsByQuery(events, 'gim')).toHaveLength(1)
  })
})
