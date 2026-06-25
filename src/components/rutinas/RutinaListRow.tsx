import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ScheduleIcon from '@mui/icons-material/Schedule'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import type { Routine } from './routineTypes'
import {
  formatRoutineDuration,
  formatRoutineFrequency,
  formatRoutineMeta,
  formatRoutineTime,
  getRoutineAccentClass,
  getRoutineFrequencyChipClass,
} from './routineDisplayUtils'

interface RutinaListRowProps {
  routine: Routine
  onClick: () => void
}

function RutinaListRow({ routine, onClick }: RutinaListRowProps) {
  const streak = routine.current_streak ?? 0
  const durationLabel = formatRoutineDuration(routine.duration)
  const timeLabel = routine.scheduled_time ? formatRoutineTime(routine.scheduled_time) : undefined
  const isInactive = routine.is_active === false

  return (
    <button
      type="button"
      className={`crud-inset-row rutina-list-row ${getRoutineAccentClass(routine.frequency)}${isInactive ? ' rutina-list-row--inactive' : ''}`}
      onClick={onClick}
      aria-label={`Ver rutina ${routine.title}`}
    >
      <span
        className="rutina-list-row__swatch"
        style={{ backgroundColor: routine.color || 'var(--accent-primary)' }}
        aria-hidden="true"
      />

      <div className="crud-row-content rutina-list-row__content">
        <div className="crud-row-header rutina-list-row__header">
          <div className="rutina-list-row__title-block">
            <span className="crud-row-title">{routine.title}</span>
            {isInactive ? <span className="rutina-list-row__inactive">Pausada</span> : null}
          </div>
          <div className="rutina-list-row__aside">
            {streak > 0 ? (
              <span className="rutina-streak-badge" title={`Racha de ${streak} días`}>
                <LocalFireDepartmentIcon className="rutina-streak-badge__icon" aria-hidden="true" />
                {streak}d
              </span>
            ) : null}
            <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
          </div>
        </div>

        <div className="rutina-list-row__chips" aria-label="Detalles de la rutina">
          <span className={getRoutineFrequencyChipClass(routine.frequency)}>
            {formatRoutineFrequency(routine.frequency)}
          </span>
          {timeLabel ? (
            <span className="rutina-chip rutina-chip--muted">
              <ScheduleIcon className="rutina-chip__icon" aria-hidden="true" />
              {timeLabel}
            </span>
          ) : null}
          {durationLabel ? (
            <span className="rutina-chip rutina-chip--muted">
              <TimerOutlinedIcon className="rutina-chip__icon" aria-hidden="true" />
              {durationLabel}
            </span>
          ) : null}
        </div>

        <p className="crud-row-meta rutina-list-row__meta">{formatRoutineMeta(routine)}</p>

        {routine.description ? (
          <p className="crud-row-preview">{routine.description}</p>
        ) : null}
      </div>
    </button>
  )
}

export default RutinaListRow
