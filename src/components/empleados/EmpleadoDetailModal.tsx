import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ModalOverlay from '../ModalOverlay'
import EmpleadoDeudasSection from './EmpleadoDeudasSection'
import EmpleadoVacacionesSection from './EmpleadoVacacionesSection'
import EmpleadoPermisosSection from './EmpleadoPermisosSection'
import EmpleadoRetrasosSection from './EmpleadoRetrasosSection'
import {
  formatEmployeeDetailSubtitle,
  formatEmployeeMoney,
  getEmployeeDebtTotal,
  hasEmployeeDebt,
} from './employeeDisplayUtils'
import type { Employee, EmployeeSyncHandler } from './employeeTypes'

interface EmpleadoDetailModalProps {
  employee: Employee
  isBusy: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onSync: EmployeeSyncHandler
}

function EmpleadoDetailModal({
  employee,
  isBusy,
  onClose,
  onEdit,
  onDelete,
  onSync,
}: EmpleadoDetailModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel empleados-modal empleados-modal--detail"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-empleado-detalle"
      >
        <div className="empleados-modal__header">
          <div className="empleados-modal__header-copy">
            <p className="empleados-modal__kicker">Personas · Detalle</p>
            <h2 className="modal-panel-title" id="modal-title-empleado-detalle">
              {employee.name}
            </h2>
            <p className="empleados-modal__subtitle">{formatEmployeeDetailSubtitle(employee)}</p>
            {hasEmployeeDebt(employee) ? (
              <p className="empleados-debt-badge">
                Por pagar: {formatEmployeeMoney(getEmployeeDebtTotal(employee))}
              </p>
            ) : null}
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content empleados-modal__body">
          <div className="empleados-detail-section">
            <h3 className="empleados-detail-section-title">Información básica</h3>
            <div className="empleados-detail-grid">
              {employee.data.identification ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Documento</span>
                  <span className="empleados-detail-value">{employee.data.identification}</span>
                </div>
              ) : null}
              {employee.data.position ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Cargo</span>
                  <span className="empleados-detail-value">{employee.data.position}</span>
                </div>
              ) : null}
              {employee.data.department ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Departamento</span>
                  <span className="empleados-detail-value">{employee.data.department}</span>
                </div>
              ) : null}
              {employee.data.contractType ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Contrato</span>
                  <span className="empleados-detail-value">{employee.data.contractType}</span>
                </div>
              ) : null}
              {employee.data.salary ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Salario</span>
                  <span className="empleados-detail-value">
                    ${employee.data.salary.toLocaleString('es-CO')}
                  </span>
                </div>
              ) : null}
              {employee.data.startDate ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Contratación</span>
                  <span className="empleados-detail-value">
                    {new Date(employee.data.startDate).toLocaleDateString('es-CO')}
                  </span>
                </div>
              ) : null}
              {employee.data.email ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Email</span>
                  <span className="empleados-detail-value">{employee.data.email}</span>
                </div>
              ) : null}
              {employee.data.phone ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Teléfono</span>
                  <span className="empleados-detail-value">{employee.data.phone}</span>
                </div>
              ) : null}
              {employee.data.address ? (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Dirección</span>
                  <span className="empleados-detail-value">{employee.data.address}</span>
                </div>
              ) : null}
            </div>
          </div>

          <EmpleadoDeudasSection employee={employee} onSync={onSync} />
          <EmpleadoVacacionesSection employee={employee} onSync={onSync} />
          <EmpleadoPermisosSection employee={employee} onSync={onSync} />
          <EmpleadoRetrasosSection employee={employee} onSync={onSync} />
        </div>

        <div className="modal-actions-base empleados-modal__footer empleados-modal__footer--detail">
          <button
            type="button"
            className="btn-base btn-accent empleados-modal__btn empleados-modal__btn--primary"
            onClick={onEdit}
            disabled={isBusy}
          >
            <EditIcon aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            className="btn-base btn-secondary empleados-modal__btn empleados-modal__btn--danger"
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

export default EmpleadoDetailModal
