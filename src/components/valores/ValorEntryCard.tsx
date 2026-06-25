import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import DiamondIcon from '@mui/icons-material/Diamond'
import EditIcon from '@mui/icons-material/Edit'
import type { PersonalValueEntry } from './valorTypes'
import {
  formatPersonalValueExcerpt,
  getPersonalValueKindLabel,
} from './valoresDisplayUtils'

interface ValorEntryCardProps {
  entry: PersonalValueEntry
  onOpen: () => void
  onEdit: () => void
}

function ValorEntryCard({ entry, onOpen, onEdit }: ValorEntryCardProps) {
  const isBelief = entry.kind === 'belief'
  const excerpt = formatPersonalValueExcerpt(entry.description)

  return (
    <article
      className={`valor-card valor-card--${entry.kind}`}
      aria-label={`${getPersonalValueKindLabel(entry.kind)}: ${entry.title}`}
    >
      <button type="button" className="valor-card__open" onClick={onOpen}>
        <div className="valor-card__glow" aria-hidden="true" />
        <div className="valor-card__icon-wrap" aria-hidden="true">
          {isBelief ? <AutoStoriesIcon /> : <DiamondIcon />}
        </div>
        <span className="valor-card__kind">{getPersonalValueKindLabel(entry.kind)}</span>
        <h2 className="valor-card__title">{entry.title}</h2>
        {excerpt ? (
          <p className={`valor-card__description${isBelief ? ' valor-card__description--belief' : ''}`}>
            {isBelief ? `“${excerpt}”` : excerpt}
          </p>
        ) : (
          <p className="valor-card__placeholder">Sin descripción aún</p>
        )}
      </button>

      <button
        type="button"
        className="valor-card__edit"
        onClick={onEdit}
        aria-label={`Editar ${entry.title}`}
      >
        <EditIcon fontSize="small" />
      </button>
    </article>
  )
}

export default ValorEntryCard
