import type { RoutineFrequency, RoutineFrequencyFilter } from './routineTypes'

export interface RoutineDisplayFields {
  frequency: string
  days_of_week?: number[] | null
  day_of_month?: number | null
  scheduled_time?: string | null
  current_streak?: number | null
  duration?: number | null
}

export function formatRoutineFrequency(frequency: string): string {
  switch (frequency) {
    case 'daily':
      return 'Diaria'
    case 'weekly':
      return 'Semanal'
    case 'monthly':
      return 'Mensual'
    default:
      return frequency
  }
}

export function formatRoutineDaysOfWeek(days: number[] | null | undefined): string {
  if (!days || days.length === 0) {
    return ''
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return [...days].sort((a, b) => a - b).map(day => dayNames[day]).join(', ')
}

export function formatRoutineDayOfMonth(day: number | null | undefined): string {
  if (day === null || day === undefined) {
    return ''
  }
  return `Día ${day} del mes`
}

export function formatRoutineTime(timeString: string | null | undefined): string {
  if (!timeString) {
    return ''
  }
  return timeString.slice(0, 5)
}

export function formatRoutineDuration(minutes: number | null | undefined): string | undefined {
  if (minutes == null || minutes <= 0) {
    return undefined
  }
  return `${minutes} min`
}

export function formatRoutineMeta(routine: RoutineDisplayFields): string {
  const parts = [formatRoutineFrequency(routine.frequency)]

  if (routine.frequency === 'weekly' && routine.days_of_week?.length) {
    parts.push(formatRoutineDaysOfWeek(routine.days_of_week))
  }

  if (routine.frequency === 'monthly' && routine.day_of_month != null) {
    parts.push(formatRoutineDayOfMonth(routine.day_of_month))
  }

  if (routine.scheduled_time) {
    parts.push(formatRoutineTime(routine.scheduled_time))
  }

  return parts.join(' · ')
}

export function formatRoutineRowValue(routine: RoutineDisplayFields): string | undefined {
  const streak = routine.current_streak ?? 0
  if (streak <= 0) {
    return undefined
  }
  return `${streak}d`
}

export function formatRoutineStreakLabel(streak: number | null | undefined): string {
  const value = streak ?? 0
  if (value <= 0) {
    return 'Sin racha'
  }
  return value === 1 ? '1 día' : `${value} días`
}

export function getRoutineAccentClass(frequency: string): string {
  switch (frequency) {
    case 'weekly':
      return 'crud-row-accent-indigo'
    case 'monthly':
      return 'crud-row-accent-purple'
    default:
      return 'crud-row-accent-green'
  }
}

export function getRoutineFrequencyChipClass(frequency: string): string {
  switch (frequency) {
    case 'weekly':
      return 'rutina-chip rutina-chip--weekly'
    case 'monthly':
      return 'rutina-chip rutina-chip--monthly'
    default:
      return 'rutina-chip rutina-chip--daily'
  }
}

export function calculateRoutineHighlights(routines: RoutineDisplayFields[]) {
  return {
    total: routines.length,
    diarias: routines.filter(routine => routine.frequency === 'daily').length,
    semanales: routines.filter(routine => routine.frequency === 'weekly').length,
    mensuales: routines.filter(routine => routine.frequency === 'monthly').length,
    conRacha: routines.filter(routine => (routine.current_streak ?? 0) > 0).length,
  }
}

export interface RoutineSearchable extends RoutineDisplayFields {
  title: string
  description?: string | null
  is_active?: boolean
}

export function filterRoutinesByQuery<T extends RoutineSearchable>(routines: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return routines
  }

  return routines.filter(routine => {
    const haystack = [
      routine.title,
      routine.description ?? '',
      formatRoutineMeta(routine),
      formatRoutineFrequency(routine.frequency),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}

export function filterRoutinesByFrequency<T extends RoutineDisplayFields>(
  routines: T[],
  filter: RoutineFrequencyFilter
): T[] {
  if (filter === 'all') {
    return routines
  }
  return routines.filter(routine => routine.frequency === filter)
}

export interface RoutineFrequencyGroup<T extends RoutineSearchable = RoutineSearchable> {
  key: RoutineFrequency
  label: string
  routines: T[]
}

export function groupRoutinesByFrequency<T extends RoutineSearchable>(
  routines: T[]
): RoutineFrequencyGroup<T>[] {
  const groups: RoutineFrequencyGroup<T>[] = [
    { key: 'daily', label: 'Diarias', routines: [] },
    { key: 'weekly', label: 'Semanales', routines: [] },
    { key: 'monthly', label: 'Mensuales', routines: [] },
  ]

  for (const routine of routines) {
    const group = groups.find(item => item.key === routine.frequency)
    if (group) {
      group.routines.push(routine)
    }
  }

  return groups
    .filter(group => group.routines.length > 0)
    .map(group => ({
      ...group,
      routines: sortRoutinesForDisplay(group.routines) as T[],
    }))
}

export function sortRoutinesForDisplay<T extends RoutineSearchable>(routines: T[]): T[] {
  const frequencyOrder: Record<string, number> = { daily: 0, weekly: 1, monthly: 2 }

  return [...routines].sort((a, b) => {
    const freqDiff = (frequencyOrder[a.frequency] ?? 9) - (frequencyOrder[b.frequency] ?? 9)
    if (freqDiff !== 0) {
      return freqDiff
    }

    const timeA = a.scheduled_time ?? '99:99'
    const timeB = b.scheduled_time ?? '99:99'
    if (timeA !== timeB) {
      return timeA.localeCompare(timeB)
    }

    return a.title.localeCompare(b.title, 'es')
  })
}

export function routineFormDataFromRoutine(
  routine: RoutineSearchable & {
    days_of_week?: number[] | null
    day_of_month?: number | null
    color?: string | null
    duration?: number | null
  }
) {
  return {
    title: routine.title,
    description: routine.description || '',
    frequency: routine.frequency as RoutineFrequency,
    days_of_week: routine.days_of_week || [],
    day_of_month: routine.day_of_month ?? null,
    scheduled_time: routine.scheduled_time ? routine.scheduled_time.slice(0, 5) : '',
    color: routine.color || '#007AFF',
    duration: routine.duration ?? null,
  }
}
