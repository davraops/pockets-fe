import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { Vehicle } from './vehicleTypes'
import {
  formatVehicleBrandModel,
  formatVehiclePlate,
  getVehicleCardAlert,
  getVehicleCardChips,
} from './vehicleDisplayUtils'

interface VehiculoCardProps {
  vehicle: Vehicle
  onClick: () => void
}

function VehiculoCard({ vehicle, onClick }: VehiculoCardProps) {
  const brandModel = formatVehicleBrandModel(vehicle)
  const plate = formatVehiclePlate(vehicle)
  const chips = getVehicleCardChips(vehicle)
  const alert = getVehicleCardAlert(vehicle)
  const year = vehicle.data.year

  return (
    <button
      type="button"
      className="vehiculo-card"
      onClick={onClick}
      aria-label={`Ver vehículo ${vehicle.name}`}
    >
      <div className="vehiculo-card__header">
        <div className="vehiculo-card__icon-wrap" aria-hidden="true">
          <DirectionsCarIcon className="vehiculo-card__icon" />
        </div>
        <div className="vehiculo-card__title-block">
          <h3 className="vehiculo-card__name">{vehicle.name}</h3>
          {brandModel ? <p className="vehiculo-card__subtitle">{brandModel}</p> : null}
        </div>
        {year ? <span className="vehiculo-card__year">{year}</span> : null}
      </div>

      {plate ? (
        <div className="vehiculo-card__plate-row">
          <span className="vehiculo-card__plate">{plate}</span>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <ul className="vehiculo-card__chips" aria-label="Detalles del vehículo">
          {chips.map(chip => (
            <li key={chip.label} className="vehiculo-card__chip">
              {chip.label}
            </li>
          ))}
        </ul>
      ) : null}

      {alert ? (
        <p className={`vehiculo-card__alert vehiculo-card__alert--${alert.tone}`}>{alert.text}</p>
      ) : (
        <p className="vehiculo-card__hint">Toca para ver ficha completa</p>
      )}

      <ChevronRightIcon className="vehiculo-card__chevron" aria-hidden="true" />
    </button>
  )
}

export default VehiculoCard
