import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import BuildIcon from '@mui/icons-material/Build'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DescriptionIcon from '@mui/icons-material/Description'
import SecurityIcon from '@mui/icons-material/Security'
import InfoIcon from '@mui/icons-material/Info'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Vehiculos.css'

interface Vehicle {
  id: string
  name: string
  data: {
    type?: string
    brand?: string
    model?: string
    year?: number
    plate?: string
    color?: string
    vin?: string
    mileage?: number
    fuelType?: string
    insurance?: {
      company?: string
      policyNumber?: string
      expirationDate?: string
      coverage?: string
    }
    maintenance?: {
      lastService?: string
      nextService?: string
      serviceInterval?: number
    }
    documents?: {
      soat?: {
        number?: string
        expiration?: string
      }
      technicalReview?: {
        number?: string
        expiration?: string
      }
    }
    notes?: string
    events?: Array<{
      type: string
      date: string
      description?: string
      location?: string // Ubicación del daño en el vehículo
      cost?: number
      repairShop?: string // Sitio/taller donde se hizo el arreglo
      purchasePlace?: string // Sitio donde se compró (repuesto, servicio, etc.)
      notes?: string
    }>
  }
  created_at?: string
  updated_at?: string
}

interface VehicleRecord {
  id: string
  name: string
  data: Vehicle['data']
  created_at: string
  updated_at: string
}

