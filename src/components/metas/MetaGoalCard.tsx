import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { Goal, GoalTaskStatus } from './metaTypes'
import {
  calculateGoalProgress,
  formatGoalMeta,
  getGoalTaskStatusLabel,
  isGoalComplete,
} from './metasDisplayUtils'

interface MetaGoalCardProps {
  goal: Goal
  isExpanded: boolean
  isUpdating: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onTaskStatusChange: (taskId: string, status: GoalTaskStatus) => void
}

function MetaGoalCard({
  goal,
  isExpanded,
  isUpdating,
  onToggleExpand,
  onEdit,
  onDelete,
  onTaskStatusChange,
}: MetaGoalCardProps) {
  const progress = calculateGoalProgress(goal.tasks)
  const complete = isGoalComplete(goal)

  return (
    <article className={`metas-goal-card${complete ? ' metas-goal-card--complete' : ''}`}>
      <button
        type="button"
        className="metas-goal-card__header"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <div className="metas-goal-card__heading">
          <h2 className="metas-goal-card__title">{goal.title}</h2>
          <p className="metas-goal-card__meta">{formatGoalMeta(goal)}</p>
          {goal.description ? (
            <p className="metas-goal-card__description">{goal.description}</p>
          ) : null}
        </div>
        <ChevronRightIcon
          className={`metas-goal-card__chevron${isExpanded ? ' metas-goal-card__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {progress.total > 0 ? (
        <div className="metas-goal-card__progress" aria-hidden="true">
          <div
            className="metas-goal-card__progress-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      ) : null}

      {isExpanded ? (
        <div className="metas-goal-card__body">
          {goal.tasks.length === 0 ? (
            <p className="metas-goal-card__empty">Esta meta no tiene tareas aún.</p>
          ) : (
            <ul className="metas-task-list">
              {goal.tasks.map(task => (
                <li key={task.id} className="metas-task-row">
                  <button
                    type="button"
                    className={`metas-task-status metas-task-status--${task.status}`}
                    onClick={() => onTaskStatusChange(task.id, task.status)}
                    disabled={isUpdating}
                    aria-label={`${task.title}: ${getGoalTaskStatusLabel(task.status)}. Cambiar estado`}
                  >
                    {getGoalTaskStatusLabel(task.status)}
                  </button>
                  <span
                    className={`metas-task-title${task.status === 'done' ? ' metas-task-title--done' : ''}`}
                  >
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="app-control-group metas-goal-card__actions">
            <button type="button" className="btn-icon" onClick={onEdit} aria-label="Editar meta">
              <EditIcon fontSize="small" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn-icon btn-icon--danger"
              onClick={onDelete}
              aria-label="Eliminar meta"
            >
              <DeleteIcon fontSize="small" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export default MetaGoalCard
