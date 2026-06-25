import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import BookIcon from '@mui/icons-material/Book'

interface MiDiarioStreakStripProps {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  message: string
}

function MiDiarioStreakStrip({
  totalEntries,
  currentStreak,
  longestStreak,
  message,
}: MiDiarioStreakStripProps) {
  return (
    <div className="midiario-streak-wrap">
      <div className="midiario-streak-container" role="region" aria-label="Resumen del diario">
        <div className="midiario-streak-item">
          <LocalFireDepartmentIcon className="midiario-streak-icon" aria-hidden="true" />
          <div className="midiario-streak-info">
            <span className="midiario-streak-label">Racha actual</span>
            <span className="midiario-streak-value">
              {currentStreak > 0 ? `${currentStreak} día${currentStreak === 1 ? '' : 's'}` : 'Sin racha'}
            </span>
          </div>
        </div>

        <div className="midiario-streak-divider" aria-hidden="true" />

        <div className="midiario-streak-item">
          <EmojiEventsIcon className="midiario-streak-icon midiario-streak-icon--record" aria-hidden="true" />
          <div className="midiario-streak-info">
            <span className="midiario-streak-label">Récord</span>
            <span className="midiario-streak-value">
              {longestStreak > 0 ? `${longestStreak} día${longestStreak === 1 ? '' : 's'}` : '—'}
            </span>
          </div>
        </div>

        <div className="midiario-streak-divider" aria-hidden="true" />

        <div className="midiario-streak-item">
          <BookIcon className="midiario-streak-icon midiario-streak-icon--entries" aria-hidden="true" />
          <div className="midiario-streak-info">
            <span className="midiario-streak-label">Entradas</span>
            <span className="midiario-streak-value">{totalEntries}</span>
          </div>
        </div>
      </div>
      <p className="midiario-streak-message">{message}</p>
    </div>
  )
}

export default MiDiarioStreakStrip
