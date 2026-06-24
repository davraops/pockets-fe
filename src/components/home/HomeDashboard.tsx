import { useNavigate } from 'react-router-dom'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import AddIcon from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import ListSkeleton from '../ListSkeleton'
import { sectionColor } from '../../constants/sectionColors'
import type { HomeDashboardData, HomeDashboardEvent } from '../../hooks/useHomeDashboard'
import './HomeDashboard.css'

interface HomeDashboardProps {
  data: HomeDashboardData
  isRefreshing: boolean
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatSignedPrice(amount: number): string {
  const prefix = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${prefix}${formatPrice(Math.abs(amount))}`
}

function formatEventWhen(event: HomeDashboardEvent): string {
  const eventDate = new Date(`${event.date}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const timeLabel = event.time ? event.time.slice(0, 5) : null

  if (event.isToday) {
    return timeLabel ? `Hoy · ${timeLabel}` : 'Hoy'
  }

  if (eventDate.toDateString() === tomorrow.toDateString()) {
    return timeLabel ? `Mañana · ${timeLabel}` : 'Mañana'
  }

  const dateLabel = eventDate.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel
}

function formatRoutineTime(time: string | null): string {
  if (!time) return 'Sin hora'
  return time.slice(0, 5)
}

function HomeDashboard({ data, isRefreshing }: HomeDashboardProps) {
  const navigate = useNavigate()
  const isLoading =
    !isRefreshing &&
    (data.routinesStatus === 'loading' ||
      data.financeStatus === 'loading' ||
      data.eventsStatus === 'loading')

  if (isLoading) {
    return (
      <div className="home-dashboard" aria-label="Resumen de hoy" aria-busy="true">
        <ListSkeleton
          variant="summary-card"
          count={1}
          className="home-finance-skeleton"
          aria-label="Cargando balance"
        />
        <div className="home-dashboard-panels">
          <ListSkeleton variant="hub-row" count={3} aria-label="Cargando rutinas" />
          <ListSkeleton variant="hub-row" count={3} aria-label="Cargando eventos" />
        </div>
      </div>
    )
  }

  const financeUnavailable = data.financeStatus === 'error'
  const routinesUnavailable = data.routinesStatus === 'error'
  const eventsUnavailable = data.eventsStatus === 'error'

  return (
    <div className="home-dashboard" aria-label="Resumen de hoy">
      <button
        type="button"
        className="home-finance-hero"
        onClick={() => navigate('/finanzas')}
        aria-label={
          financeUnavailable
            ? 'Finanzas. Datos no disponibles'
            : `Finanzas. Balance ${formatPrice(data.balanceCop)}. Mes ${formatSignedPrice(data.monthNet)}`
        }
      >
        <div
          className="home-finance-hero-icon"
          style={{ '--section-color': sectionColor.finanzas } as React.CSSProperties}
          aria-hidden="true"
        >
          <AccountBalanceWalletIcon />
        </div>
        <div className="home-finance-hero-body">
          <span className="home-finance-hero-label">Balance disponible</span>
          <span
            className={`home-finance-hero-value${financeUnavailable ? ' home-dash-unavailable' : ''}`}
          >
            {financeUnavailable ? 'No disponible' : formatPrice(data.balanceCop)}
          </span>
          {!financeUnavailable && (
            <div className="home-finance-hero-stats">
              <span className="home-finance-stat home-finance-stat-positive">
                +{formatPrice(data.monthIngresos)}
              </span>
              <span className="home-finance-stat-sep" aria-hidden="true">
                /
              </span>
              <span className="home-finance-stat home-finance-stat-negative">
                −{formatPrice(data.monthEgresos)}
              </span>
              <span className="home-finance-stat-net">
                Neto {formatSignedPrice(data.monthNet)}
              </span>
            </div>
          )}
        </div>
        <ChevronRightIcon className="home-feed-chevron" aria-hidden="true" />
      </button>

      <div className="home-quick-actions" role="group" aria-label="Acciones rápidas">
        <button
          type="button"
          className="btn-base btn-accent home-quick-action"
          onClick={() => navigate('/finanzas/transacciones', { state: { openModal: true } })}
        >
          <AddIcon aria-hidden="true" />
          Transacción
        </button>
        <button
          type="button"
          className="btn-base btn-secondary home-quick-action"
          onClick={() => navigate('/tiempo/mi-dia')}
        >
          <TodayIcon aria-hidden="true" />
          Mi día
        </button>
        <button
          type="button"
          className="btn-base btn-secondary home-quick-action"
          onClick={() => navigate('/tiempo/fechas')}
        >
          <CalendarTodayIcon aria-hidden="true" />
          Agenda
        </button>
      </div>

      <div className="home-dashboard-panels">
        <section className="home-feed-panel" aria-labelledby="home-routines-heading">
          <div className="home-feed-panel-header">
            <h2 id="home-routines-heading" className="home-feed-panel-title">
              Rutinas de hoy
            </h2>
            <button
              type="button"
              className="home-feed-panel-link"
              onClick={() => navigate('/tiempo/mi-dia')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="home-feed-list glass-group">
            {routinesUnavailable && (
              <p className="home-feed-empty home-feed-error">No se pudieron cargar las rutinas</p>
            )}
            {!routinesUnavailable && data.routinesTotal === 0 && (
              <p className="home-feed-empty">Nada programado para hoy</p>
            )}
            {!routinesUnavailable && data.routinesTotal > 0 && data.routinesPending === 0 && (
              <p className="home-feed-empty home-feed-success">
                {data.routinesTotal === 1
                  ? '1 rutina completada'
                  : `${data.routinesTotal} rutinas completadas`}
              </p>
            )}
            {!routinesUnavailable &&
              data.pendingRoutines.map(routine => (
                <button
                  key={routine.id}
                  type="button"
                  className="home-feed-row"
                  onClick={() => navigate('/tiempo/mi-dia')}
                  aria-label={`Rutina pendiente: ${routine.title}, ${formatRoutineTime(routine.scheduledTime)}`}
                >
                  <span className="home-feed-row-time">{formatRoutineTime(routine.scheduledTime)}</span>
                  <span className="home-feed-row-title">{routine.title}</span>
                  <ChevronRightIcon className="home-feed-chevron" aria-hidden="true" />
                </button>
              ))}
            {!routinesUnavailable && data.routinesPending > data.pendingRoutines.length && (
              <button
                type="button"
                className="home-feed-row home-feed-row-more"
                onClick={() => navigate('/tiempo/mi-dia')}
              >
                <span className="home-feed-row-title">
                  +{data.routinesPending - data.pendingRoutines.length} rutinas más
                </span>
                <ChevronRightIcon className="home-feed-chevron" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        <section className="home-feed-panel" aria-labelledby="home-events-heading">
          <div className="home-feed-panel-header">
            <h2 id="home-events-heading" className="home-feed-panel-title">
              Próximos eventos
            </h2>
            <button
              type="button"
              className="home-feed-panel-link"
              onClick={() => navigate('/tiempo/fechas')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="home-feed-list glass-group">
            {eventsUnavailable && (
              <p className="home-feed-empty home-feed-error">No se pudieron cargar los eventos</p>
            )}
            {!eventsUnavailable && data.upcomingEvents.length === 0 && (
              <p className="home-feed-empty">Sin eventos en los próximos 14 días</p>
            )}
            {!eventsUnavailable &&
              data.upcomingEvents.map((event, index) => (
                <button
                  key={`${event.date}-${event.title}-${index}`}
                  type="button"
                  className="home-feed-row"
                  onClick={() => navigate('/tiempo/fechas')}
                  aria-label={`Evento: ${event.title}, ${formatEventWhen(event)}`}
                >
                  <span className="home-feed-row-time">{formatEventWhen(event)}</span>
                  <span className="home-feed-row-title">{event.title}</span>
                  <ChevronRightIcon className="home-feed-chevron" aria-hidden="true" />
                </button>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomeDashboard
