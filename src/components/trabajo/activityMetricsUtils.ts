import type {
  ActivityData,
  ActivityStatus,
  ActivityStatusEvent,
  ActivityTimeLog,
  ClientActivity,
} from './activityTypes'

export interface ActivityMetrics {
  loggedMinutes: number
  leadTimeMinutes: number
  inStatusMinutes: number
  isTimerRunning: boolean
}

export interface StatusDurationRow {
  status: ActivityStatus
  minutes: number
}

function nowIso(): string {
  return new Date().toISOString()
}

function newLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeActivityData(
  data: ActivityData,
  createdAt?: string
): ActivityData {
  const status = data.status ?? 'defined'
  const history =
    data.statusHistory && data.statusHistory.length > 0
      ? data.statusHistory
      : [{ status, at: createdAt ?? nowIso() }]

  return {
    ...data,
    status,
    statusHistory: history,
    timeLogs: data.timeLogs ?? [],
    activeTimerStartedAt: data.activeTimerStartedAt ?? null,
  }
}

export function buildNewActivityData(fields: ActivityData): ActivityData {
  const now = nowIso()
  const status = fields.status ?? 'defined'

  return normalizeActivityData(
    {
      ...fields,
      status,
      statusHistory: [{ status, at: now }],
      timeLogs: [],
      activeTimerStartedAt: null,
    },
    now
  )
}

export function transitionActivityStatus(
  data: ActivityData,
  newStatus: ActivityStatus,
  at = nowIso()
): ActivityData {
  const currentStatus = data.status ?? 'defined'
  if (currentStatus === newStatus) {
    return normalizeActivityData(data)
  }

  let next = normalizeActivityData(data)
  const history = [...(next.statusHistory ?? [])]
  history.push({ status: newStatus, at })

  next = {
    ...next,
    status: newStatus,
    statusHistory: history,
  }

  if (newStatus === 'done' || newStatus === 'wont_do') {
    next.resolvedAt = at
    next.completedDate = at.split('T')[0]
    if (next.activeTimerStartedAt) {
      next = stopTimer(next, at)
    }
  }

  return next
}

export function patchActivityFields(
  existing: ActivityData,
  patch: ActivityData,
  createdAt?: string
): ActivityData {
  const base = normalizeActivityData(existing, createdAt)
  const nextStatus = patch.status ?? base.status ?? 'defined'
  const {
    status: _status,
    statusHistory: _history,
    timeLogs: _logs,
    activeTimerStartedAt: _timer,
    resolvedAt: _resolved,
    ...safePatch
  } = patch

  const merged: ActivityData = {
    ...base,
    ...safePatch,
    status: base.status,
    statusHistory: base.statusHistory,
    timeLogs: base.timeLogs,
    activeTimerStartedAt: base.activeTimerStartedAt,
    resolvedAt: base.resolvedAt,
  }

  if (nextStatus !== base.status) {
    return transitionActivityStatus(merged, nextStatus)
  }

  return { ...merged, status: nextStatus }
}

export function startTimer(data: ActivityData, at = nowIso()): ActivityData {
  const normalized = normalizeActivityData(data)
  if (normalized.activeTimerStartedAt || isTerminalActivityStatus(normalized.status)) {
    return normalized
  }
  return { ...normalized, activeTimerStartedAt: at }
}

export function stopTimer(data: ActivityData, at = nowIso()): ActivityData {
  const normalized = normalizeActivityData(data)
  if (!normalized.activeTimerStartedAt) {
    return normalized
  }

  const startedAt = normalized.activeTimerStartedAt
  const minutes = Math.max(1, Math.round((Date.parse(at) - Date.parse(startedAt)) / 60000))
  const log: ActivityTimeLog = {
    id: newLogId(),
    startedAt,
    endedAt: at,
    minutes,
  }

  return {
    ...normalized,
    activeTimerStartedAt: null,
    timeLogs: [...(normalized.timeLogs ?? []), log],
  }
}

export function addManualTimeLog(
  data: ActivityData,
  minutes: number,
  note?: string,
  at = nowIso()
): ActivityData {
  const normalized = normalizeActivityData(data)
  const safeMinutes = Math.max(1, Math.round(minutes))
  const endedAt = Date.parse(at)
  const log: ActivityTimeLog = {
    id: newLogId(),
    startedAt: new Date(endedAt - safeMinutes * 60000).toISOString(),
    endedAt: at,
    minutes: safeMinutes,
    note: note?.trim() || undefined,
  }

  return {
    ...normalized,
    timeLogs: [...(normalized.timeLogs ?? []), log],
  }
}

