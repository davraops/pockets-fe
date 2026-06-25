export type ActivityStatus = 'defined' | 'in_progress' | 'blocked' | 'done' | 'wont_do'

export interface ActivityStatusEvent {
  status: ActivityStatus
  at: string
}

export interface ActivityTimeLog {
  id: string
  startedAt: string
  endedAt: string
  minutes: number
  note?: string
}

export interface ActivityData {
  client?: string
  activity?: string
  ticket?: string
  priority?: string
  assignmentDate?: string
  status?: ActivityStatus
  completedDate?: string
  statusHistory?: ActivityStatusEvent[]
  timeLogs?: ActivityTimeLog[]
  activeTimerStartedAt?: string | null
  resolvedAt?: string
  estimatedMinutes?: number
}

export interface ClientActivity {
  id: string
  name: string
  data: ActivityData
  created_at?: string
  updated_at?: string
}

export interface KanbanColumnDef {
  id: ActivityStatus
  label: string
}

export const KANBAN_ACTIVE_COLUMNS: KanbanColumnDef[] = [
  { id: 'defined', label: 'Definida' },
  { id: 'in_progress', label: 'En progreso' },
  { id: 'blocked', label: 'Bloqueada' },
]

export const KANBAN_COMPLETED_COLUMNS: KanbanColumnDef[] = [
  { id: 'done', label: 'Completada' },
  { id: 'wont_do', label: 'No se hará' },
]

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  defined: 'Definida',
  in_progress: 'En progreso',
  blocked: 'Bloqueada',
  done: 'Completada',
  wont_do: 'No se hará',
}

export function isTerminalActivityStatus(status: ActivityStatus | undefined): boolean {
  return status === 'done' || status === 'wont_do'
}

export function isActiveActivityStatus(status: ActivityStatus | undefined): boolean {
  return !isTerminalActivityStatus(status)
}
