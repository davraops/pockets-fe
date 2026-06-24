import { getPageCoverBackground } from './cuadernoPageCovers'
import type { CuadernoPickCardModel } from './cuadernoPickCardTypes'

interface CuadernoPickCardProps {
  card: CuadernoPickCardModel
  onSelect: (card: CuadernoPickCardModel) => void
}

function CuadernoPickCard({ card, onSelect }: CuadernoPickCardProps) {
  const coverBackground = getPageCoverBackground(card.cover)
  const title = card.title.trim() || 'Sin título'

  return (
    <button
      type="button"
      className={[
        'cuaderno-pick-card',
        card.isPlaceholder ? 'cuaderno-pick-card--placeholder' : '',
        card.parentLabel ? 'cuaderno-pick-card--subpage' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect(card)}
      aria-label={
        card.parentLabel
          ? `Abrir subpágina ${title} de ${card.parentLabel}`
          : `Abrir cuaderno ${title}`
      }
    >
      <div
        className={[
          'cuaderno-pick-card__cover',
          coverBackground ? '' : 'cuaderno-pick-card__cover--empty',
        ]
          .filter(Boolean)
          .join(' ')}
        style={coverBackground ? { background: coverBackground } : undefined}
        aria-hidden
      />
      <div className="cuaderno-pick-card__body">
        {card.icon ? (
          <span className="cuaderno-pick-card__icon" aria-hidden="true">
            {card.icon}
          </span>
        ) : (
          <span
            className="cuaderno-pick-card__icon cuaderno-pick-card__icon--empty"
            aria-hidden="true"
          >
            📓
          </span>
        )}
        {card.parentLabel ? (
          <p className="cuaderno-pick-card__parent">{card.parentLabel}</p>
        ) : null}
        <p className="cuaderno-pick-card__title">{title}</p>
      </div>
    </button>
  )
}

export default CuadernoPickCard
