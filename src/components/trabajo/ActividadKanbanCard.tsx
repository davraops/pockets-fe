import { useEffect, useMemo, useState } from 'react'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import { sectionColor } from '../../constants/sectionColors'
import {
  computeActivityMetrics,
  formatDurationShort,
} from './activityMetricsUtils'
import type { ClientActivity } from './activityTypes'
import { ACTIVITY_STATUS_LABELS } from './activityTypes'

interface ActividadKanbanCardProps {
  activity: ClientActivity
  now: number
  isDragging?: boolean
  onOpen: (activity: ClientActivity) => void
  onToggleTimer: (activity: ClientActivity) => void
}

function getPriorityClass(priority?: string): string {
  switch (priority) {
    case 'Alta':
      return 'actividad-kanban-card-priority--high'
    case 'Media':
      return 'actividad-kanban-card-priority--medium'
    case 'Baja':
      return 'actividad-kanban-card-priority--low'
    default:
      return ''
  }
}

function ActividadKanbanCard({
  activity,
  now,
  isDragging = false,
  onOpen,
  onToggleTimer,
}: ActividadKanbanCardProps) {
  const metrics = useMemo(() => computeActivityMetrics(activity, now), [activity, now])
  const statusLabel = ACTIVITY_STATUS_LABELS[activity.data.status ?? 'defined']
  const canTrackTime = activity.data.status !== 'done' && activity.data.status !== 'wont_do'

  return (
    <article
      className={`actividad-kanban-card${isDragging ? ' actividad-kanban-card--dragging' : ''}`}
      draggable
      onDragStart={event => {
        event.dataTransfer.setData('text/activity-id', activity.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
    >
      <button
        type="button"
        className="actividad-kanban-card-main"
        onClick={() => onOpen(activity)}
        aria-label={`Abrir ${activity.name}`}
      >
        <div className="actividad-kanban-card-header">
          <span className="actividad-kanban-card-title">{activity.name}</span>
          {activity.data.priority && (
            <span
              className={`actividad-kanban-card-priority ${getPriorityClass(activity.data.priority)}`}
            >
              {activity.data.priority}
            </span>
          )}
        </div>
        <p className="actividad-kanban-card-client">{activity.data.client ?? 'Sin cliente'}</p>
        {activity.data.ticket && (
          <p className="actividad-kanban-card-ticket">{activity.data.ticket}</p>
        )}
        <div className="actividad-kanban-card-metrics" aria-label="Métricas de tiempo">
          <span className="actividad-kanban-metric">
            <AccessTimeIcon aria-hidden="true" />
            {formatDurationShort(metrics.loggedMinutes)} trabajados
          </span>
          <span className="actividad-kanban-metric">
            {formatDurationShort(metrics.leadTimeMinutes)} total
          </span>
          <span className="actividad-kanban-metric">
            {formatDurationShort(metrics.inStatusMinutes)} en {statusLabel.toLowerCase()}
          </span>
        </div>
      </button>
      {canTrackTime && (
        <button
          type="button"
          className={`actividad-kanban-timer${metrics.isTimerRunning ? ' actividad-kanban-timer--active' : ''}`}
          onClick={event => {
            event.stopPropagation()
            onToggleTimer(activity)
          }}
          aria-label={metrics.isTimerRunning ? 'Detener cronómetro' : 'Iniciar cronómetro'}
          style={{ '--section-color': sectionColor.trabajo } as React.CSSProperties}
        >
          {metrics.isTimerRunning ? <StopIcon aria-hidden="true" /> : <PlayArrowIcon aria-hidden="true" />}
        </button>
      )}
    </article>
  )
}

export default ActividadKanbanCard
