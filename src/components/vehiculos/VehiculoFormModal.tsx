import type { RefObject } from 'react'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import SecurityIcon from '@mui/icons-material/Security'
import BuildIcon from '@mui/icons-material/Build'
import DescriptionIcon from '@mui/icons-material/Description'
import ModalOverlay from '../ModalOverlay'
import type { VehicleFormData, VehicleFormErrors } from './vehicleFormUtils'

interface VehiculoFormModalProps {
  editingId: string | null
  formData: VehicleFormData
  formErrors: VehicleFormErrors
  nameRef: RefObject<HTMLInputElement | null>
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
}

function VehiculoFormModal({
  editingId,
  formData,
  formErrors,
  nameRef,
  onChange,
  onSubmit,
  onCancel,
}: VehiculoFormModalProps) {
  return (
    <ModalOverlay onClose={onCancel} className="modal-overlay">
      <div
        className="modal-panel vehiculos-modal vehiculos-modal--form"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-vehiculo-form"
      >
        <div className="vehiculos-modal__header">
          <div className="vehiculos-modal__header-copy">
            <p className="vehiculos-modal__kicker">Flota · {editingId ? 'Editar' : 'Nuevo'}</p>
            <h2 className="modal-panel-title" id="modal-title-vehiculo-form">
              {editingId ? 'Editar vehículo' : 'Agregar vehículo'}
            </h2>
          </div>
          <button className="modal-panel-close" onClick={onCancel} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="vehiculos-form vehiculos-modal__form" noValidate>
          <div className="modal-panel__scroll vehiculos-modal__body">
            <div className="form-group-base form-group-base--compact">
              <label htmlFor="name" className="form-label-base form-label-base--inline">
                <DirectionsCarIcon className="form-label-icon" />
                Nombre del Vehículo *
              </label>
              <input
                ref={nameRef}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={onChange}
                className={`form-input-base ${formErrors.name ? 'input-error' : ''}`}
                placeholder="Ej: Mi Carro Principal"
                autoFocus
                aria-invalid={!!formErrors.name}
                {...(formErrors.name ? { 'aria-describedby': 'name-error' } : {})}
              />
              {formErrors.name && (
                <span id="name-error" className="error-message" role="alert">
                  {formErrors.name}
                </span>
              )}
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="type" className="form-label-base form-label-base--inline">
                  Tipo de Vehículo
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={onChange}
                  className="form-input-base"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Automóvil">Automóvil</option>
                  <option value="Moto">Moto</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="Camión">Camión</option>
                  <option value="Bus">Bus</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="brand" className="form-label-base form-label-base--inline">
                  Marca
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Toyota"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="model" className="form-label-base form-label-base--inline">
                  Modelo
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Corolla"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="year" className="form-label-base form-label-base--inline">
                  Año
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="plate" className="form-label-base form-label-base--inline">
                  Placa
                </label>
                <input
                  type="text"
                  id="plate"
                  name="plate"
                  value={formData.plate}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: ABC123"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="color" className="form-label-base form-label-base--inline">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Blanco"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="vin" className="form-label-base form-label-base--inline">
                  VIN (Número de Chasis)
                </label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: 1HGBH41JXMN109186"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="mileage" className="form-label-base form-label-base--inline">
                  Kilometraje
                </label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="fuelType" className="form-label-base form-label-base--inline">
                <LocalGasStationIcon className="form-label-icon" />
                Tipo de Combustible
              </label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={onChange}
                className="form-input-base"
              >
                <option value="">Seleccionar...</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Gas Natural">Gas Natural</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="crud-form-section-divider">
              <h3 className="app-form-block-title vehiculos-form-subsection-title">
                <SecurityIcon className="form-label-icon" />
                Seguro
              </h3>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="insuranceCompany" className="form-label-base form-label-base--inline">
                  Compañía de Seguros
                </label>
                <input
                  type="text"
                  id="insuranceCompany"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Seguros XYZ"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label
                  htmlFor="insurancePolicyNumber"
                  className="form-label-base form-label-base--inline"
                >
                  Número de Póliza
                </label>
                <input
                  type="text"
                  id="insurancePolicyNumber"
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: POL-123456"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label
                  htmlFor="insuranceExpirationDate"
                  className="form-label-base form-label-base--inline"
                >
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  id="insuranceExpirationDate"
                  name="insuranceExpirationDate"
                  value={formData.insuranceExpirationDate}
                  onChange={onChange}
                  className="form-input-base"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="insuranceCoverage" className="form-label-base form-label-base--inline">
                  Cobertura
                </label>
                <input
                  type="text"
                  id="insuranceCoverage"
                  name="insuranceCoverage"
                  value={formData.insuranceCoverage}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Todo Riesgo"
                />
              </div>
            </div>

            <div className="crud-form-section-divider">
              <h3 className="app-form-block-title vehiculos-form-subsection-title">
                <BuildIcon className="form-label-icon" />
                Mantenimiento
              </h3>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label
                  htmlFor="maintenanceLastService"
                  className="form-label-base form-label-base--inline"
                >
                  Último Servicio
                </label>
                <input
                  type="date"
                  id="maintenanceLastService"
                  name="maintenanceLastService"
                  value={formData.maintenanceLastService}
                  onChange={onChange}
                  className="form-input-base"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label
                  htmlFor="maintenanceNextService"
                  className="form-label-base form-label-base--inline"
                >
                  Próximo Servicio
                </label>
                <input
                  type="date"
                  id="maintenanceNextService"
                  name="maintenanceNextService"
                  value={formData.maintenanceNextService}
                  onChange={onChange}
                  className="form-input-base"
                />
              </div>
            </div>

            <div className="form-group-base form-group-base--compact">
              <label
                htmlFor="maintenanceServiceInterval"
                className="form-label-base form-label-base--inline"
              >
                Intervalo de Servicio (km)
              </label>
              <input
                type="number"
                id="maintenanceServiceInterval"
                name="maintenanceServiceInterval"
                value={formData.maintenanceServiceInterval}
                onChange={onChange}
                className="form-input-base"
                placeholder="Ej: 10000"
                min="0"
                step="1000"
              />
            </div>

            <div className="crud-form-section-divider">
              <h3 className="app-form-block-title vehiculos-form-subsection-title">
                <DescriptionIcon className="form-label-icon" />
                Documentos
              </h3>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="soatNumber" className="form-label-base form-label-base--inline">
                  SOAT - Número
                </label>
                <input
                  type="text"
                  id="soatNumber"
                  name="soatNumber"
                  value={formData.soatNumber}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: SOAT-789012"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="soatExpiration" className="form-label-base form-label-base--inline">
                  SOAT - Expiración
                </label>
                <input
                  type="date"
                  id="soatExpiration"
                  name="soatExpiration"
                  value={formData.soatExpiration}
                  onChange={onChange}
                  className="form-input-base"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label
                  htmlFor="technicalReviewNumber"
                  className="form-label-base form-label-base--inline"
                >
                  Revisión Técnica - Número
                </label>
                <input
                  type="text"
                  id="technicalReviewNumber"
                  name="technicalReviewNumber"
                  value={formData.technicalReviewNumber}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: RT-345678"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label
                  htmlFor="technicalReviewExpiration"
                  className="form-label-base form-label-base--inline"
                >
                  Revisión Técnica - Expiración
                </label>
                <input
                  type="date"
                  id="technicalReviewExpiration"
                  name="technicalReviewExpiration"
                  value={formData.technicalReviewExpiration}
                  onChange={onChange}
                  className="form-input-base"
                />
              </div>
            </div>

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="notes" className="form-label-base form-label-base--inline">
                Notas
              </label>
              <input
                type="text"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={onChange}
                className="form-input-base"
                placeholder="Ej: Vehículo en buen estado, mantenimiento al día"
              />
            </div>
          </div>

            <div className="modal-actions-base vehiculos-modal__footer">
              <button type="button" className="btn-base btn-secondary vehiculos-modal__btn" onClick={onCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn-base btn-accent vehiculos-modal__btn">
                {editingId ? 'Guardar cambios' : 'Agregar vehículo'}
              </button>
            </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default VehiculoFormModal
