import type { CSSProperties } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import type { FechasListEvent } from './fechasDisplayUtils'
import {
  formatEventDateBadge,
  formatEventWhenLabel,
  getEventCardChips,
  getEventUrgency,
} from './fechasDisplayUtils'

interface FechaEventCardProps {
  event: FechasListEvent
  variant?: 'default' | 'featured'
  onClick: () => void
}

function FechaEventCard({ event, variant = 'default', onClick }: FechaEventCardProps) {
  const badge = formatEventDateBadge(event)
  const urgency = getEventUrgency(event)
  const whenLabel = formatEventWhenLabel(event)
  const chips = getEventCardChips(event)
  const accentStyle = event.color ? ({ '--fechas-event-accent': event.color } as CSSProperties) : undefined

  return (
    <button
      type="button"
      className={`fechas-event-card fechas-event-card--${urgency}${variant === 'featured' ? ' fechas-event-card--featured' : ''}`}
      style={accentStyle}
      onClick={onClick}
      aria-label={`Ver evento ${event.titulo}`}
    >
      <div className="fechas-event-card__date" aria-hidden="true">
        <span className="fechas-event-card__date-primary">{badge.primary}</span>
        <span className="fechas-event-card__date-secondary">{badge.secondary}</span>
      </div>

      <div className="fechas-event-card__body">
        <div className="fechas-event-card__header">
          <h3 className="fechas-event-card__title">{event.titulo}</h3>
          <span className={`fechas-event-card__when fechas-event-card__when--${urgency}`}>
            {whenLabel}
          </span>
        </div>

        {chips.length > 0 ? (
          <ul className="fechas-event-card__chips" aria-label="Detalles del evento">
            {chips.map(chip => (
              <li key={chip} className="fechas-event-card__chip">
                {chip}
              </li>
            ))}
          </ul>
        ) : null}

        {event.descripcion ? (
          <p className="fechas-event-card__description">{event.descripcion}</p>
        ) : null}
      </div>

      <ChevronRightIcon className="fechas-event-card__chevron" aria-hidden="true" />
    </button>
  )
}

interface FechaFeaturedEventProps {
  event: FechasListEvent
  onClick: () => void
}

export function FechaFeaturedEvent({ event, onClick }: FechaFeaturedEventProps) {
  const whenLabel = formatEventWhenLabel(event)
  const chips = getEventCardChips(event)

  return (
    <section className="fechas-featured" aria-label="Próximo evento">
      <div className="fechas-featured__header">
        <EventOutlinedIcon className="fechas-featured__icon" aria-hidden="true" />
        <div>
          <p className="fechas-featured__kicker">Próximo en tu agenda</p>
          <h2 className="fechas-featured__when">{whenLabel}</h2>
        </div>
      </div>
      <FechaEventCard event={event} variant="featured" onClick={onClick} />
      {chips.length > 0 ? (
        <p className="fechas-featured__meta">{chips.join(' · ')}</p>
      ) : null}
    </section>
  )
}

export default FechaEventCard
