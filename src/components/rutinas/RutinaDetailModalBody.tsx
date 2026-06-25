import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import type { Routine } from './routineTypes'
import {
  formatRoutineDayOfMonth,
  formatRoutineDaysOfWeek,
  formatRoutineDuration,
  formatRoutineFrequency,
  formatRoutineMeta,
  formatRoutineStreakLabel,
  getRoutineFrequencyChipClass,
} from './routineDisplayUtils'

interface RutinaDetailModalBodyProps {
  routine: Routine
  isLoading: boolean
  onEdit: () => void
  onDelete: () => void
}

function RutinaDetailModalBody({ routine, isLoading, onEdit, onDelete }: RutinaDetailModalBodyProps) {
  const durationLabel = formatRoutineDuration(routine.duration)

  return (
    <div className="modal-panel-content lifestyle-modal__body rutina-detail">
      <div className="rutina-detail__hero">
        <span
          className="rutina-detail__swatch"
          style={{ backgroundColor: routine.color || 'var(--accent-primary)' }}
          aria-hidden="true"
        />
        <div className="rutina-detail__hero-copy">
          <span className={getRoutineFrequencyChipClass(routine.frequency)}>
            {formatRoutineFrequency(routine.frequency)}
          </span>
          {routine.is_active === false ? (
            <span className="rutina-list-row__inactive">Pausada</span>
          ) : null}
          <p className="rutina-detail__schedule">{formatRoutineMeta(routine)}</p>
        </div>
      </div>

      {routine.description ? (
        <p className="rutina-detail__description">{routine.description}</p>
      ) : null}

      <div className="rutina-detail__stats" role="list" aria-label="Estadísticas de la rutina">
        <div className="rutina-stat-card rutina-stat-card--streak" role="listitem">
          <LocalFireDepartmentIcon className="rutina-stat-card__icon" aria-hidden="true" />
          <span className="rutina-stat-card__value">
            {formatRoutineStreakLabel(routine.current_streak)}
          </span>
          <span className="rutina-stat-card__label">Racha actual</span>
        </div>
        <div className="rutina-stat-card" role="listitem">
          <EmojiEventsIcon className="rutina-stat-card__icon" aria-hidden="true" />
          <span className="rutina-stat-card__value">
            {formatRoutineStreakLabel(routine.longest_streak)}
          </span>
          <span className="rutina-stat-card__label">Récord</span>
        </div>
        <div className="rutina-stat-card" role="listitem">
          <CheckCircleOutlineIcon className="rutina-stat-card__icon" aria-hidden="true" />
          <span className="rutina-stat-card__value">{routine.total_completions ?? 0}</span>
          <span className="rutina-stat-card__label">Completados</span>
        </div>
      </div>

      <dl className="lifestyle-modal__info-list rutina-detail__facts">
        {routine.frequency === 'weekly' && routine.days_of_week?.length ? (
          <div className="lifestyle-modal__info-item">
            <dt className="lifestyle-modal__info-label">Días</dt>
            <dd className="lifestyle-modal__info-value">
              {formatRoutineDaysOfWeek(routine.days_of_week)}
            </dd>
          </div>
        ) : null}
        {routine.frequency === 'monthly' && routine.day_of_month != null ? (
          <div className="lifestyle-modal__info-item">
            <dt className="lifestyle-modal__info-label">Día del mes</dt>
            <dd className="lifestyle-modal__info-value">
              {formatRoutineDayOfMonth(routine.day_of_month)}
            </dd>
          </div>
        ) : null}
        {routine.scheduled_time ? (
          <div className="lifestyle-modal__info-item">
            <dt className="lifestyle-modal__info-label">Hora</dt>
            <dd className="lifestyle-modal__info-value">{routine.scheduled_time.slice(0, 5)}</dd>
          </div>
        ) : null}
        {durationLabel ? (
          <div className="lifestyle-modal__info-item">
            <dt className="lifestyle-modal__info-label">Duración</dt>
            <dd className="lifestyle-modal__info-value">{durationLabel}</dd>
          </div>
        ) : null}
        {routine.completions_this_month != null && routine.completions_this_month > 0 ? (
          <div className="lifestyle-modal__info-item">
            <dt className="lifestyle-modal__info-label">Este mes</dt>
            <dd className="lifestyle-modal__info-value">
              {routine.completions_this_month} completado
              {routine.completions_this_month !== 1 ? 's' : ''}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="modal-actions-base lifestyle-modal__footer lifestyle-modal__footer--detail">
        <button
          type="button"
          className="btn-base btn-secondary lifestyle-modal__btn lifestyle-modal__btn--danger"
          onClick={onDelete}
          disabled={isLoading}
        >
          <DeleteIcon aria-hidden="true" />
          Eliminar
        </button>
        <button
          type="button"
          className="btn-base btn-accent lifestyle-modal__btn lifestyle-modal__btn--primary"
          onClick={onEdit}
        >
          <EditIcon aria-hidden="true" />
          Editar
        </button>
      </div>
    </div>
  )
}

export default RutinaDetailModalBody
