import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import BookIcon from '@mui/icons-material/Book'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import RepeatIcon from '@mui/icons-material/Repeat'
import TodayIcon from '@mui/icons-material/Today'
import ListSkeleton from '../ListSkeleton'
import { sectionColor } from '../../constants/sectionColors'
import {
  formatTiempoEventMeta,
  formatTiempoHeroSubline,
  formatTiempoHeroValue,
  type TiempoHubData,
} from './tiempoHubUtils'
import TiempoHubStreakStrip from './TiempoHubStreakStrip'
import TiempoHubRoutineRow from './TiempoHubRoutineRow'

interface TiempoHubDashboardProps {
  data: TiempoHubData
  isLoading: boolean
  unavailable: boolean
  completingRoutineId?: string | null
  onCompleteRoutine?: (routineId: string) => void
}

const MAX_TODAY_ROUTINES = 8

function TiempoHubDashboard({
  data,
  isLoading,
  unavailable,
  completingRoutineId = null,
  onCompleteRoutine,
}: TiempoHubDashboardProps) {
  const navigate = useNavigate()

  const heroSubline = useMemo(() => formatTiempoHeroSubline(data), [data])
  const visibleTodayRoutines = data.todayRoutines.slice(0, MAX_TODAY_ROUTINES)
  const hiddenTodayCount = Math.max(0, data.todayRoutines.length - MAX_TODAY_ROUTINES)

  const showDiaryAttention =
    !unavailable && data.stats.diarioRacha > 0 && !data.hasDiaryEntryToday

  if (isLoading) {
    return (
      <div className="tiempo-dashboard" aria-label="Resumen de Lifestyle" aria-busy="true">
        <ListSkeleton variant="summary-card" count={1} className="tiempo-hero-skeleton" />
        <div className="tiempo-dashboard-panels">
          <ListSkeleton variant="hub-row" count={4} />
          <ListSkeleton variant="hub-row" count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="tiempo-dashboard" aria-label="Resumen de Lifestyle">
      <button
        type="button"
        className="tiempo-hero"
        onClick={() => navigate('/tiempo/mi-dia')}
        aria-label={
          unavailable
            ? 'Tu día. Datos no disponibles'
            : data.stats.rutinasHoy === 0
              ? 'Tu día. Sin rutinas programadas hoy'
              : `Tu día. ${data.stats.rutinasCompletadasHoy} de ${data.stats.rutinasHoy} rutinas completadas`
        }
      >
        <div
          className="tiempo-hero-icon"
          style={{ '--section-color': sectionColor.lifestyle } as React.CSSProperties}
          aria-hidden="true"
        >
          <TodayIcon />
        </div>
        <div className="tiempo-hero-body">
          <span className="tiempo-hero-label">Tu día</span>
          <span className={`tiempo-hero-value${unavailable ? ' tiempo-dash-unavailable' : ''}`}>
            {unavailable ? 'No disponible' : formatTiempoHeroValue(data.stats)}
          </span>
          {!unavailable && <p className="tiempo-hero-sub">{heroSubline}</p>}
        </div>
        <ChevronRightIcon className="tiempo-feed-chevron" aria-hidden="true" />
      </button>

      <div className="tiempo-quick-actions" role="group" aria-label="Acciones rápidas">
        <button
          type="button"
          className="btn-base btn-accent tiempo-quick-action"
          onClick={() => navigate('/tiempo/mi-dia')}
        >
          <TodayIcon aria-hidden="true" />
          Mi día
        </button>
        <button
          type="button"
          className="btn-base btn-secondary tiempo-quick-action"
          onClick={() => navigate('/tiempo/fechas')}
        >
          <CalendarTodayIcon aria-hidden="true" />
          Evento
        </button>
        <button
          type="button"
          className="btn-base btn-secondary tiempo-quick-action"
          onClick={() => navigate('/tiempo/mi-diario')}
        >
          <BookIcon aria-hidden="true" />
          Diario
        </button>
        <button
          type="button"
          className="btn-base btn-secondary tiempo-quick-action"
          onClick={() => navigate('/tiempo/rutinas')}
        >
          <RepeatIcon aria-hidden="true" />
          Rutina
        </button>
      </div>

      <TiempoHubStreakStrip data={data} unavailable={unavailable} />

      {showDiaryAttention && (
        <div className="tiempo-attention-banner" role="status">
          <p>
            Escribe hoy para mantener tu racha de {data.stats.diarioRacha} día
            {data.stats.diarioRacha !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            className="btn-base btn-secondary tiempo-attention-action"
            onClick={() => navigate('/tiempo/mi-diario')}
          >
            <AddIcon aria-hidden="true" />
            Nueva entrada
          </button>
        </div>
      )}

      <div className="tiempo-dashboard-panels">
        <section className="tiempo-feed-panel" aria-labelledby="tiempo-routines-heading">
          <div className="tiempo-feed-panel-header">
            <h2 id="tiempo-routines-heading" className="tiempo-feed-panel-title">
              Rutinas de hoy
            </h2>
            <button
              type="button"
              className="tiempo-feed-panel-link"
              onClick={() => navigate('/tiempo/mi-dia')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="tiempo-feed-list glass-group">
            {unavailable && (
              <p className="tiempo-feed-empty tiempo-feed-error">No se pudieron cargar las rutinas</p>
            )}
            {!unavailable && data.stats.rutinasHoy === 0 && (
              <p className="tiempo-feed-empty">Nada programado para hoy</p>
            )}
            {!unavailable &&
              visibleTodayRoutines.map(routine => (
                <TiempoHubRoutineRow
                  key={routine.id}
                  routine={routine}
                  isBusy={completingRoutineId === routine.id}
                  onComplete={() => onCompleteRoutine?.(routine.id)}
                />
              ))}
            {!unavailable && hiddenTodayCount > 0 && (
              <button
                type="button"
                className="tiempo-feed-row tiempo-feed-row-more"
                onClick={() => navigate('/tiempo/mi-dia')}
              >
                <span className="tiempo-feed-row-title">+{hiddenTodayCount} rutinas más</span>
                <ChevronRightIcon className="tiempo-feed-chevron" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        <section className="tiempo-feed-panel" aria-labelledby="tiempo-events-heading">
          <div className="tiempo-feed-panel-header">
            <h2 id="tiempo-events-heading" className="tiempo-feed-panel-title">
              Próximos eventos
            </h2>
            <button
              type="button"
              className="tiempo-feed-panel-link"
              onClick={() => navigate('/tiempo/fechas')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="tiempo-feed-list glass-group">
            {unavailable && (
              <p className="tiempo-feed-empty tiempo-feed-error">No se pudieron cargar los eventos</p>
            )}
            {!unavailable && data.upcomingEvents.length === 0 && (
              <p className="tiempo-feed-empty">Sin eventos en los próximos 30 días</p>
            )}
            {!unavailable &&
              data.upcomingEvents.map(event => (
                <button
                  key={event.id}
                  type="button"
                  className="tiempo-feed-row tiempo-feed-row-event"
                  onClick={() => navigate('/tiempo/fechas')}
                  aria-label={`Evento: ${event.title}, ${formatTiempoEventMeta(event)}`}
                >
                  <span className="tiempo-feed-row-body">
                    <span className="tiempo-feed-row-title">{event.title}</span>
                    <span className="tiempo-feed-row-sub">{formatTiempoEventMeta(event)}</span>
                  </span>
                  <ChevronRightIcon className="tiempo-feed-chevron" aria-hidden="true" />
                </button>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default TiempoHubDashboard
