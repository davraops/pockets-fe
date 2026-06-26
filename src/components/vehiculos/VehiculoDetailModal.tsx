import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ModalOverlay from '../ModalOverlay'
import VehiculoEventosSection from './VehiculoEventosSection'
import { formatVehicleDetailSubtitle } from './vehicleDisplayUtils'
import type { Vehicle, VehicleSyncHandler } from './vehicleTypes'

interface VehiculoDetailModalProps {
  vehicle: Vehicle
  isBusy: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onSync: VehicleSyncHandler
}

function VehiculoDetailModal({
  vehicle,
  isBusy,
  onClose,
  onEdit,
  onDelete,
  onSync,
}: VehiculoDetailModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel vehiculos-modal vehiculos-modal--detail"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-vehiculo-detalle"
      >
        <div className="vehiculos-modal__header">
          <div className="vehiculos-modal__header-copy">
            <p className="vehiculos-modal__kicker">Flota · Detalle</p>
            <h2 className="modal-panel-title" id="modal-title-vehiculo-detalle">
              {vehicle.name}
            </h2>
            <p className="vehiculos-modal__subtitle">{formatVehicleDetailSubtitle(vehicle)}</p>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content vehiculos-modal__body">
          <div className="vehiculos-detail-section">
            <h3 className="app-subsection-title app-subsection-title--plain vehiculos-detail-section-title">Información básica</h3>
            <div className="vehiculos-detail-grid">
              {vehicle.data.brand && vehicle.data.model ? (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Marca y modelo</span>
                  <span className="vehiculos-detail-value">
                    {vehicle.data.brand} {vehicle.data.model}
                  </span>
                </div>
              ) : null}
              {vehicle.data.year ? (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Año</span>
                  <span className="vehiculos-detail-value">{vehicle.data.year}</span>
                </div>
              ) : null}
              {vehicle.data.plate ? (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Placa</span>
                  <span className="vehiculos-detail-value">{vehicle.data.plate}</span>
                </div>
              ) : null}
              {vehicle.data.type ? (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Tipo</span>
                  <span className="vehiculos-detail-value">{vehicle.data.type}</span>
                </div>
              ) : null}
              {vehicle.data.color ? (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Color</span>
                  <span className="vehiculos-detail-value">{vehicle.data.color}</span>
                </div>
              ) : null}
              {vehicle.data.mileage ? (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Kilometraje</span>
                  <span className="vehiculos-detail-value">
                    {vehicle.data.mileage.toLocaleString('es-CO')} km
                  </span>
                </div>
              ) : null}
              {vehicle.data.fuelType ? (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Combustible</span>
                  <span className="vehiculos-detail-value">{vehicle.data.fuelType}</span>
                </div>
              ) : null}
            </div>
          </div>

          <VehiculoEventosSection vehicle={vehicle} onSync={onSync} />
        </div>

        <div className="modal-actions-base vehiculos-modal__footer vehiculos-modal__footer--detail">
          <button
            type="button"
            className="btn-base btn-accent vehiculos-modal__btn vehiculos-modal__btn--primary"
            onClick={onEdit}
            disabled={isBusy}
          >
            <EditIcon aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            className="btn-base btn-secondary vehiculos-modal__btn vehiculos-modal__btn--danger"
            onClick={onDelete}
            disabled={isBusy}
          >
            <DeleteIcon aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default VehiculoDetailModal
