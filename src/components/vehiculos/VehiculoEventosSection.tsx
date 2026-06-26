import { useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import { api } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import type { Vehicle, VehicleSyncHandler } from './vehicleTypes'

interface VehiculoEventosSectionProps {
  vehicle: Vehicle
  onSync: VehicleSyncHandler
}

function VehiculoEventosSection({ vehicle, onSync }: VehiculoEventosSectionProps) {
  const { showNotification } = useNotification()
  const [eventForm, setEventForm] = useState({
    type: '',
    date: '',
    description: '',
    location: '',
    cost: '',
    repairShop: '',
    purchasePlace: '',
    notes: '',
  })

  const handleAddEvent = async () => {
    if (!eventForm.type || !eventForm.date) {
      showNotification('Debes ingresar tipo y fecha del evento', 'error')
      return
    }

    try {
      const events = vehicle.data.events || []
      await api.updateVehicle(vehicle.id, {
        data: {
          ...vehicle.data,
          events: [
            ...events,
            {
              type: eventForm.type,
              date: eventForm.date,
              description: eventForm.description || undefined,
              location: eventForm.location || undefined,
              cost: eventForm.cost ? parseFloat(eventForm.cost) : undefined,
              repairShop: eventForm.repairShop || undefined,
              purchasePlace: eventForm.purchasePlace || undefined,
              notes: eventForm.notes || undefined,
            },
          ],
        },
      })
      showNotification('Evento registrado exitosamente', 'success')
      setEventForm({
        type: '',
        date: '',
        description: '',
        location: '',
        cost: '',
        repairShop: '',
        purchasePlace: '',
        notes: '',
      })
      await onSync(vehicle.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al registrar el evento. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteEvent = async (index: number) => {
    try {
      const events = vehicle.data.events || []
      await api.updateVehicle(vehicle.id, {
        data: {
          ...vehicle.data,
          events: events.filter((_, i) => i !== index),
        },
      })
      showNotification('Evento eliminado', 'success')
      await onSync(vehicle.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el evento. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="vehiculos-detail-section">
      <h3 className="app-subsection-title app-subsection-title--plain vehiculos-detail-section-title">
        <ReportProblemIcon className="vehiculos-detail-section-icon" />
        Eventos
      </h3>
      <div className="vehiculos-detail-form-group">
        <div className="crud-form-row">
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Tipo de Evento *</label>
            <select
              value={eventForm.type}
              onChange={e => setEventForm(prev => ({ ...prev, type: e.target.value }))}
              className="form-input-base"
            >
              <option value="">Seleccionar...</option>
              <option value="Rayón">Rayón</option>
              <option value="Golpe">Golpe</option>
              <option value="Pinchazo">Pinchazo</option>
              <option value="Choque">Choque</option>
              <option value="Vandalismo">Vandalismo</option>
              <option value="Robo">Robo</option>
              <option value="Accidente">Accidente</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Fecha *</label>
            <input
              type="date"
              value={eventForm.date}
              onChange={e => setEventForm(prev => ({ ...prev, date: e.target.value }))}
              className="form-input-base"
            />
          </div>
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">Descripción</label>
          <input
            type="text"
            value={eventForm.description}
            onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
            className="form-input-base"
            placeholder="Ej: Rayón en puerta delantera derecha"
          />
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">
            Ubicación del Daño en el Vehículo
          </label>
          <input
            type="text"
            value={eventForm.location}
            onChange={e => setEventForm(prev => ({ ...prev, location: e.target.value }))}
            className="form-input-base"
            placeholder="Ej: Puerta delantera derecha, Parabrisas, Llanta trasera izquierda, etc."
          />
        </div>
        <div className="crud-form-row">
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Precio del Arreglo/Compra (COP)</label>
            <input
              type="number"
              value={eventForm.cost}
              onChange={e => setEventForm(prev => ({ ...prev, cost: e.target.value }))}
              className="form-input-base"
              min="0"
              step="1000"
              placeholder="0"
            />
          </div>
          <div className="form-group-base form-group-base--compact">
            <label className="form-label-base form-label-base--inline">Taller/Sitio del Arreglo</label>
            <input
              type="text"
              value={eventForm.repairShop}
              onChange={e => setEventForm(prev => ({ ...prev, repairShop: e.target.value }))}
              className="form-input-base"
              placeholder="Ej: Taller ABC, Autopartes XYZ, etc."
            />
          </div>
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">Sitio de Compra (si aplica)</label>
          <input
            type="text"
            value={eventForm.purchasePlace}
            onChange={e => setEventForm(prev => ({ ...prev, purchasePlace: e.target.value }))}
            className="form-input-base"
            placeholder="Ej: Repuestos ABC, Tienda XYZ, Online, etc."
          />
        </div>
        <div className="form-group-base form-group-base--compact">
          <label className="form-label-base form-label-base--inline">Notas</label>
          <input
            type="text"
            value={eventForm.notes}
            onChange={e => setEventForm(prev => ({ ...prev, notes: e.target.value }))}
            className="form-input-base"
            placeholder="Notas adicionales"
          />
        </div>
        <button
          type="button"
          className="btn-base btn-accent btn-submit"
          onClick={() => void handleAddEvent()}
        >
          Agregar Evento
        </button>
      </div>
      {vehicle.data.events && vehicle.data.events.length > 0 && (
        <div className="vehiculos-detail-list">
          {vehicle.data.events.map((event, index) => (
            <div key={index} className="glass-list-item">
              <div className="vehiculos-detail-list-item-content">
                <ReportProblemIcon className="vehiculos-detail-list-item-icon" />
                <div>
                  <span className="vehiculos-detail-list-item-date">
                    {new Date(event.date).toLocaleDateString('es-CO')}
                  </span>
                  <span className="vehiculos-detail-list-item-type">{event.type}</span>
                  {event.description && (
                    <span className="vehiculos-detail-list-item-reason">{event.description}</span>
                  )}
                  {event.location && (
                    <span className="vehiculos-detail-list-item-notes">
                      Ubicación del daño: {event.location}
                    </span>
                  )}
                  {event.cost != null && (
                    <span className="vehiculos-detail-list-item-hours">
                      Precio: ${event.cost.toLocaleString('es-CO')}
                    </span>
                  )}
                  {event.repairShop && (
                    <span className="vehiculos-detail-list-item-notes">Taller: {event.repairShop}</span>
                  )}
                  {event.purchasePlace && (
                    <span className="vehiculos-detail-list-item-notes">
                      Sitio de compra: {event.purchasePlace}
                    </span>
                  )}
                  {event.notes && (
                    <span className="vehiculos-detail-list-item-notes">{event.notes}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-icon btn-icon--danger"
                onClick={() => void handleDeleteEvent(index)}
                aria-label="Eliminar evento"
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

export default VehiculoEventosSection
