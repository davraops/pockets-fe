export interface FechasListEvent {
  id: string
  titulo: string
  descripcion?: string | null
  fecha: string
  hora?: string | null
  esTodoElDia: boolean
  ubicacion?: string | null
  color?: string | null
  esRecurrente?: boolean
  frecuenciaRecurrencia?: string | null
  intervaloRecurrencia?: number | null
  fechaFinRecurrencia?: string | null
}

export type FechasEventUrgency = 'today' | 'tomorrow' | 'upcoming' | 'past'

export interface FechasDateBadge {
  primary: string
  secondary: string
}

export interface FechasPeriodGroup<T> {
  id: 'today' | 'tomorrow' | 'this-week' | 'later' | 'past'
  label: string
  events: T[]
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function parseEventDate(fecha: string): Date {
  if (fecha.includes('T')) {
    return startOfDay(new Date(fecha))
  }
  return startOfDay(new Date(`${fecha}T12:00:00`))
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatRecurrenceLabel(
  event: Pick<
    FechasListEvent,
    'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'
  >
): string | null {
  if (!event.esRecurrente || !event.frecuenciaRecurrencia) {
    return null
  }

  const interval = Math.max(1, event.intervaloRecurrencia ?? 1)
  const labels: Record<string, string> = {
    daily: 'día',
    weekly: 'semana',
    monthly: 'mes',
    yearly: 'año',
  }
  const unit = labels[event.frecuenciaRecurrencia]
  if (!unit) {
    return 'Recurrente'
  }

  const frequency =
    interval === 1
      ? ({ daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' }[
          event.frecuenciaRecurrencia
        ] ?? 'Recurrente')
      : `Cada ${interval} ${unit}${interval === 1 ? '' : 's'}`

  if (event.fechaFinRecurrencia) {
    return `${frequency} · hasta ${formatEventDateLong(event.fechaFinRecurrencia)}`
  }

  return frequency
}

export function getEffectiveEventDate(
  event: Pick<
    FechasListEvent,
    'fecha' | 'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'
  >
): string {
  if (!event.esRecurrente || !event.frecuenciaRecurrencia) {
    return event.fecha
  }

  const base = parseEventDate(event.fecha)
  const today = startOfDay(new Date())
  const interval = Math.max(1, event.intervaloRecurrencia ?? 1)
  const endDate = event.fechaFinRecurrencia ? parseEventDate(event.fechaFinRecurrencia) : null
  let candidate: Date

  switch (event.frecuenciaRecurrencia) {
    case 'yearly': {
      candidate = startOfDay(new Date(today.getFullYear(), base.getMonth(), base.getDate()))
      if (candidate < today) {
        candidate = startOfDay(
          new Date(today.getFullYear() + interval, base.getMonth(), base.getDate())
        )
      }
      break
    }
    case 'monthly': {
      candidate = startOfDay(new Date(today.getFullYear(), today.getMonth(), base.getDate()))
      if (candidate < today) {
        candidate = startOfDay(
          new Date(today.getFullYear(), today.getMonth() + interval, base.getDate())
        )
      }
      break
    }
    case 'weekly': {
      candidate = new Date(today)
      const targetDay = base.getDay()
      const currentDay = candidate.getDay()
      let daysUntil = (targetDay - currentDay + 7) % 7
      if (daysUntil === 0 && parseEventDate(event.fecha) < today) {
        daysUntil = 7 * interval
      }
      candidate.setDate(candidate.getDate() + daysUntil)
      candidate = startOfDay(candidate)
      break
    }
    case 'daily':
      candidate = today
      break
    default:
      return event.fecha
  }

  if (endDate && candidate > endDate) {
    return event.fecha
  }

  return toIsoDate(candidate)
}

export function getDayOffsetFromToday(fecha: string): number {
  const today = startOfDay(new Date())
  const eventDate = parseEventDate(fecha)
  return Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getEventUrgency(event: Pick<FechasListEvent, 'fecha' | 'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'>): FechasEventUrgency {
  const dayOffset = getDayOffsetFromToday(getEffectiveEventDate(event))
  if (dayOffset === 0) {
    return 'today'
  }
  if (dayOffset === 1) {
    return 'tomorrow'
  }
  if (dayOffset > 1) {
    return 'upcoming'
  }
  return 'past'
}

export function formatEventDateBadge(
  event: Pick<FechasListEvent, 'fecha' | 'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'>
): FechasDateBadge {
  const effectiveDate = getEffectiveEventDate(event)
  const dayOffset = getDayOffsetFromToday(effectiveDate)
  const eventDate = parseEventDate(effectiveDate)

  if (dayOffset === 0) {
    return { primary: 'HOY', secondary: eventDate.toLocaleDateString('es-ES', { month: 'short' }) }
  }

  if (dayOffset === 1) {
    return { primary: 'MAÑ', secondary: eventDate.toLocaleDateString('es-ES', { month: 'short' }) }
  }

  return {
    primary: eventDate.toLocaleDateString('es-ES', { day: 'numeric' }),
    secondary: eventDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
  }
}

export function getEventCardChips(
  event: Pick<
    FechasListEvent,
    'esTodoElDia' | 'hora' | 'ubicacion' | 'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'
  >
): string[] {
  const chips: string[] = []

  const recurrence = formatRecurrenceLabel(event)
  if (recurrence) {
    chips.push(recurrence)
  }

  if (event.esTodoElDia) {
    chips.push('Todo el día')
  } else if (event.hora) {
    chips.push(formatEventTime(event.hora))
  }

  if (event.ubicacion?.trim()) {
    chips.push(event.ubicacion.trim())
  }

  return chips
}

export function compareEventsBySchedule<T extends FechasListEvent>(a: T, b: T): number {
  const dateDiff =
    parseEventDate(getEffectiveEventDate(a)).getTime() -
    parseEventDate(getEffectiveEventDate(b)).getTime()
  if (dateDiff !== 0) {
    return dateDiff
  }

  if (a.esTodoElDia && !b.esTodoElDia) {
    return -1
  }
  if (!a.esTodoElDia && b.esTodoElDia) {
    return 1
  }

  return (a.hora ?? '').localeCompare(b.hora ?? '')
}

export function getNextFeaturedEvent<T extends FechasListEvent>(events: T[]): T | null {
  const today = startOfDay(new Date())

  const upcoming = events
    .filter(event => parseEventDate(getEffectiveEventDate(event)) >= today)
    .sort(compareEventsBySchedule)

  return upcoming[0] ?? null
}

export function groupEventsByPeriod<T extends FechasListEvent>(events: T[]): FechasPeriodGroup<T>[] {
  const groups: FechasPeriodGroup<T>[] = [
    { id: 'today', label: 'Hoy', events: [] },
    { id: 'tomorrow', label: 'Mañana', events: [] },
    { id: 'this-week', label: 'Esta semana', events: [] },
    { id: 'later', label: 'Más adelante', events: [] },
    { id: 'past', label: 'Pasados', events: [] },
  ]

  const sorted = [...events].sort(compareEventsBySchedule)

  for (const event of sorted) {
    const dayOffset = getDayOffsetFromToday(getEffectiveEventDate(event))

    if (dayOffset === 0) {
      groups[0].events.push(event)
    } else if (dayOffset === 1) {
      groups[1].events.push(event)
    } else if (dayOffset >= 2 && dayOffset <= 7) {
      groups[2].events.push(event)
    } else if (dayOffset > 7) {
      groups[3].events.push(event)
    } else {
      groups[4].events.push(event)
    }
  }

  return groups.filter(group => group.events.length > 0)
}

export function excludeFeaturedEvent<T extends { id: string }>(
  events: T[],
  featured: T | null
): T[] {
  if (!featured) {
    return events
  }

  return events.filter(event => event.id !== featured.id)
}

export function formatEventWhenLabel(
  event: Pick<FechasListEvent, 'fecha' | 'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'>
): string {
  const dayOffset = getDayOffsetFromToday(getEffectiveEventDate(event))
  if (dayOffset === 0) {
    return 'Hoy'
  }
  if (dayOffset === 1) {
    return 'Mañana'
  }
  if (dayOffset > 1) {
    return `En ${dayOffset} días`
  }
  if (dayOffset === -1) {
    return 'Ayer'
  }
  return `Hace ${Math.abs(dayOffset)} días`
}

export function formatEventListValue(
  event: Pick<FechasListEvent, 'fecha' | 'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'>
): string {
  const label = formatEventWhenLabel(event)
  return label.replace(' días', ' d')
}

export function formatEventDateLong(dateString: string): string {
  return parseEventDate(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatEventTime(timeString: string | null | undefined): string {
  if (!timeString) {
    return ''
  }
  return timeString.slice(0, 5)
}

export function formatEventMeta(
  event: Pick<
    FechasListEvent,
    'fecha' | 'hora' | 'esTodoElDia' | 'ubicacion' | 'esRecurrente' | 'frecuenciaRecurrencia' | 'intervaloRecurrencia' | 'fechaFinRecurrencia'
  >
): string {
  const parts: string[] = []

  const recurrence = formatRecurrenceLabel(event)
  if (recurrence) {
    parts.push(recurrence)
  }

  if (event.esTodoElDia) {
    parts.push('Todo el día')
  } else if (event.hora) {
    parts.push(formatEventTime(event.hora))
  } else {
    parts.push(formatEventDateLong(event.fecha))
  }

  if (event.ubicacion?.trim()) {
    parts.push(event.ubicacion.trim())
  }

  return parts.join(' · ')
}

export function getUpcomingEvents<T extends FechasListEvent>(
  events: T[],
  maxCount = 5,
  horizonDays = 30
): T[] {
  const today = startOfDay(new Date())
  const horizon = new Date(today)
  horizon.setDate(today.getDate() + horizonDays)

  return events
    .filter(event => {
      const eventDate = parseEventDate(getEffectiveEventDate(event))
      return eventDate >= today && eventDate <= horizon
    })
    .sort(compareEventsBySchedule)
    .slice(0, maxCount)
}

export function getRemainingListEvents<T extends { id: string }>(
  events: T[],
  upcomingEvents: T[]
): T[] {
  const upcomingIds = new Set(upcomingEvents.map(event => event.id))
  return events.filter(event => !upcomingIds.has(event.id))
}

export function calculateEventHighlights(events: FechasListEvent[]) {
  const today = startOfDay(new Date())
  const hoy = events.filter(
    event => parseEventDate(getEffectiveEventDate(event)).getTime() === today.getTime()
  ).length

  return {
    total: events.length,
    proximos: countUpcomingEvents(events),
    hoy,
  }
}

export function countEventsToday(events: FechasListEvent[]): number {
  const today = startOfDay(new Date())
  return events.filter(
    event => parseEventDate(getEffectiveEventDate(event)).getTime() === today.getTime()
  ).length
}

export function countUpcomingEvents(events: FechasListEvent[], horizonDays = 30): number {
  return getUpcomingEvents(events, Number.MAX_SAFE_INTEGER, horizonDays).length
}

export interface FechasSearchableEvent {
  titulo: string
  descripcion?: string | null
  ubicacion?: string | null
  fecha: string
  esRecurrente?: boolean
  frecuenciaRecurrencia?: string | null
  intervaloRecurrencia?: number | null
  fechaFinRecurrencia?: string | null
}

export function filterEventsByQuery<T extends FechasSearchableEvent>(
  events: T[],
  query: string
): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return events
  }

  return events.filter(event => {
    const haystack = [
      event.titulo,
      event.descripcion ?? '',
      event.ubicacion ?? '',
      formatEventDateLong(event.fecha),
      formatEventWhenLabel(event),
      formatRecurrenceLabel(event) ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
