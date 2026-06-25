import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import type { PatrimonyItem } from './patrimonioTypes'
import {
  formatPatrimonyBrandModel,
  formatPatrimonyRowValue,
  getPatrimonyCardChips,
} from './patrimonioDisplayUtils'

interface PatrimonioCardProps {
  item: PatrimonyItem
  onClick: () => void
}

function PatrimonioCard({ item, onClick }: PatrimonioCardProps) {
  const brandModel = formatPatrimonyBrandModel(item)
  const value = formatPatrimonyRowValue(item)
  const chips = getPatrimonyCardChips(item)
  const category = item.data.category?.trim()

  return (
    <button
      type="button"
      className="patrimonio-card"
      onClick={onClick}
      aria-label={`Ver ítem ${item.name}`}
    >
      <div className="patrimonio-card__header">
        <div className="patrimonio-card__icon-wrap" aria-hidden="true">
          <Inventory2OutlinedIcon className="patrimonio-card__icon" />
        </div>
        <div className="patrimonio-card__title-block">
          <h3 className="patrimonio-card__name">{item.name}</h3>
          {brandModel ? <p className="patrimonio-card__subtitle">{brandModel}</p> : null}
        </div>
        {category ? <span className="patrimonio-card__category">{category}</span> : null}
      </div>

      {value ? (
        <div className="patrimonio-card__value-row">
          <span className="patrimonio-card__value">{value}</span>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <ul className="patrimonio-card__chips" aria-label="Detalles del ítem">
          {chips.map(chip => (
            <li
              key={`${chip.variant ?? 'default'}-${chip.label}`}
              className={`patrimonio-card__chip${chip.variant ? ` patrimonio-card__chip--${chip.variant}` : ''}`}
            >
              {chip.variant === 'location' ? (
                <LocationOnOutlinedIcon className="patrimonio-card__chip-icon" aria-hidden="true" />
              ) : null}
              {chip.variant === 'insurance' ? (
                <ShieldOutlinedIcon className="patrimonio-card__chip-icon" aria-hidden="true" />
              ) : null}
              {chip.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="patrimonio-card__hint">Toca para ver ficha completa</p>
      )}

      <ChevronRightIcon className="patrimonio-card__chevron" aria-hidden="true" />
    </button>
  )
}

export default PatrimonioCard
