import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import StreakTierBadge from './StreakTierBadge'
import {
  formatTiempoRoutineStreak,
  formatTiempoRoutineStreakBadge,
  formatTiempoRoutineTime,
  type TiempoHubRoutineItem,
} from './tiempoHubUtils'

interface TiempoHubRoutineRowProps {
  routine: TiempoHubRoutineItem
  isBusy?: boolean
  onComplete?: () => void
}

function TiempoHubRoutineRow({ routine, isBusy = false, onComplete }: TiempoHubRoutineRowProps) {
  const streak = routine.currentStreak ?? 0
  const streakBadge = formatTiempoRoutineStreakBadge(streak)
  const streakLabel = formatTiempoRoutineStreak(streak)

  return (
    <div
      className={`tiempo-feed-row tiempo-feed-row-routine${routine.isCompleted ? ' tiempo-feed-row-routine--completed' : ''}`}
    >
      <button
        type="button"
        className="tiempo-feed-row-check"
        onClick={() => onComplete?.()}
        disabled={routine.isCompleted || isBusy}
        aria-label={
          routine.isCompleted
            ? `${routine.title} completada, racha ${streakLabel}`
            : `Marcar ${routine.title} como completada, racha ${streakLabel}`
        }
        aria-pressed={routine.isCompleted}
      >
        {routine.isCompleted ? (
          <CheckCircleIcon
            className="tiempo-feed-row-check-icon tiempo-feed-row-check-icon--done"
            aria-hidden="true"
          />
        ) : (
          <RadioButtonUncheckedIcon className="tiempo-feed-row-check-icon" aria-hidden="true" />
        )}
      </button>
      <span className="tiempo-feed-row-time">{formatTiempoRoutineTime(routine.scheduledTime)}</span>
      <span className="tiempo-feed-row-title">{routine.title}</span>
      <StreakTierBadge
        streak={streak}
        label={streakLabel}
        compactLabel={streakBadge}
        className="tiempo-feed-row-streak"
      />
    </div>
  )
}

export default TiempoHubRoutineRow
