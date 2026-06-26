import type { RefObject } from 'react'
import InventoryIcon from '@mui/icons-material/Inventory'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DescriptionIcon from '@mui/icons-material/Description'
import SecurityIcon from '@mui/icons-material/Security'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CategoryIcon from '@mui/icons-material/Category'
import ModalOverlay from '../ModalOverlay'
import type { PatrimonyFormData, PatrimonyFormErrors } from './patrimonioFormUtils'

interface PatrimonioFormModalProps {
  editingId: string | null
  formData: PatrimonyFormData
  formErrors: PatrimonyFormErrors
  nameRef: RefObject<HTMLInputElement | null>
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
}

function PatrimonioFormModal({
  editingId,
  formData,
  formErrors,
  nameRef,
  onChange,
  onSubmit,
  onCancel,
}: PatrimonioFormModalProps) {
  return (
    <ModalOverlay onClose={onCancel} className="modal-overlay">
      <div
        className="modal-panel patrimonio-modal patrimonio-modal--form"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-patrimonio-form"
      >
        <div className="patrimonio-modal__header">
          <div className="patrimonio-modal__header-copy">
            <p className="patrimonio-modal__kicker">
              Bienes · {editingId ? 'Editar' : 'Nuevo'}
            </p>
            <h2 className="modal-panel-title" id="modal-title-patrimonio-form">
              {editingId ? 'Editar ítem' : 'Agregar ítem'}
            </h2>
          </div>
          <button className="modal-panel-close" onClick={onCancel} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="patrimonio-form patrimonio-modal__form" noValidate>
          <div className="modal-panel__scroll patrimonio-modal__body">
            <div className="form-group-base form-group-base--compact">
              <label htmlFor="name" className="form-label-base form-label-base--inline">
                <InventoryIcon className="form-label-icon" />
                Nombre del Item *
              </label>
              <input
                ref={nameRef}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={onChange}
                className={`form-input-base ${formErrors.name ? 'input-error' : ''}`}
                placeholder="Ej: Reloj Rolex Submariner"
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
                <label htmlFor="category" className="form-label-base form-label-base--inline">
                  <CategoryIcon className="form-label-icon" />
                  Categoría
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Relojes, Joyas, Arte, etc."
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="purchaseDate" className="form-label-base form-label-base--inline">
                  <CalendarTodayIcon className="form-label-icon" />
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={onChange}
                  className="form-input-base"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="purchaseValue" className="form-label-base form-label-base--inline">
                  <AttachMoneyIcon className="form-label-icon" />
                  Valor de Compra
                </label>
                <input
                  type="number"
                  id="purchaseValue"
                  name="purchaseValue"
                  value={formData.purchaseValue}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="currency" className="form-label-base form-label-base--inline">
                  Moneda
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={onChange}
                  className="form-input-base"
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="description" className="form-label-base form-label-base--inline">
                <DescriptionIcon className="form-label-icon" />
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={onChange}
                className="form-input-base"
                placeholder="Descripción detallada del item..."
                rows={3}
              />
            </div>

            <div className="crud-form-row">
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
                  placeholder="Ej: Rolex"
                />
              </div>

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
                  placeholder="Ej: Submariner Date"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="serialNumber" className="form-label-base form-label-base--inline">
                  Número de Serie
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: M126610LN-0001"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="condition" className="form-label-base form-label-base--inline">
                  Condición
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={onChange}
                  className="form-input-base"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Excelente">Excelente</option>
                  <option value="Muy Buena">Muy Buena</option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Necesita Reparación">Necesita Reparación</option>
                </select>
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="currentValue" className="form-label-base form-label-base--inline">
                  <AttachMoneyIcon className="form-label-icon" />
                  Valor Actual (Estimado)
                </label>
                <input
                  type="number"
                  id="currentValue"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="location" className="form-label-base form-label-base--inline">
                  <LocationOnIcon className="form-label-icon" />
                  Ubicación
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Casa, Caja fuerte, Banco"
                />
              </div>
            </div>

            <div className="crud-form-section-divider">
              <h3 className="app-form-block-title patrimonio-form-subsection-title">
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
                  placeholder="Ej: Seguros Premium"
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

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="insuranceCoverage" className="form-label-base form-label-base--inline">
                Cobertura (COP)
              </label>
              <input
                type="number"
                id="insuranceCoverage"
                name="insuranceCoverage"
                value={formData.insuranceCoverage}
                onChange={onChange}
                className="form-input-base"
                placeholder="0"
                min="0"
                step="1000"
              />
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
                placeholder="Notas adicionales"
              />
            </div>
          </div>

            <div className="modal-actions-base patrimonio-modal__footer">
              <button
                type="button"
                className="btn-base btn-secondary patrimonio-modal__btn"
                onClick={onCancel}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-base btn-accent patrimonio-modal__btn">
                {editingId ? 'Guardar cambios' : 'Agregar ítem'}
              </button>
            </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default PatrimonioFormModal
