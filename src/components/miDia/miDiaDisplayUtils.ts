import {
  filterRoutinesByQuery,
  formatRoutineDayOfMonth,
  formatRoutineDaysOfWeek,
  formatRoutineFrequency,
  formatRoutineMeta,
  formatRoutineTime,
  type RoutineDisplayFields,
  type RoutineSearchable,
} from '../rutinas/routineDisplayUtils'

export interface MiDiaRoutineEvent {
  routine: RoutineSearchable & { id: string }
  isCompleted: boolean
}

export function sortRoutineEventsByScheduledTime<T extends MiDiaRoutineEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const timeA = a.routine.scheduled_time ?? ''
    const timeB = b.routine.scheduled_time ?? ''

    if (timeA && timeB) {
      return timeA.localeCompare(timeB)
    }
    if (timeA && !timeB) {
      return -1
    }
    if (!timeA && timeB) {
      return 1
    }
    return 0
  })
}

export function partitionTodayRoutineEvents<T extends MiDiaRoutineEvent>(events: T[]) {
  const pending = sortRoutineEventsByScheduledTime(events.filter(event => !event.isCompleted))
  const completed = sortRoutineEventsByScheduledTime(events.filter(event => event.isCompleted))
  return { pending, completed }
}

export function formatMiDiaRowValue(
  routine: RoutineDisplayFields,
  isCompleted: boolean
): string | undefined {
  if (isCompleted) {
    return 'Hecho'
  }

  const time = formatRoutineTime(routine.scheduled_time)
  return time || undefined
}

export function formatMiDiaRowMeta(routine: RoutineDisplayFields): string {
  const parts = [formatRoutineFrequency(routine.frequency)]

  if (routine.frequency === 'weekly' && routine.days_of_week?.length) {
    parts.push(formatRoutineDaysOfWeek(routine.days_of_week))
  }

  if (routine.frequency === 'monthly' && routine.day_of_month != null) {
    parts.push(formatRoutineDayOfMonth(routine.day_of_month))
  }

  const streak = routine.current_streak ?? 0
  if (streak > 0) {
    parts.push(`Racha ${streak}d`)
  }

  return parts.join(' · ')
}

export function filterMiDiaEventsByQuery<T extends MiDiaRoutineEvent>(
  events: T[],
  query: string
): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return events
  }

  return events.filter(event => filterRoutinesByQuery([event.routine], query).length > 0)
}

export function formatMiDiaSearchHaystack(routine: RoutineSearchable): string {
  return [routine.title, routine.description ?? '', formatRoutineMeta(routine)].join(' ')
}
