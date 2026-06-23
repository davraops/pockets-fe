import { useState, useEffect, useRef } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import VehiculoFormModal from '../components/vehiculos/VehiculoFormModal'
import VehiculoDetailModal from '../components/vehiculos/VehiculoDetailModal'
import VehiculoDebugModal from '../components/vehiculos/VehiculoDebugModal'
import VehiculoListRow from '../components/vehiculos/VehiculoListRow'
import {
  EMPTY_VEHICLE_FORM,
  EMPTY_VEHICLE_FORM_ERRORS,
  vehicleToFormData,
  formDataToVehiclePayload,
  validateVehicleForm,
  type VehicleFormData,
  type VehicleFormErrors,
} from '../components/vehiculos/vehicleFormUtils'
import {
  calculateVehicleHighlights,
  vehicleSummaryItems,
} from '../components/vehiculos/vehicleDisplayUtils'
import type { Vehicle } from '../components/vehiculos/vehicleTypes'
import { mapVehicleRecords } from '../components/vehiculos/vehicleTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Vehiculos.css'

function Vehiculos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formData, setFormData] = useState<VehicleFormData>(EMPTY_VEHICLE_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<VehicleFormErrors>(EMPTY_VEHICLE_FORM_ERRORS)

  useEffect(() => {
    void loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getVehicles()
      if (response.vehicles && Array.isArray(response.vehicles)) {
        setVehicles(mapVehicleRecords(response.vehicles))
      } else {
        setVehicles([])
      }
    } catch (err: unknown) {
      devError('Error al cargar vehículos:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar vehículos. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setVehicles([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const syncVehicle = async (vehicleId: string) => {
    const response = await api.getVehicles()
    if (response.vehicles && Array.isArray(response.vehicles)) {
      const mappedVehicles = mapVehicleRecords(response.vehicles)
      setVehicles(mappedVehicles)
      const updated = mappedVehicles.find(vehicle => vehicle.id === vehicleId)
      if (updated) {
        setSelectedVehicle(updated)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name as keyof VehicleFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData(EMPTY_VEHICLE_FORM)
    setFormErrors(EMPTY_VEHICLE_FORM_ERRORS)
    setShowFormModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors } = validateVehicleForm(formData)
    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => nameRef.current?.focus())
      return
    }

    try {
      const vehiclePayload = formDataToVehiclePayload(formData)

      if (editingId) {
        await api.updateVehicle(editingId, vehiclePayload)
        showNotification('Vehículo actualizado exitosamente', 'success')
      } else {
        await api.createVehicle(vehiclePayload)
        showNotification('Vehículo agregado exitosamente', 'success')
      }

      await loadRecords()
      resetForm()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        editingId
          ? 'Error al actualizar el vehículo. Por favor, intenta de nuevo.'
          : 'Error al agregar el vehículo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setFormData(vehicleToFormData(vehicle))
    setEditingId(vehicle.id)
    setShowFormModal(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !(await confirm({
        message: `¿Estás seguro de que quieres eliminar el vehículo "${name}"?`,
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      await api.deleteVehicle(id)
      showNotification('Vehículo eliminado exitosamente', 'success')
      await loadRecords()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el vehículo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const highlights = calculateVehicleHighlights(vehicles)

  const openVehicleDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowDetailModal(true)
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content vehiculos-content">
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/registros')}
            aria-label={backToHubLabel('registros')}
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
          <div className="app-toolbar-menu-container" ref={menuRef}>
            {isDebugToolsEnabled() && (
              <>
                <button
                  className="app-toolbar-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Opciones de depuración"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  <MoreVertIcon className="app-toolbar-icon" />
                </button>
                {isMenuOpen && (
                  <div className="crud-dropdown-menu">
                    <button
                      className="crud-dropdown-menu-item"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDebugModalOpen(true)
                      }}
                      type="button"
                    >
                      <span>🐛 Debug</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <h1 className="app-page-title">Vehículos</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen de vehículos"
          items={vehicleSummaryItems(highlights)}
        />

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={() => setShowFormModal(true)}
          aria-label="Agregar vehículo"
        >
          <AddIcon aria-hidden={true} />
          Agregar vehículo
        </button>

        {showFormModal && (
          <VehiculoFormModal
            editingId={editingId}
            formData={formData}
            formErrors={formErrors}
            nameRef={nameRef}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        )}

        <CrudListPanel
          items={vehicles}
          isLoading={isLoading}
          error={error}
          onRetry={() => void loadRecords()}
          retryAriaLabel="Reintentar cargar vehículos"
          loadingAriaLabel="Cargando vehículos"
          emptyIcon={<DirectionsCarIcon className="empty-state-icon" />}
          emptyTitle="No hay vehículos agregados"
          emptySubtext="Usa el botón de arriba para agregar el primero"
          getItemKey={vehicle => vehicle.id}
          renderItem={vehicle => (
            <VehiculoListRow vehicle={vehicle} onClick={() => openVehicleDetail(vehicle)} />
          )}
        />

        {showDetailModal && selectedVehicle && (
          <VehiculoDetailModal
            vehicle={selectedVehicle}
            onClose={() => setShowDetailModal(false)}
            onEdit={vehicle => {
              handleEdit(vehicle)
              setShowDetailModal(false)
            }}
            onDelete={handleDelete}
            onSync={syncVehicle}
          />
        )}

        {isDebugModalOpen && isDebugToolsEnabled() && (
          <VehiculoDebugModal
            onClose={() => setIsDebugModalOpen(false)}
            onReload={loadRecords}
            onClearList={() => setVehicles([])}
          />
        )}
      </div>
    </div>
  )
}

export default Vehiculos
