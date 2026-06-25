import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  formatMiDiaRowMeta,
  formatMiDiaRowValue,
  type MiDiaRoutineEvent,
} from './miDiaDisplayUtils'
import type { RoutineSearchable } from '../rutinas/routineDisplayUtils'

interface MiDiaRoutineRowProps {
  event: MiDiaRoutineEvent & { routine: RoutineSearchable & { id: string; description?: string | null; color?: string | null } }
  variant: 'today' | 'week'
  isBusy?: boolean
  onComplete?: () => void
}

function MiDiaRoutineRow({ event, variant, isBusy = false, onComplete }: MiDiaRoutineRowProps) {
  const { routine, isCompleted } = event
  const rowValue = formatMiDiaRowValue(routine, isCompleted)
  const accentClass = variant === 'week' ? 'crud-row-accent-indigo' : 'crud-row-accent-green'

  return (
    <div
      className={`crud-inset-row midia-routine-row ${accentClass}${isCompleted ? ' midia-routine-row--completed crud-inset-row--read' : ''}`}
    >
      {variant === 'today' ? (
        <button
          type="button"
          className="midia-routine-row__check"
          onClick={() => onComplete?.()}
          disabled={isCompleted || isBusy}
          aria-label={
            isCompleted ? `${routine.title} completada` : `Marcar ${routine.title} como completada`
          }
          aria-pressed={isCompleted}
        >
          {isCompleted ? (
            <CheckCircleIcon className="midia-routine-row__check-icon midia-routine-row__check-icon--done" aria-hidden="true" />
          ) : (
            <RadioButtonUncheckedIcon className="midia-routine-row__check-icon" aria-hidden="true" />
          )}
        </button>
      ) : null}

      <div className="crud-row-content">
        <div className="crud-row-header">
          <div className="crud-row-title-section">
            {routine.color ? (
              <span className="crud-row-icon" style={{ color: routine.color }} aria-hidden="true">
                ●
              </span>
            ) : null}
            <span className="crud-row-title">{routine.title}</span>
          </div>
          {rowValue ? <span className="crud-row-value">{rowValue}</span> : null}
        </div>
        <p className="crud-row-meta">{formatMiDiaRowMeta(routine)}</p>
        {routine.description ? (
          <p className="crud-row-preview">{routine.description}</p>
        ) : null}
      </div>
    </div>
  )
}

export default MiDiaRoutineRow
