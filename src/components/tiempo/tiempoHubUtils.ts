import {
  formatEventTime,
  formatEventWhenLabel,
  getUpcomingEvents,
  type FechasListEvent,
} from '../fechas/fechasDisplayUtils'
import { calculateDiaryStreaks, getDiaryStreakMessage } from '../miDiario/miDiarioDisplayUtils'
import { formatRoutineTime } from '../rutinas/routineDisplayUtils'
import { summarizeGoalsStats, normalizeGoalTaskStatus } from '../metas/metasDisplayUtils'
import { summarizePersonalValues } from '../valores/valoresDisplayUtils'

export interface TiempoHubStats {
  eventosHoy: number
  eventosProximos: number
  rutinasHoy: number
  rutinasCompletadasHoy: number
  rutinasTotal: number
  diarioEntradas: number
  diarioRacha: number
  diarioRachaRecord: number
  rutinasConRacha: number
  mejorRachaRutina: number
  metasTotal: number
  metasCompletadas: number
  metasTareasPendientes: number
  valoresTotal: number
  valoresCount: number
  creenciasCount: number
}

export interface TiempoHubRoutineStreakItem {
  id: string
  title: string
  streak: number
}

export interface TiempoHubRoutineItem {
  id: string
  title: string
  scheduledTime: string | null
  isCompleted: boolean
  duration?: number | null
  currentStreak?: number | null
  longestStreak?: number | null
}

export interface TiempoHubEventItem {
  id: string
  title: string
  date: string
  whenLabel: string
  timeLabel: string | null
}

export interface TiempoHubData {
  stats: TiempoHubStats
  todayRoutines: TiempoHubRoutineItem[]
  pendingRoutines: TiempoHubRoutineItem[]
  upcomingEvents: TiempoHubEventItem[]
  routineStreaks: TiempoHubRoutineStreakItem[]
  hasDiaryEntryToday: boolean
  diaryStreakMessage: string
}

export const EMPTY_TIEMPO_HUB_STATS: TiempoHubStats = {
  eventosHoy: 0,
  eventosProximos: 0,
  rutinasHoy: 0,
  rutinasCompletadasHoy: 0,
  rutinasTotal: 0,
  diarioEntradas: 0,
  diarioRacha: 0,
  diarioRachaRecord: 0,
  rutinasConRacha: 0,
  mejorRachaRutina: 0,
  metasTotal: 0,
  metasCompletadas: 0,
  metasTareasPendientes: 0,
  valoresTotal: 0,
  valoresCount: 0,
  creenciasCount: 0,
}

export const EMPTY_TIEMPO_HUB_DATA: TiempoHubData = {
  stats: EMPTY_TIEMPO_HUB_STATS,
  todayRoutines: [],
  pendingRoutines: [],
  upcomingEvents: [],
  routineStreaks: [],
  hasDiaryEntryToday: false,
  diaryStreakMessage: '',
}

interface EventApiRow {
  id: string
  title: string
  event_date: string
  event_time?: string | null
  is_all_day?: boolean
}

