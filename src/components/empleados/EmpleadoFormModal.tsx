import type { RefObject } from 'react'
import PersonIcon from '@mui/icons-material/Person'
import WorkIcon from '@mui/icons-material/Work'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import HomeIcon from '@mui/icons-material/Home'
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency'
import ModalOverlay from '../ModalOverlay'
import type { EmployeeFormData, EmployeeFormErrors } from './employeeFormUtils'

interface EmpleadoFormModalProps {
  editingId: string | null
  formData: EmployeeFormData
  formErrors: EmployeeFormErrors
  nameRef: RefObject<HTMLInputElement | null>
  identificationRef: RefObject<HTMLInputElement | null>
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
}

function EmpleadoFormModal({
  editingId,
  formData,
  formErrors,
  nameRef,
  identificationRef,
  onChange,
  onSubmit,
  onCancel,
}: EmpleadoFormModalProps) {
  return (
    <ModalOverlay onClose={onCancel} className="modal-overlay">
      <div
        className="modal-panel empleados-modal empleados-modal--form"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-empleado-form"
      >
        <div className="empleados-modal__header">
          <div className="empleados-modal__header-copy">
            <p className="empleados-modal__kicker">
              Personas · {editingId ? 'Editar' : 'Nuevo'}
            </p>
            <h2 className="modal-panel-title" id="modal-title-empleado-form">
              {editingId ? 'Editar empleado' : 'Agregar empleado'}
            </h2>
          </div>
          <button className="modal-panel-close" onClick={onCancel} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="empleados-form empleados-modal__form" noValidate>
          <div className="modal-panel__scroll empleados-modal__body">
            <div className="form-group-base form-group-base--compact">
              <label htmlFor="name" className="form-label-base form-label-base--inline">
                <PersonIcon className="form-label-icon" />
                Nombre Completo *
              </label>
              <input
                ref={nameRef}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={onChange}
                className={`form-input-base ${formErrors.name ? 'input-error' : ''}`}
                placeholder="Ej: Juan Pérez"
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
                <label htmlFor="identification" className="form-label-base form-label-base--inline">
                  Documento de Identidad *
                </label>
                <input
                  ref={identificationRef}
                  type="text"
                  id="identification"
                  name="identification"
                  value={formData.identification}
                  onChange={onChange}
                  className={`form-input-base ${formErrors.identification ? 'input-error' : ''}`}
                  placeholder="Ej: 1234567890"
                  aria-invalid={!!formErrors.identification}
                  {...(formErrors.identification ? { 'aria-describedby': 'identification-error' } : {})}
                />
                {formErrors.identification && (
                  <span id="identification-error" className="error-message" role="alert">
                    {formErrors.identification}
                  </span>
                )}
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="contractType" className="form-label-base form-label-base--inline">
                  Tipo de Contrato
                </label>
                <select
                  id="contractType"
                  name="contractType"
                  value={formData.contractType}
                  onChange={onChange}
                  className="form-input-base"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Indefinido">Indefinido</option>
                  <option value="Término Fijo">Término Fijo</option>
                  <option value="Término Fijo a Prueba">Término Fijo a Prueba</option>
                  <option value="Obra o Labor">Obra o Labor</option>
                  <option value="Prestación de Servicios">Prestación de Servicios</option>
                  <option value="Aprendizaje">Aprendizaje</option>
                </select>
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="startDate" className="form-label-base form-label-base--inline">
                  Fecha de Contratación
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={onChange}
                  className="form-input-base"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="salary" className="form-label-base form-label-base--inline">
                  <AttachMoneyIcon className="form-label-icon" />
                  Salario
                </label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="position" className="form-label-base form-label-base--inline">
                  <WorkIcon className="form-label-icon" />
                  Cargo/Posición
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Desarrollador Senior"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="department" className="form-label-base form-label-base--inline">
                  Departamento
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Tecnología"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="email" className="form-label-base form-label-base--inline">
                  <EmailIcon className="form-label-icon" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="ejemplo@empresa.com"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="phone" className="form-label-base form-label-base--inline">
                  <PhoneIcon className="form-label-icon" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="address" className="form-label-base form-label-base--inline">
                <HomeIcon className="form-label-icon" />
                Dirección
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={onChange}
                className="form-input-base"
                placeholder="Ej: Calle 123 #45-67"
              />
            </div>

            <div className="crud-form-section-divider">
              <h3 className="app-form-block-title empleados-form-subsection-title">
                <ContactEmergencyIcon className="form-label-icon" />
                Contacto de Emergencia
              </h3>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="emergencyContactName" className="form-label-base form-label-base--inline">
                  Nombre
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: María Pérez"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="emergencyContactPhone" className="form-label-base form-label-base--inline">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="+57 300 987 6543"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label
                  htmlFor="emergencyContactRelationship"
                  className="form-label-base form-label-base--inline"
                >
                  Relación
                </label>
                <input
                  type="text"
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Esposa, Padre, etc."
                />
              </div>
            </div>

            <div className="crud-form-section-divider">
              <h3 className="app-form-block-title empleados-form-subsection-title">
                <AccountBalanceWalletIcon className="form-label-icon" />
                Deudas pendientes
              </h3>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="debtNormal" className="form-label-base form-label-base--inline">
                  <AccountBalanceWalletIcon className="form-label-icon" />
                  Deuda normal
                </label>
                <input
                  type="number"
                  id="debtNormal"
                  name="debtNormal"
                  value={formData.debtNormal}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="debtCesantias" className="form-label-base form-label-base--inline">
                  <SavingsOutlinedIcon className="form-label-icon" />
                  Cesantías
                </label>
                <input
                  type="number"
                  id="debtCesantias"
                  name="debtCesantias"
                  value={formData.debtCesantias}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="debtNormalNotes" className="form-label-base form-label-base--inline">
                  Notas deuda
                </label>
                <input
                  type="text"
                  id="debtNormalNotes"
                  name="debtNormalNotes"
                  value={formData.debtNormalNotes}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Préstamo, nómina atrasada…"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="debtCesantiasNotes" className="form-label-base form-label-base--inline">
                  Notas cesantías
                </label>
                <input
                  type="text"
                  id="debtCesantiasNotes"
                  name="debtCesantiasNotes"
                  value={formData.debtCesantiasNotes}
                  onChange={onChange}
                  className="form-input-base"
                  placeholder="Ej: Periodo 2024…"
                />
              </div>
            </div>
          </div>

            <div className="modal-actions-base empleados-modal__footer">
              <button type="button" className="btn-base btn-secondary empleados-modal__btn" onClick={onCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn-base btn-accent empleados-modal__btn">
                {editingId ? 'Guardar cambios' : 'Agregar empleado'}
              </button>
            </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default EmpleadoFormModal
