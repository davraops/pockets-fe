import { useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { api } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import type { Employee, EmployeeSyncHandler } from './employeeTypes'

interface EmpleadoRetrasosSectionProps {
  employee: Employee
  onSync: EmployeeSyncHandler
}

function EmpleadoRetrasosSection({ employee, onSync }: EmpleadoRetrasosSectionProps) {
  const { showNotification } = useNotification()
  const [delayForm, setDelayForm] = useState({
    date: '',
    minutes: '',
    reason: '',
    notes: '',
  })

  const handleAddDelay = async () => {
    if (!delayForm.date || !delayForm.minutes) {
      showNotification('Debes ingresar fecha y minutos de retraso', 'error')
      return
    }

    try {
      const delays = employee.data.delays || []
      await api.updateEmployee(employee.id, {
        data: {
          ...employee.data,
          delays: [
            ...delays,
            {
              date: delayForm.date,
              minutes: parseInt(delayForm.minutes, 10),
              reason: delayForm.reason || undefined,
              notes: delayForm.notes || undefined,
            },
          ],
        },
      })
      showNotification('Retraso registrado exitosamente', 'success')
      setDelayForm({ date: '', minutes: '', reason: '', notes: '' })
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al registrar retraso. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteDelay = async (index: number) => {
    try {
      const delays = employee.data.delays || []
      await api.updateEmployee(employee.id, {
        data: {
          ...employee.data,
          delays: delays.filter((_, i) => i !== index),
        },
      })
      showNotification('Retraso eliminado', 'success')
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar retraso. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="empleados-detail-section">
      <h3 className="app-subsection-title app-subsection-title--plain empleados-detail-section-title">
        <EventBusyIcon className="empleados-detail-section-icon" />
        Retrasos
      </h3>
      <div className="empleados-detail-form-group">
        <div className="crud-form-row">
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Fecha</label>
            <input
              type="date"
              value={delayForm.date}
              onChange={e => setDelayForm(prev => ({ ...prev, date: e.target.value }))}
              className="form-input-base"
            />
          </div>
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Minutos de Retraso</label>
            <input
              type="number"
              value={delayForm.minutes}
              onChange={e => setDelayForm(prev => ({ ...prev, minutes: e.target.value }))}
              className="form-input-base"
              min="1"
              placeholder="0"
            />
          </div>
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">Razón (Opcional)</label>
          <input
            type="text"
            value={delayForm.reason}
            onChange={e => setDelayForm(prev => ({ ...prev, reason: e.target.value }))}
            className="form-input-base"
            placeholder="Razón del retraso"
          />
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">Notas</label>
          <input
            type="text"
            value={delayForm.notes}
            onChange={e => setDelayForm(prev => ({ ...prev, notes: e.target.value }))}
            className="form-input-base"
            placeholder="Notas opcionales"
          />
        </div>
        <button
          type="button"
          className="btn-base btn-accent btn-submit"
          onClick={() => void handleAddDelay()}
        >
          Agregar Retraso
        </button>
      </div>
      {employee.data.delays && employee.data.delays.length > 0 && (
        <div className="empleados-detail-list">
          {employee.data.delays.map((delay, index) => (
            <div key={index} className="glass-list-item">
              <div className="empleados-detail-list-item-content">
                <CalendarTodayIcon className="empleados-detail-list-item-icon" />
                <div>
                  <span className="empleados-detail-list-item-date">
                    {new Date(delay.date).toLocaleDateString('es-CO')}
                  </span>
                  <span className="empleados-detail-list-item-hours">{delay.minutes} minutos</span>
                  {delay.reason && (
                    <span className="empleados-detail-list-item-reason">{delay.reason}</span>
                  )}
                  {delay.notes && (
                    <span className="empleados-detail-list-item-notes">{delay.notes}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-icon btn-icon--danger"
                onClick={() => void handleDeleteDelay(index)}
                aria-label="Eliminar retraso"
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

export default EmpleadoRetrasosSection