interface RoutineApiRow {
  id: string
  title: string
  scheduled_time?: string | null
  current_streak?: number | null
  longest_streak?: number | null
  duration?: number | null
  frequency?: string
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function toHubListEvent(event: { id: string; fecha: string; titulo?: string; esTodoElDia?: boolean }): FechasListEvent {
  return {
    id: event.id,
    titulo: event.titulo ?? '',
    fecha: event.fecha,
    esTodoElDia: event.esTodoElDia ?? true,
  }
}

function countEventsToday(events: Array<{ fecha: string }>): number {
  const today = startOfDay(new Date())
  return events.filter(event => startOfDay(new Date(event.fecha.includes('T') ? event.fecha : `${event.fecha}T12:00:00`)).getTime() === today.getTime()).length
}

function countUpcomingEvents(events: Array<{ id: string; fecha: string }>, horizonDays = 30): number {
  return getUpcomingEvents(events.map(toHubListEvent), Number.MAX_SAFE_INTEGER, horizonDays).length
}

function sortRoutinesByTime(routines: TiempoHubRoutineItem[]): TiempoHubRoutineItem[] {
  return [...routines].sort((a, b) => {
    const timeA = a.scheduledTime ?? ''
    const timeB = b.scheduledTime ?? ''
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

function mapTodayHubRoutine(
  routine: RoutineApiRow,
  completedRoutineIds: Set<string>
): TiempoHubRoutineItem {
  return {
    id: routine.id,
    title: routine.title,
    scheduledTime: routine.scheduled_time ?? null,
    isCompleted: completedRoutineIds.has(routine.id),
    duration: routine.duration ?? null,
    currentStreak: routine.current_streak ?? null,
    longestStreak: routine.longest_streak ?? null,
  }
}

function sortTodayHubRoutines(routines: TiempoHubRoutineItem[]): TiempoHubRoutineItem[] {
  const pending = sortRoutinesByTime(routines.filter(routine => !routine.isCompleted))
  const completed = sortRoutinesByTime(routines.filter(routine => routine.isCompleted))
  return [...pending, ...completed]
}

function updateRoutineStreakList(
  routineStreaks: TiempoHubRoutineStreakItem[],
  routine: Pick<TiempoHubRoutineItem, 'id' | 'title'>,
  streak: number
): TiempoHubRoutineStreakItem[] {
  const withoutRoutine = routineStreaks.filter(item => item.id !== routine.id)
  if (streak <= 0) {
    return withoutRoutine
  }

  return [...withoutRoutine, { id: routine.id, title: routine.title, streak }]
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)
}

export function applyRoutineCompletionToHubData(
  data: TiempoHubData,
  routineId: string,
  streaks: { currentStreak: number; longestStreak: number }
): TiempoHubData {
  const target = data.todayRoutines.find(routine => routine.id === routineId)
  if (!target || target.isCompleted) {
    return data
  }

  const todayRoutines = sortTodayHubRoutines(
    data.todayRoutines.map(routine =>
      routine.id === routineId
        ? {
            ...routine,
            isCompleted: true,
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
          }
        : routine
    )
  )
  const pendingRoutines = todayRoutines.filter(routine => !routine.isCompleted)
  const hadStreak = (target.currentStreak ?? 0) > 0
  const rutinasConRacha =
    hadStreak || streaks.currentStreak <= 0
      ? data.stats.rutinasConRacha
      : data.stats.rutinasConRacha + 1
  const routineStreaks = updateRoutineStreakList(
    data.routineStreaks,
    target,
    streaks.currentStreak
  )

  return {
    ...data,
    todayRoutines,
    pendingRoutines,
    routineStreaks,
    stats: {
      ...data.stats,
      rutinasCompletadasHoy: data.stats.rutinasCompletadasHoy + 1,
      rutinasConRacha,
      mejorRachaRutina: Math.max(data.stats.mejorRachaRutina, streaks.currentStreak),
    },
  }
}

export function buildTiempoHubData(input: {
  events: EventApiRow[]
  todayRoutines: RoutineApiRow[]
  completedRoutineIds: Set<string>
  allRoutines: unknown[]
  diaryEntries: Array<{ entry_date: string }>
  goals?: Array<{
    tasks?: Array<{ id?: string; title?: string; status?: string }>
  }>
  personalValues?: Array<{ kind?: string }>
  today: string
}): TiempoHubData {
  const mappedEvents = input.events.map(event => ({ id: event.id, fecha: event.event_date }))
  const streaks = calculateDiaryStreaks(input.diaryEntries.map(entry => entry.entry_date))
  const allRoutineRows = input.allRoutines as RoutineApiRow[]
  const rutinasConRacha = allRoutineRows.filter(
    routine => (routine.current_streak ?? 0) > 0
  ).length
  const routineStreaks = allRoutineRows
    .filter(routine => (routine.current_streak ?? 0) > 0)
    .sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))
    .slice(0, 5)
    .map(routine => ({
      id: routine.id,
      title: routine.title,
      streak: routine.current_streak ?? 0,
    }))
  const mejorRachaRutina =
    routineStreaks.length > 0 ? routineStreaks[0].streak : 0
  const goalStats = summarizeGoalsStats(
    (input.goals ?? []).map(goal => ({
      tasks: (goal.tasks ?? []).map(task => ({
        id: task.id ?? 'task',
        title: task.title ?? '',
        status: normalizeGoalTaskStatus(task.status),
      })),
    }))
  )
  const valueStats = summarizePersonalValues(
    (input.personalValues ?? []).map(entry => ({
      id: 'entry',
      kind: entry.kind === 'belief' ? 'belief' : 'value',
      title: '',
      description: null,
      created_at: '',
      updated_at: '',
    }))
  )

  const hasDiaryEntryToday = input.diaryEntries.some(
    entry => entry.entry_date.split('T')[0] === input.today
  )

  const stats: TiempoHubStats = {
    eventosHoy: countEventsToday(mappedEvents),
    eventosProximos: countUpcomingEvents(mappedEvents),
    rutinasHoy: input.todayRoutines.length,
    rutinasCompletadasHoy: input.todayRoutines.filter(routine =>
      input.completedRoutineIds.has(routine.id)
    ).length,
    rutinasTotal: input.allRoutines.length,
    diarioEntradas: input.diaryEntries.length,
    diarioRacha: streaks.current,
    diarioRachaRecord: streaks.longest,
    rutinasConRacha,
    mejorRachaRutina,
    metasTotal: goalStats.total,
    metasCompletadas: goalStats.completed,
    metasTareasPendientes: goalStats.pendingTasks,
    valoresTotal: valueStats.total,
    valoresCount: valueStats.values,
    creenciasCount: valueStats.beliefs,
  }

  const todayRoutines = sortTodayHubRoutines(
    input.todayRoutines.map(routine => mapTodayHubRoutine(routine, input.completedRoutineIds))
  )
  const pendingRoutines = todayRoutines.filter(routine => !routine.isCompleted)

  const upcomingEvents = getUpcomingEvents(
    input.events.map(event => ({
      id: event.id,
      titulo: event.title,
      fecha: event.event_date,
      esTodoElDia: event.is_all_day ?? true,
      hora: event.event_time ?? null,
    })),
    4
  ).map(event => {
    const source = input.events.find(item => item.id === event.id)
    const timeLabel =
      source && !source.is_all_day && source.event_time
        ? formatEventTime(source.event_time)
        : source?.is_all_day
          ? 'Todo el día'
          : null

    return {
      id: event.id,
      title: source?.title ?? 'Evento',
      date: event.fecha,
      whenLabel: formatEventWhenLabel({ fecha: event.fecha }),
      timeLabel,
    }
  })

  return {
    stats,
    todayRoutines,
    pendingRoutines,
    upcomingEvents,
    routineStreaks,
    hasDiaryEntryToday,
    diaryStreakMessage: getDiaryStreakMessage(
      streaks.current,
      hasDiaryEntryToday,
      input.diaryEntries.length
    ),
  }
}

/** @deprecated Use buildTiempoHubData().stats */
export function buildTiempoHubStats(input: {
  events: Array<{ event_date: string }>
  todayRoutines: Array<{ isCompleted?: boolean }>
  allRoutines: unknown[]
  diaryEntries: Array<{ entry_date: string }>
}): TiempoHubStats {
  return buildTiempoHubData({
    events: input.events.map((event, index) => ({
      id: String(index),
      title: '',
      event_date: event.event_date,
    })),
    todayRoutines: input.todayRoutines.map((routine, index) => ({
      id: String(index),
      title: '',
    })),
    completedRoutineIds: new Set(
      input.todayRoutines
        .map((routine, index) => (routine.isCompleted ? String(index) : null))
        .filter((id): id is string => id !== null)
    ),
    allRoutines: input.allRoutines,
    diaryEntries: input.diaryEntries,
    today: new Date().toISOString().split('T')[0],
  }).stats
}

export function formatTiempoHubSubtitle(
  section: 'fechas' | 'mi-dia' | 'rutinas' | 'mi-diario' | 'metas' | 'valores',
  stats: TiempoHubStats
): string {
  switch (section) {
    case 'fechas':
      if (stats.eventosHoy > 0) {
        return `${stats.eventosHoy} hoy · ${stats.eventosProximos} próximos`
      }
      if (stats.eventosProximos > 0) {
        return `${stats.eventosProximos} en los próximos 30 días`
      }
      return 'Sin eventos próximos'

    case 'mi-dia':
      if (stats.rutinasHoy === 0) {
        return 'Sin rutinas programadas hoy'
      }
      return `${stats.rutinasCompletadasHoy}/${stats.rutinasHoy} completadas hoy`

    case 'rutinas':
      if (stats.rutinasTotal === 0) {
        return 'Aún no tienes rutinas'
      }
      if (stats.rutinasConRacha > 0) {
        return `${stats.rutinasTotal} rutinas · ${stats.rutinasConRacha} con racha`
      }
      return `${stats.rutinasTotal} rutina${stats.rutinasTotal !== 1 ? 's' : ''} activas`

    case 'mi-diario':
      if (stats.diarioEntradas === 0) {
        return 'Empieza tu primera entrada'
      }
      if (stats.diarioRacha > 0) {
        return `${stats.diarioEntradas} entradas · racha ${stats.diarioRacha} días`
      }
      return `${stats.diarioEntradas} entrada${stats.diarioEntradas !== 1 ? 's' : ''}`

    case 'metas':
      if (stats.metasTotal === 0) {
        return 'Define tu primera meta'
      }
      if (stats.metasTareasPendientes > 0) {
        return `${stats.metasTotal} meta${stats.metasTotal !== 1 ? 's' : ''} · ${stats.metasTareasPendientes} tarea${stats.metasTareasPendientes !== 1 ? 's' : ''} pendiente${stats.metasTareasPendientes !== 1 ? 's' : ''}`
      }
      return `${stats.metasCompletadas}/${stats.metasTotal} metas completadas`

    case 'valores':
      if (stats.valoresTotal === 0) {
        return 'Define tu brújula personal'
      }
      return `${stats.valoresCount} valor${stats.valoresCount !== 1 ? 'es' : ''} · ${stats.creenciasCount} creencia${stats.creenciasCount !== 1 ? 's' : ''}`

    default:
      return ''
  }
}

export function formatTiempoHeroValue(stats: TiempoHubStats): string {
  if (stats.rutinasHoy === 0) {
    return '—'
  }
  return `${stats.rutinasCompletadasHoy}/${stats.rutinasHoy}`
}

export function formatTiempoHeroSubline(data: TiempoHubData): string {
  const parts: string[] = []

  if (data.stats.eventosHoy > 0) {
    parts.push(
      `${data.stats.eventosHoy} evento${data.stats.eventosHoy !== 1 ? 's' : ''} hoy`
    )
  } else if (data.upcomingEvents.length > 0) {
    parts.push(`Próximo: ${data.upcomingEvents[0].title}`)
  }

  if (data.stats.rutinasHoy > 0) {
    const pending = data.stats.rutinasHoy - data.stats.rutinasCompletadasHoy
    if (pending > 0) {
      parts.push(`${pending} rutina${pending !== 1 ? 's' : ''} pendiente${pending !== 1 ? 's' : ''}`)
    } else {
      parts.push('Rutinas de hoy completadas')
    }
  }

  if (data.stats.diarioRacha > 0) {
    parts.push(`Racha diario ${data.stats.diarioRacha} días`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Agenda personal, rutinas y reflexión'
}

export function formatTiempoRoutineStreak(streak: number | null | undefined): string {
  const value = streak ?? 0
  if (value <= 0) {
    return 'Sin racha'
  }
  return value === 1 ? '1 día' : `${value} días`
}

export function formatTiempoRoutineStreakBadge(streak: number | null | undefined): string | null {
  const value = streak ?? 0
  if (value <= 0) {
    return null
  }
  return `${value}d`
}

export function formatTiempoRoutineTime(time: string | null): string {
  if (!time) {
    return 'Sin hora'
  }
  return formatRoutineTime(time)
}

export function formatTiempoStreakDays(days: number): string {
  if (days <= 0) {
    return 'Sin racha'
  }
  return days === 1 ? '1 día' : `${days} días`
}

export function formatTiempoEventMeta(event: TiempoHubEventItem): string {
  if (event.timeLabel) {
    return `${event.whenLabel} · ${event.timeLabel}`
  }
  return event.whenLabel
}
