import CuadernoPickCard from './CuadernoPickCard'
import type { CuadernoPickCardModel } from './cuadernoPickCardTypes'

interface CuadernoEmptyPickGridProps {
  cards: CuadernoPickCardModel[]
  heading: string
  onSelect: (card: CuadernoPickCardModel) => void
}

function CuadernoEmptyPickGrid({ cards, heading, onSelect }: CuadernoEmptyPickGridProps) {
  if (cards.length === 0) {
    return null
  }

  return (
    <section className="cuaderno-empty-pick-grid" aria-label={heading}>
      <h3 className="cuaderno-empty-pick-grid__heading">{heading}</h3>
      <ul className="cuaderno-empty-pick-grid__list">
        {cards.map(card => (
          <li key={card.id}>
            <CuadernoPickCard card={card} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default CuadernoEmptyPickGrid
