import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ModalOverlay from '../ModalOverlay'
import VehiculoEventosSection from './VehiculoEventosSection'
import type { Vehicle, VehicleSyncHandler } from './vehicleTypes'

interface VehiculoDetailModalProps {
  vehicle: Vehicle
  onClose: () => void
  onEdit: (vehicle: Vehicle) => void
  onDelete: (id: string, name: string) => Promise<void>
  onSync: VehicleSyncHandler
}

function VehiculoDetailModal({ vehicle, onClose, onEdit, onDelete, onSync }: VehiculoDetailModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="vehiculos-modal vehiculos-modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-panel-header">
          <h2 className="modal-panel-title" id="modal-panel-title-detalle-del-veh-culo">
            Detalle del Vehículo
          </h2>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>
        <div className="modal-panel-content">
          <div className="vehiculos-detail-section">
            <h3 className="vehiculos-detail-section-title">Información Básica</h3>
            <div className="vehiculos-detail-grid">
              <div className="vehiculos-detail-item">
                <span className="vehiculos-detail-label">Nombre:</span>
                <span className="vehiculos-detail-value">{vehicle.name}</span>
              </div>
              {vehicle.data.brand && vehicle.data.model && (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Marca y Modelo:</span>
                  <span className="vehiculos-detail-value">
                    {vehicle.data.brand} {vehicle.data.model}
                  </span>
                </div>
              )}
              {vehicle.data.year && (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Año:</span>
                  <span className="vehiculos-detail-value">{vehicle.data.year}</span>
                </div>
              )}
              {vehicle.data.plate && (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Placa:</span>
                  <span className="vehiculos-detail-value">{vehicle.data.plate}</span>
                </div>
              )}
              {vehicle.data.type && (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Tipo:</span>
                  <span className="vehiculos-detail-value">{vehicle.data.type}</span>
                </div>
              )}
              {vehicle.data.color && (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Color:</span>
                  <span className="vehiculos-detail-value">{vehicle.data.color}</span>
                </div>
              )}
              {vehicle.data.mileage && (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Kilometraje:</span>
                  <span className="vehiculos-detail-value">
                    {vehicle.data.mileage.toLocaleString('es-CO')} km
                  </span>
                </div>
              )}
              {vehicle.data.fuelType && (
                <div className="vehiculos-detail-item">
                  <span className="vehiculos-detail-label">Combustible:</span>
                  <span className="vehiculos-detail-value">{vehicle.data.fuelType}</span>
                </div>
              )}
            </div>
          </div>

          <VehiculoEventosSection vehicle={vehicle} onSync={onSync} />

          <div className="detail-actions">
            <button
              type="button"
              className="detail-action-button"
              onClick={() => onEdit(vehicle)}
              aria-label="Editar vehículo"
            >
              <EditIcon />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className="detail-action-button danger"
              onClick={() => {
                void onDelete(vehicle.id, vehicle.name).then(() => onClose())
              }}
              aria-label="Eliminar vehículo"
            >
              <DeleteIcon />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default VehiculoDetailModal
