import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import type { PatrimonyItem } from '../patrimonio/patrimonioTypes'
import {
  formatPatrimonyBrandModel,
  formatPatrimonyRowValue,
  getPatrimonyCardChips,
} from '../patrimonio/patrimonioDisplayUtils'

interface TransaccionPatrimonioPreviewProps {
  item: PatrimonyItem
}

function TransaccionPatrimonioPreview({ item }: TransaccionPatrimonioPreviewProps) {
  const brandModel = formatPatrimonyBrandModel(item)
  const value = formatPatrimonyRowValue(item)
  const chips = getPatrimonyCardChips(item)
  const category = item.data.category?.trim()

  return (
    <div className="transaccion-patrimonio-preview" aria-label="Vista previa del ítem en Patrimonio">
      <p className="transaccion-patrimonio-preview__label">Vista previa</p>
      <div className="transaccion-patrimonio-preview__card">
        <div className="patrimonio-card patrimonio-card--preview">
          <div className="patrimonio-card__header">
            <div className="patrimonio-card__icon-wrap" aria-hidden="true">
              <Inventory2OutlinedIcon className="patrimonio-card__icon" />
            </div>
            <div className="patrimonio-card__title-block">
              <h4 className="patrimonio-card__name">{item.name}</h4>
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
            <ul className="patrimonio-card__chips" aria-hidden="true">
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
            <p className="patrimonio-card__hint">Así se verá en Patrimonio</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransaccionPatrimonioPreview
