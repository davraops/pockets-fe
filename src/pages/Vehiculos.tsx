import { useState, useEffect, useRef, useMemo } from 'react'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import VehiculoFormModal from '../components/vehiculos/VehiculoFormModal'
import VehiculoDetailModal from '../components/vehiculos/VehiculoDetailModal'
import VehiculoDebugModal from '../components/vehiculos/VehiculoDebugModal'
import VehiculoCard from '../components/vehiculos/VehiculoCard'
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
  filterVehiclesByQuery,
  vehicleSummaryItems,
} from '../components/vehiculos/vehicleDisplayUtils'
import type { Vehicle } from '../components/vehiculos/vehicleTypes'
import { mapVehicleRecords } from '../components/vehiculos/vehicleTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import './AppPage.css'
import './Vehiculos.css'

function Vehiculos() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formData, setFormData] = useState<VehicleFormData>(EMPTY_VEHICLE_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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

  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormData(EMPTY_VEHICLE_FORM)
    setFormErrors(EMPTY_VEHICLE_FORM_ERRORS)
    setShowFormModal(true)
  }

  const handleCancelForm = () => {
    const returnToDetail = editingId && selectedVehicle
    resetForm()
    if (returnToDetail) {
      setShowDetailModal(true)
    }
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
      setIsSaving(true)
      const vehiclePayload = formDataToVehiclePayload(formData)

      if (editingId) {
        await api.updateVehicle(editingId, vehiclePayload)
        showNotification('Vehículo actualizado', 'success')
      } else {
        await api.createVehicle(vehiclePayload)
        showNotification('Vehículo agregado', 'success')
      }

      await loadRecords()
      resetForm()
      setShowDetailModal(false)
      setSelectedVehicle(null)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        editingId
          ? 'Error al actualizar el vehículo. Por favor, intenta de nuevo.'
          : 'Error al agregar el vehículo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditFromDetail = () => {
    if (!selectedVehicle) {
      return
    }
    setFormData(vehicleToFormData(selectedVehicle))
    setEditingId(selectedVehicle.id)
    setShowDetailModal(false)
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
      setIsSaving(true)
      await api.deleteVehicle(id)
      showNotification('Vehículo eliminado', 'success')
      await loadRecords()
      setShowDetailModal(false)
      setSelectedVehicle(null)
      resetForm()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el vehículo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const highlights = calculateVehicleHighlights(vehicles)
  const hasSearch = searchQuery.trim().length > 0
  const filteredVehicles = useMemo(
    () => filterVehiclesByQuery(vehicles, searchQuery),
    [vehicles, searchQuery]
  )

  const openVehicleDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedVehicle(null)
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content vehiculos-content utilidades-sub-content">
        <UtilidadesSubHeader
          title="Vehículos"
          context="Flota"
          meta={
            !isLoading && !error
              ? hasSearch
                ? `${filteredVehicles.length} de ${vehicles.length} registrado${vehicles.length !== 1 ? 's' : ''}`
                : `${vehicles.length} registrado${vehicles.length !== 1 ? 's' : ''}`
              : undefined
          }
          toolbarActions={
            isDebugToolsEnabled() ? (
              <div className="utilidades-sub-menu-container" ref={menuRef}>
                <button
                  type="button"
                  className="app-toolbar-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Opciones de depuración"
                  aria-expanded={isMenuOpen}
                >
                  <MoreVertIcon className="app-toolbar-icon" />
                </button>
                {isMenuOpen && (
                  <div className="utilidades-sub-menu">
                    <button
                      type="button"
                      className="utilidades-sub-menu-item"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDebugModalOpen(true)
                      }}
                    >
                      🐛 Debug
                    </button>
                  </div>
                )}
              </div>
            ) : null
          }
        />

        {!isLoading && !error && vehicles.length > 0 ? (
          <CrudSummaryStrip
            ariaLabel="Resumen de vehículos"
            items={vehicleSummaryItems(highlights)}
          />
        ) : null}

        <div
          className={`vehiculos-toolbar${!isLoading && !error && vehicles.length === 0 ? ' vehiculos-toolbar--solo-cta' : ''}`}
        >
          {!isLoading && !error && (vehicles.length > 0 || hasSearch) ? (
            <label className="vehiculos-search">
              <SearchIcon className="vehiculos-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="vehiculos-search-input"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre, placa, marca…"
                aria-label="Buscar vehículos"
              />
            </label>
          ) : null}
          <button
            type="button"
            className="btn-base btn-accent btn-submit crud-primary-cta vehiculos-toolbar-cta"
            onClick={handleOpenCreateModal}
            aria-label="Agregar vehículo"
          >
            <AddIcon aria-hidden={true} />
            Agregar vehículo
          </button>
        </div>

        {showFormModal && (
          <VehiculoFormModal
            editingId={editingId}
            formData={formData}
            formErrors={formErrors}
            nameRef={nameRef}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        )}

        <CrudListPanel
          items={filteredVehicles}
          isLoading={isLoading}
          error={error}
          onRetry={() => void loadRecords()}
          retryAriaLabel="Reintentar cargar vehículos"
          loadingAriaLabel="Cargando vehículos"
          emptyIcon={<DirectionsCarIcon className="empty-state-icon" />}
          emptyTitle={hasSearch ? 'Sin coincidencias' : 'No hay vehículos registrados'}
          emptySubtext={
            hasSearch
              ? 'Prueba con otro término o limpia la búsqueda'
              : 'Usa Agregar vehículo para registrar el primero'
          }
          getItemKey={vehicle => vehicle.id}
          listOuterClassName="vehiculos-list"
          renderBody={() => (
            <div className="vehiculos-card-grid">
              {filteredVehicles.map(vehicle => (
                <VehiculoCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => openVehicleDetail(vehicle)}
                />
              ))}
            </div>
          )}
          renderItem={() => null}
        />

        {showDetailModal && selectedVehicle && !showFormModal && (
          <VehiculoDetailModal
            vehicle={selectedVehicle}
            isBusy={isSaving}
            onClose={handleCloseDetailModal}
            onEdit={handleEditFromDetail}
            onDelete={() => void handleDelete(selectedVehicle.id, selectedVehicle.name)}
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
