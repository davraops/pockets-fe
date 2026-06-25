import { useNavigate } from 'react-router-dom'
import BookIcon from '@mui/icons-material/Book'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import RepeatIcon from '@mui/icons-material/Repeat'
import {
  formatTiempoStreakDays,
  type TiempoHubData,
} from './tiempoHubUtils'
import StreakTierBadge from './StreakTierBadge'

interface TiempoHubStreakStripProps {
  data: TiempoHubData
  unavailable: boolean
}

function TiempoHubStreakStrip({ data, unavailable }: TiempoHubStreakStripProps) {
  const navigate = useNavigate()
  const { stats } = data

  return (
    <section className="tiempo-streak-section" aria-labelledby="tiempo-streak-heading">
      <div className="tiempo-streak-section-header">
        <h2 id="tiempo-streak-heading" className="tiempo-feed-panel-title">
          Rachas
        </h2>
      </div>

      <div className="tiempo-streak-container" role="region" aria-label="Resumen de rachas">
        <button
          type="button"
          className="tiempo-streak-item tiempo-streak-item--action"
          onClick={() => navigate('/tiempo/mi-diario')}
          aria-label={`Diario: racha actual ${formatTiempoStreakDays(stats.diarioRacha)}`}
        >
          <LocalFireDepartmentIcon className="tiempo-streak-icon" aria-hidden="true" />
          <div className="tiempo-streak-info">
            <span className="tiempo-streak-label">Diario</span>
            {unavailable ? (
              <span className="tiempo-streak-value">—</span>
            ) : (
              <StreakTierBadge
                streak={stats.diarioRacha}
                label={formatTiempoStreakDays(stats.diarioRacha)}
                variant="value"
                showIcon={false}
                className="tiempo-streak-value"
              />
            )}
          </div>
        </button>

        <button
          type="button"
          className="tiempo-streak-item tiempo-streak-item--action"
          onClick={() => navigate('/tiempo/mi-diario')}
          aria-label={`Diario: récord ${formatTiempoStreakDays(stats.diarioRachaRecord)}`}
        >
          <EmojiEventsIcon className="tiempo-streak-icon tiempo-streak-icon--record" aria-hidden="true" />
          <div className="tiempo-streak-info">
            <span className="tiempo-streak-label">Récord diario</span>
            {unavailable || stats.diarioRachaRecord <= 0 ? (
              <span className="tiempo-streak-value">—</span>
            ) : (
              <StreakTierBadge
                streak={stats.diarioRachaRecord}
                label={formatTiempoStreakDays(stats.diarioRachaRecord)}
                variant="value"
                showIcon={false}
                className="tiempo-streak-value"
              />
            )}
          </div>
        </button>

        <button
          type="button"
          className="tiempo-streak-item tiempo-streak-item--action"
          onClick={() => navigate('/tiempo/rutinas')}
          aria-label={`Rutinas con racha activa: ${stats.rutinasConRacha}`}
        >
          <RepeatIcon className="tiempo-streak-icon tiempo-streak-icon--routines" aria-hidden="true" />
          <div className="tiempo-streak-info">
            <span className="tiempo-streak-label">Rutinas activas</span>
            <span className="tiempo-streak-value">
              {unavailable ? '—' : stats.rutinasConRacha}
            </span>
          </div>
        </button>

        <button
          type="button"
          className="tiempo-streak-item tiempo-streak-item--action"
          onClick={() => navigate('/tiempo/rutinas')}
          aria-label={`Mejor racha de rutina: ${formatTiempoStreakDays(stats.mejorRachaRutina)}`}
        >
          <LocalFireDepartmentIcon
            className="tiempo-streak-icon tiempo-streak-icon--best"
            aria-hidden="true"
          />
          <div className="tiempo-streak-info">
            <span className="tiempo-streak-label">Mejor racha</span>
            {unavailable || stats.mejorRachaRutina <= 0 ? (
              <span className="tiempo-streak-value">—</span>
            ) : (
              <StreakTierBadge
                streak={stats.mejorRachaRutina}
                label={formatTiempoStreakDays(stats.mejorRachaRutina)}
                variant="value"
                showIcon={false}
                className="tiempo-streak-value"
              />
            )}
          </div>
        </button>
      </div>

      {!unavailable && data.diaryStreakMessage && (
        <p className="tiempo-streak-message">{data.diaryStreakMessage}</p>
      )}

      {!unavailable && data.routineStreaks.length > 0 && (
        <div className="tiempo-streak-routines glass-group">
          {data.routineStreaks.map(routine => (
            <button
              key={routine.id}
              type="button"
              className="tiempo-streak-routine-row"
              onClick={() => navigate('/tiempo/rutinas')}
              aria-label={`Rutina ${routine.title}, racha de ${routine.streak} días`}
            >
              <StreakTierBadge
                streak={routine.streak}
                label={`${routine.streak} días`}
                compactLabel={`${routine.streak}d`}
                className="tiempo-streak-routine-badge"
              />
              <span className="tiempo-streak-routine-title">{routine.title}</span>
              <ChevronRightIcon className="tiempo-feed-chevron" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {!unavailable &&
        stats.diarioEntradas === 0 &&
        stats.rutinasConRacha === 0 &&
        stats.diarioRacha === 0 && (
          <p className="tiempo-streak-empty">
            <BookIcon aria-hidden="true" />
            Escribe en el diario o completa rutinas para empezar a sumar rachas.
          </p>
        )}
    </section>
  )
}

export default TiempoHubStreakStrip
