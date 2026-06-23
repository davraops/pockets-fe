import { useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { api } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import type { Employee, EmployeeSyncHandler } from './employeeTypes'

interface EmpleadoPermisosSectionProps {
  employee: Employee
  onSync: EmployeeSyncHandler
}

function EmpleadoPermisosSection({ employee, onSync }: EmpleadoPermisosSectionProps) {
  const { showNotification } = useNotification()
  const [permissionForm, setPermissionForm] = useState({
    date: '',
    reason: '',
    hours: '',
    notes: '',
  })

  const handleAddPermission = async () => {
    if (!permissionForm.date || !permissionForm.reason) {
      showNotification('Debes ingresar fecha y razón', 'error')
      return
    }

    try {
      const permissions = employee.data.permissions || []
      await api.updateEmployee(employee.id, {
        data: {
          ...employee.data,
          permissions: [
            ...permissions,
            {
              date: permissionForm.date,
              reason: permissionForm.reason,
              hours: permissionForm.hours ? parseFloat(permissionForm.hours) : undefined,
              notes: permissionForm.notes || undefined,
            },
          ],
        },
      })
      showNotification('Permiso registrado exitosamente', 'success')
      setPermissionForm({ date: '', reason: '', hours: '', notes: '' })
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al registrar permiso. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeletePermission = async (index: number) => {
    try {
      const permissions = employee.data.permissions || []
      await api.updateEmployee(employee.id, {
        data: {
          ...employee.data,
          permissions: permissions.filter((_, i) => i !== index),
        },
      })
      showNotification('Permiso eliminado', 'success')
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar permiso. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="empleados-detail-section">
      <h3 className="empleados-detail-section-title">
        <EventBusyIcon className="empleados-detail-section-icon" />
        Permisos
      </h3>
      <div className="empleados-detail-form-group">
        <div className="crud-form-row">
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Fecha</label>
            <input
              type="date"
              value={permissionForm.date}
              onChange={e => setPermissionForm(prev => ({ ...prev, date: e.target.value }))}
              className="form-input-base"
            />
          </div>
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Horas</label>
            <input
              type="number"
              value={permissionForm.hours}
              onChange={e => setPermissionForm(prev => ({ ...prev, hours: e.target.value }))}
              className="form-input-base"
              min="0"
              step="0.5"
              placeholder="0"
            />
          </div>
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">Razón</label>
          <input
            type="text"
            value={permissionForm.reason}
            onChange={e => setPermissionForm(prev => ({ ...prev, reason: e.target.value }))}
            className="form-input-base"
            placeholder="Razón del permiso"
          />
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">Notas</label>
          <input
            type="text"
            value={permissionForm.notes}
            onChange={e => setPermissionForm(prev => ({ ...prev, notes: e.target.value }))}
            className="form-input-base"
            placeholder="Notas opcionales"
          />
        </div>
        <button
          type="button"
          className="empleados-form-button empleados-form-button-primary"
          onClick={() => void handleAddPermission()}
        >
          Agregar Permiso
        </button>
      </div>
      {employee.data.permissions && employee.data.permissions.length > 0 && (
        <div className="empleados-detail-list">
          {employee.data.permissions.map((permission, index) => (
            <div key={index} className="glass-list-item">
              <div className="empleados-detail-list-item-content">
                <CalendarTodayIcon className="empleados-detail-list-item-icon" />
                <div>
                  <span className="empleados-detail-list-item-date">
                    {new Date(permission.date).toLocaleDateString('es-CO')}
                  </span>
                  <span className="empleados-detail-list-item-reason">{permission.reason}</span>
                  {permission.hours != null && (
                    <span className="empleados-detail-list-item-hours">{permission.hours} horas</span>
                  )}
                  {permission.notes && (
                    <span className="empleados-detail-list-item-notes">{permission.notes}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="empleados-detail-list-item-delete"
                onClick={() => void handleDeletePermission(index)}
                aria-label="Eliminar permiso"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmpleadoPermisosSection
