import type { RefObject } from 'react'
import PersonIcon from '@mui/icons-material/Person'
import WorkIcon from '@mui/icons-material/Work'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
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
      <div className="empleados-modal empleados-modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-panel-header">
          <h2 className="modal-panel-title" id="modal-panel-title-editingid-editar-empleado-agregar-empleado">
            {editingId ? 'Editar Empleado' : 'Agregar Empleado'}
          </h2>
          <button className="modal-panel-close" onClick={onCancel} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>
        <div className="modal-panel-content">
          <form onSubmit={onSubmit} className="empleados-form" noValidate>
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
              <h3 className="empleados-form-subsection-title">
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

            <div className="empleados-form-actions">
              <button
                type="button"
                className="empleados-form-button empleados-form-button-secondary"
                onClick={onCancel}
              >
                Cancelar
              </button>
              <button type="submit" className="empleados-form-button empleados-form-button-primary">
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default EmpleadoFormModal