function Vehiculos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    year: '',
    plate: '',
    color: '',
    vin: '',
    mileage: '',
    fuelType: '',
    insuranceCompany: '',
    insurancePolicyNumber: '',
    insuranceExpirationDate: '',
    insuranceCoverage: '',
    maintenanceLastService: '',
    maintenanceNextService: '',
    maintenanceServiceInterval: '',
    soatNumber: '',
    soatExpiration: '',
    technicalReviewNumber: '',
    technicalReviewExpiration: '',
    notes: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<VehicleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Estados para el formulario de eventos
  const [eventForm, setEventForm] = useState({
    type: '',
    date: '',
    description: '',
    location: '', // Ubicación del daño en el vehículo
    cost: '',
    repairShop: '', // Sitio/taller donde se hizo el arreglo
    purchasePlace: '', // Sitio donde se compró
    notes: '',
  })

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getVehicles()
      if (response.vehicles && Array.isArray(response.vehicles)) {
        setRecords(response.vehicles)
        
        // Mapear cada vehículo individual a la lista
        const mappedVehicles: Vehicle[] = response.vehicles.map((record: VehicleRecord) => ({
          id: record.id,
          name: record.name,
          data: record.data,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }))
        setVehicles(mappedVehicles)
      } else {
        setRecords([])
        setVehicles([])
      }
    } catch (err: any) {
      console.error('Error al cargar vehículos:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar vehículos. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setRecords([])
      setVehicles([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre del vehículo es requerido', 'error')
      return
    }

    try {
      setIsSaving(true)

      const vehicleData: Vehicle['data'] = {
        type: formData.type.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        model: formData.model.trim() || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        plate: formData.plate.trim() || undefined,
        color: formData.color.trim() || undefined,
        vin: formData.vin.trim() || undefined,
        mileage: formData.mileage ? parseFloat(formData.mileage) : undefined,
        fuelType: formData.fuelType.trim() || undefined,
        insurance:
          formData.insuranceCompany.trim() ||
          formData.insurancePolicyNumber.trim() ||
          formData.insuranceExpirationDate.trim() ||
          formData.insuranceCoverage.trim()
            ? {
                company: formData.insuranceCompany.trim() || undefined,
                policyNumber: formData.insurancePolicyNumber.trim() || undefined,
                expirationDate: formData.insuranceExpirationDate || undefined,
                coverage: formData.insuranceCoverage.trim() || undefined,
                }
              : undefined,
        maintenance:
          formData.maintenanceLastService.trim() ||
          formData.maintenanceNextService.trim() ||
          formData.maintenanceServiceInterval.trim()
            ? {
                lastService: formData.maintenanceLastService || undefined,
                nextService: formData.maintenanceNextService || undefined,
                serviceInterval: formData.maintenanceServiceInterval
                  ? parseInt(formData.maintenanceServiceInterval)
                  : undefined,
              }
            : undefined,
        documents:
          formData.soatNumber.trim() ||
          formData.soatExpiration.trim() ||
          formData.technicalReviewNumber.trim() ||
          formData.technicalReviewExpiration.trim()
            ? {
                soat:
                  formData.soatNumber.trim() || formData.soatExpiration.trim()
                    ? {
                        number: formData.soatNumber.trim() || undefined,
                        expiration: formData.soatExpiration || undefined,
                }
              : undefined,
                technicalReview:
                  formData.technicalReviewNumber.trim() ||
                  formData.technicalReviewExpiration.trim()
                    ? {
                        number: formData.technicalReviewNumber.trim() || undefined,
                        expiration: formData.technicalReviewExpiration || undefined,
                      }
                    : undefined,
              }
            : undefined,
        notes: formData.notes.trim() || undefined,
      }

      const vehiclePayload = {
        name: formData.name.trim(),
        data: vehicleData,
      }

      if (editingId) {
        // Editar vehículo existente
        await api.updateVehicle(editingId, vehiclePayload)
        showNotification('Vehículo actualizado exitosamente', 'success')
    setEditingId(null)
      } else {
        // Agregar nuevo vehículo
        await api.createVehicle(vehiclePayload)
        showNotification('Vehículo agregado exitosamente', 'success')
      }

      // Recargar vehículos desde la API
      await loadRecords()

      // Limpiar formulario y cerrar modal
      setFormData({
        name: '',
        type: '',
        brand: '',
        model: '',
        year: '',
        plate: '',
        color: '',
        vin: '',
        mileage: '',
        fuelType: '',
        insuranceCompany: '',
        insurancePolicyNumber: '',
        insuranceExpirationDate: '',
        insuranceCoverage: '',
        maintenanceLastService: '',
        maintenanceNextService: '',
        maintenanceServiceInterval: '',
        soatNumber: '',
        soatExpiration: '',
        technicalReviewNumber: '',
        technicalReviewExpiration: '',
        notes: '',
      })
      setShowFormModal(false)
    } catch (err: any) {
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

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      name: vehicle.name,
      type: vehicle.data.type || '',
      brand: vehicle.data.brand || '',
      model: vehicle.data.model || '',
      year: vehicle.data.year ? vehicle.data.year.toString() : '',
      plate: vehicle.data.plate || '',
      color: vehicle.data.color || '',
      vin: vehicle.data.vin || '',
      mileage: vehicle.data.mileage ? vehicle.data.mileage.toString() : '',
      fuelType: vehicle.data.fuelType || '',
      insuranceCompany: vehicle.data.insurance?.company || '',
      insurancePolicyNumber: vehicle.data.insurance?.policyNumber || '',
      insuranceExpirationDate: vehicle.data.insurance?.expirationDate || '',
      insuranceCoverage: vehicle.data.insurance?.coverage || '',
      maintenanceLastService: vehicle.data.maintenance?.lastService || '',
      maintenanceNextService: vehicle.data.maintenance?.nextService || '',
      maintenanceServiceInterval: vehicle.data.maintenance?.serviceInterval
        ? vehicle.data.maintenance.serviceInterval.toString()
        : '',
      soatNumber: vehicle.data.documents?.soat?.number || '',
      soatExpiration: vehicle.data.documents?.soat?.expiration || '',
      technicalReviewNumber: vehicle.data.documents?.technicalReview?.number || '',
      technicalReviewExpiration: vehicle.data.documents?.technicalReview?.expiration || '',
      notes: vehicle.data.notes || '',
    })
    setEditingId(vehicle.id)
    setShowFormModal(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      type: '',
      brand: '',
      model: '',
      year: '',
      plate: '',
      color: '',
      vin: '',
      mileage: '',
      fuelType: '',
      insuranceCompany: '',
      insurancePolicyNumber: '',
      insuranceExpirationDate: '',
      insuranceCoverage: '',
      maintenanceLastService: '',
      maintenanceNextService: '',
      maintenanceServiceInterval: '',
      soatNumber: '',
      soatExpiration: '',
      technicalReviewNumber: '',
      technicalReviewExpiration: '',
      notes: '',
    })
    setShowFormModal(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el vehículo "${name}"?`)) {
      return
    }

    try {
      await api.deleteVehicle(id)
      showNotification('Vehículo eliminado exitosamente', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el vehículo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content vehiculos-content">
        {/* Toolbar */}
        <div className="vehiculos-toolbar">
          <button
            className="vehiculos-toolbar-button"
            onClick={() => navigate('/registros')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="vehiculos-toolbar-icon" />
          </button>
          <div className="vehiculos-toolbar-menu-container" ref={menuRef}>
          <button
              className="vehiculos-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <MoreVertIcon className="vehiculos-toolbar-icon" />
            </button>
            {isMenuOpen && (
              <div className="vehiculos-menu">
                <button
                  className="vehiculos-menu-item"
            onClick={() => {
                    setIsMenuOpen(false)
                    setShowFormModal(true)
            }}
            type="button"
          >
                  <AddIcon className="vehiculos-menu-icon" />
                  <span>Agregar Vehículo</span>
          </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    className="vehiculos-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsDebugModalOpen(true)
                    }}
                    type="button"
                  >
                    <span>🐛 Debug</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h1 className="vehiculos-page-title">Vehículos</h1>
        <p className="vehiculos-page-subtitle">
          Gestiona la información de tus vehículos: marca, modelo, placa, año, mantenimientos, seguros y más
        </p>

        {/* Modal de Formulario */}
        {showFormModal && (
          <div className="vehiculos-modal-overlay" onClick={() => handleCancelEdit()}>
            <div className="vehiculos-modal vehiculos-modal-large" onClick={e => e.stopPropagation()}>
              <div className="vehiculos-modal-header">
                <h2 className="vehiculos-modal-title">
                  {editingId ? 'Editar Vehículo' : 'Agregar Vehículo'}
          </h2>
                <button
                  className="vehiculos-modal-close"
                  onClick={() => handleCancelEdit()}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="vehiculos-modal-content">
                <form onSubmit={handleSubmit} className="vehiculos-form">
            <div className="vehiculos-form-group">
              <label htmlFor="name" className="vehiculos-form-label">
                <DirectionsCarIcon className="vehiculos-label-icon" />
                Nombre del Vehículo *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="vehiculos-form-input"
                placeholder="Ej: Mi Carro Principal"
                required
              />
            </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="type" className="vehiculos-form-label">
                  Tipo de Vehículo
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Automóvil">Automóvil</option>
                  <option value="Moto">Moto</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="Camión">Camión</option>
                  <option value="Bus">Bus</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="brand" className="vehiculos-form-label">
                  Marca
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: Toyota"
                />
              </div>
              </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="model" className="vehiculos-form-label">
                  Modelo
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: Corolla"
                />
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="year" className="vehiculos-form-label">
                  Año
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="plate" className="vehiculos-form-label">
                  Placa
                </label>
                <input
                  type="text"
                  id="plate"
                  name="plate"
                  value={formData.plate}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: ABC123"
                />
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="color" className="vehiculos-form-label">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: Blanco"
                />
              </div>
            </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="vin" className="vehiculos-form-label">
                  VIN (Número de Chasis)
                </label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: 1HGBH41JXMN109186"
                />
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="mileage" className="vehiculos-form-label">
                  Kilometraje
                </label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="vehiculos-form-group">
              <label htmlFor="fuelType" className="vehiculos-form-label">
                <LocalGasStationIcon className="vehiculos-label-icon" />
                Tipo de Combustible
              </label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="vehiculos-form-input"
              >
                <option value="">Seleccionar...</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Gas Natural">Gas Natural</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="vehiculos-form-section-divider">
              <h3 className="vehiculos-form-subsection-title">
                <SecurityIcon className="vehiculos-label-icon" />
                Seguro
              </h3>
            </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="insuranceCompany" className="vehiculos-form-label">
                  Compañía de Seguros
                </label>
                <input
                  type="text"
                  id="insuranceCompany"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: Seguros XYZ"
                />
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="insurancePolicyNumber" className="vehiculos-form-label">
                  Número de Póliza
                </label>
                <input
                  type="text"
                  id="insurancePolicyNumber"
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: POL-123456"
                />
              </div>
            </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="insuranceExpirationDate" className="vehiculos-form-label">
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  id="insuranceExpirationDate"
                  name="insuranceExpirationDate"
                  value={formData.insuranceExpirationDate}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                />
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="insuranceCoverage" className="vehiculos-form-label">
                  Cobertura
                </label>
                <input
                  type="text"
                  id="insuranceCoverage"
                  name="insuranceCoverage"
                  value={formData.insuranceCoverage}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: Todo Riesgo"
                />
              </div>
            </div>

            <div className="vehiculos-form-section-divider">
              <h3 className="vehiculos-form-subsection-title">
                <BuildIcon className="vehiculos-label-icon" />
                Mantenimiento
              </h3>
            </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="maintenanceLastService" className="vehiculos-form-label">
                  Último Servicio
              </label>
              <input
                  type="date"
                  id="maintenanceLastService"
                  name="maintenanceLastService"
                  value={formData.maintenanceLastService}
                onChange={handleChange}
                  className="vehiculos-form-input"
              />
            </div>

              <div className="vehiculos-form-group">
                <label htmlFor="maintenanceNextService" className="vehiculos-form-label">
                  Próximo Servicio
                </label>
                <input
                  type="date"
                  id="maintenanceNextService"
                  name="maintenanceNextService"
                  value={formData.maintenanceNextService}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                />
              </div>
            </div>

            <div className="vehiculos-form-group">
              <label htmlFor="maintenanceServiceInterval" className="vehiculos-form-label">
                Intervalo de Servicio (km)
              </label>
              <input
                type="number"
                id="maintenanceServiceInterval"
                name="maintenanceServiceInterval"
                value={formData.maintenanceServiceInterval}
                onChange={handleChange}
                className="vehiculos-form-input"
                placeholder="Ej: 10000"
                min="0"
                step="1000"
              />
            </div>

            <div className="vehiculos-form-section-divider">
              <h3 className="vehiculos-form-subsection-title">
                <DescriptionIcon className="vehiculos-label-icon" />
                Documentos
              </h3>
            </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="soatNumber" className="vehiculos-form-label">
                  SOAT - Número
                </label>
                <input
                  type="text"
                  id="soatNumber"
                  name="soatNumber"
                  value={formData.soatNumber}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: SOAT-789012"
                />
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="soatExpiration" className="vehiculos-form-label">
                  SOAT - Expiración
                </label>
                <input
                  type="date"
                  id="soatExpiration"
                  name="soatExpiration"
                  value={formData.soatExpiration}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                />
              </div>
              </div>

            <div className="vehiculos-form-row">
              <div className="vehiculos-form-group">
                <label htmlFor="technicalReviewNumber" className="vehiculos-form-label">
                  Revisión Técnica - Número
                </label>
                <input
                  type="text"
                  id="technicalReviewNumber"
                  name="technicalReviewNumber"
                  value={formData.technicalReviewNumber}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                  placeholder="Ej: RT-345678"
                />
              </div>

              <div className="vehiculos-form-group">
                <label htmlFor="technicalReviewExpiration" className="vehiculos-form-label">
                  Revisión Técnica - Expiración
                </label>
                <input
                  type="date"
                  id="technicalReviewExpiration"
                  name="technicalReviewExpiration"
                  value={formData.technicalReviewExpiration}
                  onChange={handleChange}
                  className="vehiculos-form-input"
                />
              </div>
            </div>

            <div className="vehiculos-form-group">
              <label htmlFor="notes" className="vehiculos-form-label">
                Notas
              </label>
              <input
                type="text"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="vehiculos-form-input"
                placeholder="Ej: Vehículo en buen estado, mantenimiento al día"
              />
            </div>

            <div className="vehiculos-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="vehiculos-form-button vehiculos-form-button-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="vehiculos-form-button vehiculos-form-button-primary"
              >
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
            </div>
          </div>
        )}

        {/* Estado de carga */}
        {isLoading ? (
          <div className="vehiculos-empty-state">
            <p className="vehiculos-empty-text">Cargando vehículos...</p>
            </div>
        ) : error ? (
          <div className="vehiculos-empty-state">
            <p className="vehiculos-empty-text">{error}</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="vehiculos-empty-state">
            <p className="vehiculos-empty-text">No hay vehículos agregados</p>
            <p className="vehiculos-empty-text">Agrega tu primer vehículo usando el botón del menú</p>
          </div>
        ) : (
          <div className="vehiculos-list-section">
            <h2 className="vehiculos-section-title">
              Vehículos ({vehicles.length})
              </h2>
            <div className="vehiculos-list">
              {vehicles.map(vehicle => (
                <div 
                  key={vehicle.id} 
                  className="vehiculos-item"
                  onClick={() => {
                    setSelectedVehicle(vehicle)
                    setShowDetailModal(true)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="vehiculos-item-content">
                    <div className="vehiculos-item-header">
                      <h3 className="vehiculos-item-name">{vehicle.name}</h3>
                      {vehicle.data.year && (
                        <span className="vehiculos-item-year">
                          {vehicle.data.year}
                        </span>
                      )}
                    </div>
                    <div className="vehiculos-item-meta">
                      {vehicle.data.brand && vehicle.data.model && (
                        <>
                          <span className="vehiculos-item-meta-item">
                            <strong>{vehicle.data.brand} {vehicle.data.model}</strong>
                          </span>
                        </>
                      )}
                      {vehicle.data.plate && (
                        <>
                          <span className="vehiculos-item-separator">•</span>
                          <span className="vehiculos-item-meta-item">
                            <strong>Placa:</strong> {vehicle.data.plate}
                          </span>
                        </>
                      )}
                      {vehicle.data.type && (
                        <>
                          <span className="vehiculos-item-separator">•</span>
                          <span className="vehiculos-item-meta-item">
                            <strong>Tipo:</strong> {vehicle.data.type}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="vehiculos-item-details">
                      {vehicle.data.mileage && (
                        <div className="vehiculos-item-detail">
                          <span><strong>Kilometraje:</strong> {vehicle.data.mileage.toLocaleString('es-CO')} km</span>
                        </div>
                      )}
                      {vehicle.data.fuelType && (
                        <div className="vehiculos-item-detail">
                          <LocalGasStationIcon className="vehiculos-item-detail-icon" />
                          <span>{vehicle.data.fuelType}</span>
                        </div>
                      )}
                      {vehicle.data.color && (
                        <div className="vehiculos-item-detail">
                          <span><strong>Color:</strong> {vehicle.data.color}</span>
                        </div>
                      )}
                      {vehicle.data.insurance?.expirationDate && (
                        <div className="vehiculos-item-detail">
                          <SecurityIcon className="vehiculos-item-detail-icon" />
                          <span>Seguro vence: {new Date(vehicle.data.insurance.expirationDate).toLocaleDateString('es-CO')}</span>
                        </div>
                      )}
                      {vehicle.data.maintenance?.nextService && (
                        <div className="vehiculos-item-detail">
                          <BuildIcon className="vehiculos-item-detail-icon" />
                          <span>Próximo servicio: {new Date(vehicle.data.maintenance.nextService).toLocaleDateString('es-CO')}</span>
                    </div>
                      )}
                  </div>
                  </div>
                  <div className="vehiculos-item-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="vehiculos-item-action-button"
                      onClick={() => {
                        handleEdit(vehicle)
                        setShowDetailModal(false)
                      }}
                      aria-label="Editar"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="vehiculos-item-action-button vehiculos-item-action-button-delete"
                      onClick={() => handleDelete(vehicle.id, vehicle.name)}
                      aria-label="Eliminar"
                      type="button"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Detalle */}
        {showDetailModal && selectedVehicle && (
          <div className="vehiculos-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="vehiculos-modal vehiculos-modal-large" onClick={e => e.stopPropagation()}>
              <div className="vehiculos-modal-header">
                <h2 className="vehiculos-modal-title">Detalle del Vehículo</h2>
                <button
                  className="vehiculos-modal-close"
                  onClick={() => setShowDetailModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="vehiculos-modal-content">
                {/* Información Básica */}
                <div className="vehiculos-detail-section">
                  <h3 className="vehiculos-detail-section-title">Información Básica</h3>
                  <div className="vehiculos-detail-grid">
                    <div className="vehiculos-detail-item">
                      <span className="vehiculos-detail-label">Nombre:</span>
                      <span className="vehiculos-detail-value">{selectedVehicle.name}</span>
                    </div>
                    {selectedVehicle.data.brand && selectedVehicle.data.model && (
                      <div className="vehiculos-detail-item">
                        <span className="vehiculos-detail-label">Marca y Modelo:</span>
                        <span className="vehiculos-detail-value">{selectedVehicle.data.brand} {selectedVehicle.data.model}</span>
                      </div>
                    )}
                    {selectedVehicle.data.year && (
                      <div className="vehiculos-detail-item">
                        <span className="vehiculos-detail-label">Año:</span>
                        <span className="vehiculos-detail-value">{selectedVehicle.data.year}</span>
                      </div>
                    )}
                    {selectedVehicle.data.plate && (
                      <div className="vehiculos-detail-item">
                        <span className="vehiculos-detail-label">Placa:</span>
                        <span className="vehiculos-detail-value">{selectedVehicle.data.plate}</span>
                      </div>
                    )}
                    {selectedVehicle.data.type && (
                      <div className="vehiculos-detail-item">
                        <span className="vehiculos-detail-label">Tipo:</span>
                        <span className="vehiculos-detail-value">{selectedVehicle.data.type}</span>
                      </div>
                    )}
                    {selectedVehicle.data.color && (
                      <div className="vehiculos-detail-item">
                        <span className="vehiculos-detail-label">Color:</span>
                        <span className="vehiculos-detail-value">{selectedVehicle.data.color}</span>
                      </div>
                    )}
                    {selectedVehicle.data.mileage && (
                      <div className="vehiculos-detail-item">
                        <span className="vehiculos-detail-label">Kilometraje:</span>
                        <span className="vehiculos-detail-value">{selectedVehicle.data.mileage.toLocaleString('es-CO')} km</span>
                      </div>
                    )}
                    {selectedVehicle.data.fuelType && (
                      <div className="vehiculos-detail-item">
                        <span className="vehiculos-detail-label">Combustible:</span>
                        <span className="vehiculos-detail-value">{selectedVehicle.data.fuelType}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Eventos */}
                <div className="vehiculos-detail-section">
                  <h3 className="vehiculos-detail-section-title">
                    <ReportProblemIcon className="vehiculos-detail-section-icon" />
                    Eventos
                  </h3>
                  <div className="vehiculos-detail-form-group">
                    <div className="vehiculos-form-row">
                      <div className="vehiculos-form-group">
                        <label className="vehiculos-form-label">Tipo de Evento *</label>
                        <select
                          value={eventForm.type}
                          onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                          className="vehiculos-form-input"
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
                      <div className="vehiculos-form-group">
                        <label className="vehiculos-form-label">Fecha *</label>
                        <input
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                          className="vehiculos-form-input"
                        />
                      </div>
                    </div>
                    <div className="vehiculos-form-group">
                      <label className="vehiculos-form-label">Descripción</label>
                  <input
                    type="text"
                        value={eventForm.description}
                        onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                        className="vehiculos-form-input"
                        placeholder="Ej: Rayón en puerta delantera derecha"
                  />
                </div>
                    <div className="vehiculos-form-group">
                      <label className="vehiculos-form-label">Ubicación del Daño en el Vehículo</label>
                      <input
                        type="text"
                        value={eventForm.location}
                        onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                        className="vehiculos-form-input"
                        placeholder="Ej: Puerta delantera derecha, Parabrisas, Llanta trasera izquierda, etc."
                      />
                    </div>
                    <div className="vehiculos-form-row">
                      <div className="vehiculos-form-group">
                        <label className="vehiculos-form-label">Precio del Arreglo/Compra (COP)</label>
                        <input
                          type="number"
                          value={eventForm.cost}
                          onChange={(e) => setEventForm(prev => ({ ...prev, cost: e.target.value }))}
                          className="vehiculos-form-input"
                          min="0"
                          step="1000"
                          placeholder="0"
                        />
                      </div>
                      <div className="vehiculos-form-group">
                        <label className="vehiculos-form-label">Taller/Sitio del Arreglo</label>
                        <input
                          type="text"
                          value={eventForm.repairShop}
                          onChange={(e) => setEventForm(prev => ({ ...prev, repairShop: e.target.value }))}
                          className="vehiculos-form-input"
                          placeholder="Ej: Taller ABC, Autopartes XYZ, etc."
                        />
                      </div>
                    </div>
                    <div className="vehiculos-form-group">
                      <label className="vehiculos-form-label">Sitio de Compra (si aplica)</label>
                      <input
                        type="text"
                        value={eventForm.purchasePlace}
                        onChange={(e) => setEventForm(prev => ({ ...prev, purchasePlace: e.target.value }))}
                        className="vehiculos-form-input"
                        placeholder="Ej: Repuestos ABC, Tienda XYZ, Online, etc."
                      />
                    </div>
                    <div className="vehiculos-form-group">
                      <label className="vehiculos-form-label">Notas</label>
                      <input
                        type="text"
                        value={eventForm.notes}
                        onChange={(e) => setEventForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="vehiculos-form-input"
                        placeholder="Notas adicionales"
                      />
                    </div>
                  <button
                    type="button"
                      className="vehiculos-form-button vehiculos-form-button-primary"
                      onClick={async () => {
                        if (!eventForm.type || !eventForm.date) {
                          showNotification('Debes ingresar tipo y fecha del evento', 'error')
                          return
                        }
                        try {
                          const events = selectedVehicle.data.events || []
                          const newEvents = [...events, {
                            type: eventForm.type,
                            date: eventForm.date,
                            description: eventForm.description || undefined,
                            location: eventForm.location || undefined,
                            cost: eventForm.cost ? parseFloat(eventForm.cost) : undefined,
                            repairShop: eventForm.repairShop || undefined,
                            purchasePlace: eventForm.purchasePlace || undefined,
                            notes: eventForm.notes || undefined,
                          }]

                          await api.updateVehicle(selectedVehicle.id, {
                            data: {
                              ...selectedVehicle.data,
                              events: newEvents,
                            },
                          })
                          showNotification('Evento registrado exitosamente', 'success')
                          setEventForm({ type: '', date: '', description: '', location: '', cost: '', repairShop: '', purchasePlace: '', notes: '' })
                          await loadRecords()
                          const updated = vehicles.find(v => v.id === selectedVehicle.id)
                          if (updated) {
                            setSelectedVehicle(updated)
                          }
                        } catch (err: any) {
                          const errorMessage = getTranslatedErrorMessage(
                            err,
                            'Error al registrar el evento. Por favor, intenta de nuevo.'
                          )
                          showNotification(errorMessage, 'error')
                        }
                      }}
                    >
                      Agregar Evento
                  </button>
                  </div>
                  {selectedVehicle.data.events && selectedVehicle.data.events.length > 0 && (
                    <div className="vehiculos-detail-list">
                      {selectedVehicle.data.events.map((event, index) => (
                        <div key={index} className="vehiculos-detail-list-item">
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
                                <span className="vehiculos-detail-list-item-notes">Ubicación del daño: {event.location}</span>
                              )}
                              {event.cost && (
                                <span className="vehiculos-detail-list-item-hours">
                                  Precio: ${event.cost.toLocaleString('es-CO')}
                                </span>
                              )}
                              {event.repairShop && (
                                <span className="vehiculos-detail-list-item-notes">Taller: {event.repairShop}</span>
                              )}
                              {event.purchasePlace && (
                                <span className="vehiculos-detail-list-item-notes">Sitio de compra: {event.purchasePlace}</span>
                              )}
                              {event.notes && (
                                <span className="vehiculos-detail-list-item-notes">{event.notes}</span>
                              )}
                            </div>
                          </div>
                  <button
                    type="button"
                            className="vehiculos-detail-list-item-delete"
                            onClick={async () => {
                              try {
                                const events = selectedVehicle.data.events || []
                                const updatedEvents = events.filter((_, i) => i !== index)

                                await api.updateVehicle(selectedVehicle.id, {
                                  data: {
                                    ...selectedVehicle.data,
                                    events: updatedEvents,
                                  },
                                })
                                showNotification('Evento eliminado', 'success')
                                await loadRecords()
                                const updated = vehicles.find(v => v.id === selectedVehicle.id)
                                if (updated) {
                                  setSelectedVehicle(updated)
                                }
                              } catch (err: any) {
                                const errorMessage = getTranslatedErrorMessage(
                                  err,
                                  'Error al eliminar el evento. Por favor, intenta de nuevo.'
                                )
                                showNotification(errorMessage, 'error')
                              }
                            }}
                          >
                            <DeleteIcon />
                  </button>
                </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && (
          <div className="vehiculos-modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
            <div className="vehiculos-modal" onClick={e => e.stopPropagation()}>
              <div className="vehiculos-modal-header">
                <h2 className="vehiculos-modal-title">🐛 Debug - Vehículos</h2>
                <button
                  className="vehiculos-modal-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="vehiculos-modal-content">
                <div className="debug-options">
                          <button
                    className="debug-option-button create-demo"
                    onClick={async () => {
                      try {
                        setIsDebugLoading(true)
                        const demoVehicles = [
                          {
                            name: 'Toyota Corolla 2020',
                            data: {
                              type: 'Automóvil',
                              brand: 'Toyota',
                              model: 'Corolla',
                              year: 2020,
                              plate: 'ABC123',
                              color: 'Blanco',
                              vin: '1HGBH41JXMN109186',
                              mileage: 45000,
                              fuelType: 'Gasolina',
                              insurance: {
                                company: 'Seguros XYZ',
                                policyNumber: 'POL-123456',
                                expirationDate: '2023-12-31', // Vencido
                                coverage: 'Todo Riesgo',
                              },
                              maintenance: {
                                lastService: '2024-01-15',
                                nextService: '2024-07-15',
                                serviceInterval: 10000,
                              },
                              documents: {
                                soat: {
                                  number: 'SOAT-789012',
                                  expiration: '2024-12-31',
                                },
                                technicalReview: {
                                  number: 'RT-345678',
                                  expiration: '2023-06-30', // Vencido
                                },
                              },
                              notes: 'Vehículo en excelente estado - Seguro y revisión técnica vencidos',
                            },
                          },
                          {
                            name: 'Honda CB650R',
                            data: {
                              type: 'Moto',
                              brand: 'Honda',
                              model: 'CB650R',
                              year: 2022,
                              plate: 'XYZ789',
                              color: 'Negro',
                              vin: 'JH2SC5900CK200001',
                              mileage: 12000,
                              fuelType: 'Gasolina',
                              insurance: {
                                company: 'Seguros ABC',
                                policyNumber: 'POL-789012',
                                expirationDate: '2024-11-30',
                                coverage: 'Responsabilidad Civil',
                              },
                              maintenance: {
                                lastService: '2024-03-20',
                                nextService: '2024-09-20',
                                serviceInterval: 6000,
                              },
                              documents: {
                                soat: {
                                  number: 'SOAT-345678',
                                  expiration: '2024-11-30',
                                },
                              },
                            },
                          },
                          {
                            name: 'Ford Ranger 2021',
                            data: {
                              type: 'Camioneta',
                              brand: 'Ford',
                              model: 'Ranger',
                              year: 2021,
                              plate: 'DEF456',
                              color: 'Gris',
                              vin: '1FTFW1ET5MFA12345',
                              mileage: 35000,
                              fuelType: 'Diesel',
                              insurance: {
                                company: 'Seguros DEF',
                                policyNumber: 'POL-456789',
                                expirationDate: '2025-01-15',
                                coverage: 'Todo Riesgo',
                              },
                              maintenance: {
                                lastService: '2024-02-10',
                                nextService: '2024-08-10',
                                serviceInterval: 15000,
                              },
                              documents: {
                                soat: {
                                  number: 'SOAT-901234',
                                  expiration: '2025-01-15',
                                },
                                technicalReview: {
                                  number: 'RT-567890',
                                  expiration: '2025-03-31',
                                },
                              },
                            },
                          },
                        ]

                        // Guardar cada vehículo en la API
                        for (const veh of demoVehicles) {
                          await api.createVehicle({
                            name: veh.name,
                            data: veh.data,
                          })
                        }

                        showNotification(`${demoVehicles.length} vehículos demo creados exitosamente`, 'success')
                        await loadRecords()
                        setIsDebugModalOpen(false)
                      } catch (err: any) {
                        const errorMessage = getTranslatedErrorMessage(
                          err,
                          'Error al crear los vehículos demo. Por favor, intenta de nuevo.'
                        )
                        showNotification(errorMessage, 'error')
                      } finally {
                        setIsDebugLoading(false)
                      }
                    }}
                    disabled={isDebugLoading}
                            type="button"
                          >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Vehículos Demo</h3>
                      <p className="debug-option-description">
                        Crea 3 vehículos de ejemplo con diferentes configuraciones
                      </p>
                    </div>
                          </button>
                          <button
                    className="debug-option-button delete-all"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          '¿Estás seguro de que quieres eliminar TODOS los registros de vehículos? Esta acción es irreversible.'
                        )
                      ) {
                        return
                      }

                      try {
                        setIsDebugLoading(true)
                        await api.deleteAllVehicles()
                        showNotification('Todos los registros de vehículos han sido eliminados', 'success')
                        await loadRecords()
                        setVehicles([])
                        setIsDebugModalOpen(false)
                      } catch (err: any) {
                        const errorMessage = getTranslatedErrorMessage(
                          err,
                          'Error al eliminar los registros. Por favor, intenta de nuevo.'
                        )
                        showNotification(errorMessage, 'error')
                      } finally {
                        setIsDebugLoading(false)
                      }
                    }}
                    disabled={isDebugLoading}
                            type="button"
                          >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todos los Registros</h3>
                      <p className="debug-option-description">
                        Elimina todos los registros de vehículos guardados (irreversible)
                      </p>
              </div>
                          </button>
                        </div>
                      </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Vehiculos

