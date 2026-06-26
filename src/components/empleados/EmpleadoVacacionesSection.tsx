import { useEffect, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { api } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import type { Employee, EmployeeSyncHandler } from './employeeTypes'

interface EmpleadoVacacionesSectionProps {
  employee: Employee
  onSync: EmployeeSyncHandler
}

function EmpleadoVacacionesSection({ employee, onSync }: EmpleadoVacacionesSectionProps) {
  const { showNotification } = useNotification()
  const [vacationDaysAvailable, setVacationDaysAvailable] = useState('')
  const [vacationForm, setVacationForm] = useState({
    startDate: '',
    endDate: '',
    notes: '',
  })

  useEffect(() => {
    setVacationDaysAvailable(employee.data.vacationDaysAvailable?.toString() || '')
  }, [employee])

  const handleSaveAvailableDays = async () => {
    try {
      await api.updateEmployee(employee.id, {
        data: {
          ...employee.data,
          vacationDaysAvailable: vacationDaysAvailable ? parseInt(vacationDaysAvailable, 10) : undefined,
        },
      })
      showNotification('Vacaciones disponibles actualizadas', 'success')
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar vacaciones. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleAddVacation = async () => {
    if (!vacationForm.startDate || !vacationForm.endDate) {
      showNotification('Debes ingresar fecha de inicio y fin', 'error')
      return
    }

    try {
      const start = new Date(vacationForm.startDate)
      const end = new Date(vacationForm.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const vacations = employee.data.vacations || []

      await api.updateEmployee(employee.id, {
        data: {
          ...employee.data,
          vacations: [
            ...vacations,
            {
              startDate: vacationForm.startDate,
              endDate: vacationForm.endDate,
              days,
              notes: vacationForm.notes || undefined,
            },
          ],
          vacationDaysAvailable: (employee.data.vacationDaysAvailable || 0) - days,
        },
      })
      showNotification('Vacaciones registradas exitosamente', 'success')
      setVacationForm({ startDate: '', endDate: '', notes: '' })
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al registrar vacaciones. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteVacation = async (index: number) => {
    const vacation = employee.data.vacations?.[index]
    if (!vacation) return

    try {
      const vacations = employee.data.vacations || []
      await api.updateEmployee(employee.id, {
        data: {
          ...employee.data,
          vacations: vacations.filter((_, i) => i !== index),
          vacationDaysAvailable: (employee.data.vacationDaysAvailable || 0) + vacation.days,
        },
      })
      showNotification('Vacaciones eliminadas', 'success')
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar vacaciones. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <>
      <div className="empleados-detail-section">
        <h3 className="app-subsection-title app-subsection-title--plain empleados-detail-section-title">
          <EventAvailableIcon className="empleados-detail-section-icon" />
          Vacaciones Disponibles
        </h3>
        <div className="empleados-detail-form-group">
          <label className="form-label-base form-label-base--inline">Días Disponibles</label>
          <input
            type="number"
            value={vacationDaysAvailable}
            onChange={e => setVacationDaysAvailable(e.target.value)}
            className="form-input-base"
            min="0"
            placeholder="0"
          />
          <button
            type="button"
            className="btn-base btn-accent btn-submit"
            onClick={() => void handleSaveAvailableDays()}
          >
            Guardar
          </button>
        </div>
      </div>

      <div className="empleados-detail-section">
        <h3 className="app-subsection-title app-subsection-title--plain empleados-detail-section-title">
          <EventAvailableIcon className="empleados-detail-section-icon" />
          Vacaciones Tomadas
        </h3>
        <div className="empleados-detail-form-group">
          <div className="crud-form-row">
            <div className="form-group-base form-group-base--compact">
              <label className="form-label-base form-label-base--inline">Fecha Inicio</label>
              <input
                type="date"
                value={vacationForm.startDate}
                onChange={e => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-input-base"
              />
            </div>
            <div className="form-group-base form-group-base--compact">
              <label className="form-label-base form-label-base--inline">Fecha Fin</label>
              <input
                type="date"
                value={vacationForm.endDate}
                onChange={e => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-input-base"
              />
            </div>
          </div>
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Notas</label>
            <input
              type="text"
              value={vacationForm.notes}
              onChange={e => setVacationForm(prev => ({ ...prev, notes: e.target.value }))}
              className="form-input-base"
              placeholder="Notas opcionales"
            />
          </div>
          <button
            type="button"
            className="btn-base btn-accent btn-submit"
            onClick={() => void handleAddVacation()}
          >
            Agregar Vacaciones
          </button>
        </div>
        {employee.data.vacations && employee.data.vacations.length > 0 && (
          <div className="empleados-detail-list">
            {employee.data.vacations.map((vacation, index) => (
              <div key={index} className="glass-list-item">
                <div className="empleados-detail-list-item-content">
                  <CalendarTodayIcon className="empleados-detail-list-item-icon" />
                  <div>
                    <span className="empleados-detail-list-item-date">
                      {new Date(vacation.startDate).toLocaleDateString('es-CO')} -{' '}
                      {new Date(vacation.endDate).toLocaleDateString('es-CO')}
                    </span>
                    <span className="empleados-detail-list-item-days">{vacation.days} días</span>
                    {vacation.notes && (
                      <span className="empleados-detail-list-item-notes">{vacation.notes}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-icon btn-icon--danger"
                  onClick={() => void handleDeleteVacation(index)}
                  aria-label="Eliminar vacaciones"
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default EmpleadoVacacionesSection