function isTerminalActivityStatus(status: ActivityStatus | undefined): boolean {
  return status === 'done' || status === 'wont_do'
}

export function getTotalLoggedMinutes(data: ActivityData, now = Date.now()): number {
  const normalized = normalizeActivityData(data)
  const fromLogs = (normalized.timeLogs ?? []).reduce((sum, log) => sum + log.minutes, 0)

  if (!normalized.activeTimerStartedAt) {
    return fromLogs
  }

  const running = Math.max(
    0,
    Math.round((now - Date.parse(normalized.activeTimerStartedAt)) / 60000)
  )
  return fromLogs + running
}

export function getLeadTimeMinutes(
  data: ActivityData,
  createdAt?: string,
  now = Date.now()
): number {
  const normalized = normalizeActivityData(data, createdAt)
  const start = Date.parse(createdAt ?? normalized.statusHistory?.[0]?.at ?? String(now))
  const end = normalized.resolvedAt ? Date.parse(normalized.resolvedAt) : now
  return Math.max(0, Math.round((end - start) / 60000))
}

export function getTimeInCurrentStatusMinutes(data: ActivityData, now = Date.now()): number {
  const normalized = normalizeActivityData(data)
  const history = normalized.statusHistory ?? []
  if (history.length === 0) {
    return 0
  }
  const last = history[history.length - 1]
  return Math.max(0, Math.round((now - Date.parse(last.at)) / 60000))
}

export function getStatusDurations(
  data: ActivityData,
  createdAt?: string,
  now = Date.now()
): StatusDurationRow[] {
  const normalized = normalizeActivityData(data, createdAt)
  const history = normalized.statusHistory ?? []
  if (history.length === 0) {
    return []
  }

  const totals = new Map<ActivityStatus, number>()

  history.forEach((event, index) => {
    const start = Date.parse(event.at)
    const end =
      index < history.length - 1
        ? Date.parse(history[index + 1].at)
        : normalized.resolvedAt
          ? Date.parse(normalized.resolvedAt)
          : now
    const minutes = Math.max(0, Math.round((end - start) / 60000))
    totals.set(event.status, (totals.get(event.status) ?? 0) + minutes)
  })

  return [...totals.entries()].map(([status, minutes]) => ({ status, minutes }))
}

export function computeActivityMetrics(
  activity: Pick<ClientActivity, 'data' | 'created_at'>,
  now = Date.now()
): ActivityMetrics {
  const normalized = normalizeActivityData(activity.data, activity.created_at)
  return {
    loggedMinutes: getTotalLoggedMinutes(normalized, now),
    leadTimeMinutes: getLeadTimeMinutes(normalized, activity.created_at, now),
    inStatusMinutes: getTimeInCurrentStatusMinutes(normalized, now),
    isTimerRunning: Boolean(normalized.activeTimerStartedAt),
  }
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) {
    return '0 min'
  }
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`
}

export function formatDurationShort(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder > 0 ? `${hours}h${remainder}m` : `${hours}h`
}

export function summarizeActivityMetrics(activities: ClientActivity[], now = Date.now()): {
  totalLoggedMinutes: number
  averageLeadTimeMinutes: number
  resolvedCount: number
} {
  let totalLoggedMinutes = 0
  let leadSum = 0
  let resolvedCount = 0

  activities.forEach(activity => {
    const metrics = computeActivityMetrics(activity, now)
    totalLoggedMinutes += metrics.loggedMinutes
    if (isTerminalActivityStatus(activity.data.status)) {
      leadSum += metrics.leadTimeMinutes
      resolvedCount += 1
    }
  })

  return {
    totalLoggedMinutes,
    averageLeadTimeMinutes: resolvedCount > 0 ? Math.round(leadSum / resolvedCount) : 0,
    resolvedCount,
  }
}

export function sortActivitiesForKanban(a: ClientActivity, b: ClientActivity): number {
  const priorityWeight = (priority?: string) => {
    switch (priority) {
      case 'Alta':
        return 1
      case 'Media':
        return 2
      case 'Baja':
        return 3
      default:
        return 4
    }
  }

  const priorityDiff = priorityWeight(a.data.priority) - priorityWeight(b.data.priority)
  if (priorityDiff !== 0) {
    return priorityDiff
  }

  const dateA = Date.parse(a.created_at ?? '0')
  const dateB = Date.parse(b.created_at ?? '0')
  return dateA - dateB
}

export type { ActivityStatusEvent, ActivityTimeLog }
