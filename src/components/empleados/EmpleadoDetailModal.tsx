import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ModalOverlay from '../ModalOverlay'
import EmpleadoVacacionesSection from './EmpleadoVacacionesSection'
import EmpleadoPermisosSection from './EmpleadoPermisosSection'
import EmpleadoRetrasosSection from './EmpleadoRetrasosSection'
import type { Employee, EmployeeSyncHandler } from './employeeTypes'

interface EmpleadoDetailModalProps {
  employee: Employee
  onClose: () => void
  onEdit: (employee: Employee) => void
  onDelete: (id: string, name: string) => Promise<void>
  onSync: EmployeeSyncHandler
}

function EmpleadoDetailModal({ employee, onClose, onEdit, onDelete, onSync }: EmpleadoDetailModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="empleados-modal empleados-modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-panel-header">
          <h2 className="modal-panel-title" id="modal-panel-title-detalle-del-empleado">
            Detalle del Empleado
          </h2>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>
        <div className="modal-panel-content">
          <div className="empleados-detail-section">
            <h3 className="empleados-detail-section-title">Información Básica</h3>
            <div className="empleados-detail-grid">
              <div className="empleados-detail-item">
                <span className="empleados-detail-label">Nombre:</span>
                <span className="empleados-detail-value">{employee.name}</span>
              </div>
              {employee.data.identification && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Documento:</span>
                  <span className="empleados-detail-value">{employee.data.identification}</span>
                </div>
              )}
              {employee.data.position && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Cargo:</span>
                  <span className="empleados-detail-value">{employee.data.position}</span>
                </div>
              )}
              {employee.data.department && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Departamento:</span>
                  <span className="empleados-detail-value">{employee.data.department}</span>
                </div>
              )}
              {employee.data.contractType && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Tipo de Contrato:</span>
                  <span className="empleados-detail-value">{employee.data.contractType}</span>
                </div>
              )}
              {employee.data.salary && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Salario:</span>
                  <span className="empleados-detail-value">
                    ${employee.data.salary.toLocaleString('es-CO')}
                  </span>
                </div>
              )}
              {employee.data.startDate && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Fecha de Contratación:</span>
                  <span className="empleados-detail-value">
                    {new Date(employee.data.startDate).toLocaleDateString('es-CO')}
                  </span>
                </div>
              )}
              {employee.data.email && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Email:</span>
                  <span className="empleados-detail-value">{employee.data.email}</span>
                </div>
              )}
              {employee.data.phone && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Teléfono:</span>
                  <span className="empleados-detail-value">{employee.data.phone}</span>
                </div>
              )}
              {employee.data.address && (
                <div className="empleados-detail-item">
                  <span className="empleados-detail-label">Dirección:</span>
                  <span className="empleados-detail-value">{employee.data.address}</span>
                </div>
              )}
            </div>
          </div>

          <EmpleadoVacacionesSection employee={employee} onSync={onSync} />
          <EmpleadoPermisosSection employee={employee} onSync={onSync} />
          <EmpleadoRetrasosSection employee={employee} onSync={onSync} />

          <div className="detail-actions">
            <button
              type="button"
              className="detail-action-button"
              onClick={() => onEdit(employee)}
              aria-label="Editar empleado"
            >
              <EditIcon />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className="detail-action-button danger"
              onClick={() => {
                void onDelete(employee.id, employee.name).then(() => onClose())
              }}
              aria-label="Eliminar empleado"
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

export default EmpleadoDetailModal
