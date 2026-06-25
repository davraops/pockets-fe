import { useEffect, useMemo, useState } from 'react'
import ActividadKanbanCard from './ActividadKanbanCard'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { getVisibleKanbanColumns } from './actividadKanbanUtils'
import { sortActivitiesForKanban } from './activityMetricsUtils'
import type { ActivityStatus, ClientActivity, KanbanColumnDef } from './activityTypes'

interface ActividadKanbanBoardProps {
  columns: KanbanColumnDef[]
  activities: ClientActivity[]
  className?: string
  onOpen: (activity: ClientActivity) => void
  onStatusChange: (activity: ClientActivity, status: ActivityStatus) => void
  onToggleTimer: (activity: ClientActivity) => void
}

function useKanbanClock(hasRunningTimer: boolean) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const intervalMs = hasRunningTimer ? 1000 : 30000
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [hasRunningTimer])

  return now
}

function ActividadKanbanBoard({
  columns,
  activities,
  className,
  onOpen,
  onStatusChange,
  onToggleTimer,
}: ActividadKanbanBoardProps) {
  const isMobile = useIsMobile()
  const [activeColumnId, setActiveColumnId] = useState<ActivityStatus>(columns[0]?.id ?? 'defined')
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null)
  const [dropColumn, setDropColumn] = useState<ActivityStatus | null>(null)

  useEffect(() => {
    if (!columns.some(column => column.id === activeColumnId)) {
      setActiveColumnId(columns[0]?.id ?? 'defined')
    }
  }, [activeColumnId, columns])

  const visibleColumns = getVisibleKanbanColumns(columns, activeColumnId, isMobile)

  const hasRunningTimer = activities.some(activity => Boolean(activity.data.activeTimerStartedAt))
  const now = useKanbanClock(hasRunningTimer)

  const grouped = useMemo(() => {
    const map = new Map<ActivityStatus, ClientActivity[]>()
    columns.forEach(column => map.set(column.id, []))

    activities.forEach(activity => {
      const status = activity.data.status ?? 'defined'
      const bucket = map.get(status)
      if (bucket) {
        bucket.push(activity)
      }
    })

    columns.forEach(column => {
      map.get(column.id)?.sort(sortActivitiesForKanban)
    })

    return map
  }, [activities, columns])

  const handleDrop = (status: ActivityStatus) => {
    const activityId = draggedActivityId
    setDraggedActivityId(null)
    setDropColumn(null)
    if (!activityId) {
      return
    }

    const activity = activities.find(item => item.id === activityId)
    if (!activity || activity.data.status === status) {
      return
    }

    onStatusChange(activity, status)
  }

  return (
    <div
      className={`actividad-kanban-board-wrapper${className ? ` ${className}` : ''}`}
    >
      {isMobile ? (
        <div
          className="actividad-kanban-tabs"
          role="tablist"
          aria-label="Columnas del tablero"
        >
          {columns.map(column => {
            const count = grouped.get(column.id)?.length ?? 0
            const isActive = column.id === activeColumnId
            return (
              <button
                key={column.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`actividad-kanban-tab${isActive ? ' actividad-kanban-tab--active' : ''}`}
                onClick={() => setActiveColumnId(column.id)}
              >
                <span className="actividad-kanban-tab-label">{column.label}</span>
                <span className="actividad-kanban-tab-count">{count}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    <div
      className={`actividad-kanban-board${className ? ` ${className}` : ''}`}
      role="region"
      aria-label="Tablero kanban de actividades"
    >
      {visibleColumns.map(column => {
        const columnActivities = grouped.get(column.id) ?? []
        const isDropTarget = dropColumn === column.id

        return (
          <section
            key={column.id}
            className={`actividad-kanban-column${isDropTarget ? ' actividad-kanban-column--drop' : ''}`}
            aria-label={`${column.label}, ${columnActivities.length} actividades`}
            onDragOver={event => {
              event.preventDefault()
              setDropColumn(column.id)
            }}
            onDragLeave={() => {
              if (dropColumn === column.id) {
                setDropColumn(null)
              }
            }}
            onDrop={event => {
              event.preventDefault()
              handleDrop(column.id)
            }}
          >
            <header className="actividad-kanban-column-header">
              <h2 className="actividad-kanban-column-title">{column.label}</h2>
              <span className="actividad-kanban-column-count">{columnActivities.length}</span>
            </header>
            <div className="actividad-kanban-column-body">
              {columnActivities.length === 0 ? (
                <p className="actividad-kanban-column-empty">Sin actividades</p>
              ) : (
                columnActivities.map(activity => (
                  <div
                    key={activity.id}
                    onDragStart={() => setDraggedActivityId(activity.id)}
                    onDragEnd={() => {
                      setDraggedActivityId(null)
                      setDropColumn(null)
                    }}
                  >
                    <ActividadKanbanCard
                      activity={activity}
                      now={now}
                      isDragging={draggedActivityId === activity.id}
                      onOpen={onOpen}
                      onToggleTimer={onToggleTimer}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
    </div>
  )
}

export default ActividadKanbanBoard
