import CrudInsetRow from '../crud/CrudInsetRow'
import type { Vehicle } from './vehicleTypes'
import { formatVehicleMeta, formatVehiclePreview } from './vehicleDisplayUtils'

interface VehiculoListRowProps {
  vehicle: Vehicle
  onClick: () => void
}

function VehiculoListRow({ vehicle, onClick }: VehiculoListRowProps) {
  return (
    <CrudInsetRow
      accentClass="crud-row-accent-indigo"
      ariaLabel={`Ver vehículo ${vehicle.name}`}
      onClick={onClick}
      title={vehicle.name}
      value={vehicle.data.year ?? undefined}
      meta={formatVehicleMeta(vehicle)}
      preview={formatVehiclePreview(vehicle)}
    />
  )
}

export default VehiculoListRow
