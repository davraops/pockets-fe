import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import BuildIcon from '@mui/icons-material/Build'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DescriptionIcon from '@mui/icons-material/Description'
import SecurityIcon from '@mui/icons-material/Security'
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
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [showRecordsModal, setShowRecordsModal] = useState(false)
  const [listName, setListName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoadingRecords(true)
      const response = await api.getVehicles()
      if (response.vehicles && Array.isArray(response.vehicles)) {
        setRecords(response.vehicles)
      }
    } catch (err: any) {
      console.error('Error al cargar registros de vehículos:', err)
    } finally {
      setIsLoadingRecords(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre del vehículo es requerido', 'error')
      return
    }

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

    if (editingId) {
      // Editar vehículo existente
      const updatedVehicle: Vehicle = {
        id: editingId,
        name: formData.name.trim(),
        data: vehicleData,
      }
      setVehicles(prev =>
        prev.map(veh => (veh.id === editingId ? updatedVehicle : veh))
      )
      setEditingId(null)
      showNotification('Vehículo actualizado', 'success')
    } else {
      // Agregar nuevo vehículo
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        data: vehicleData,
      }
      setVehicles(prev => [...prev, newVehicle])
      showNotification('Vehículo agregado', 'success')
    }

    // Limpiar formulario
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
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      setVehicles(prev => prev.filter(veh => veh.id !== id))
      showNotification('Vehículo eliminado', 'success')
    }
  }

  const handleSaveClick = () => {
    if (vehicles.length === 0) {
      showNotification('Debes agregar al menos un vehículo antes de guardar', 'error')
      return
    }
    setShowSaveModal(true)
  }

  const handleSaveRecord = async () => {
    if (!listName.trim()) {
      showNotification('El nombre de la lista es requerido', 'error')
      return
    }

    if (vehicles.length === 0) {
      showNotification('Debes agregar al menos un empleado antes de guardar', 'error')
      return
    }

    try {
      setIsSaving(true)

      // Guardar toda la lista de vehiculos en un solo registro
      const employeeListData = {
        name: listName.trim(),
        data: {
          vehicles: vehicles.map(emp => ({
            name: emp.name,
            data: emp.data,
          })),
          created_at: new Date().toISOString(),
        },
      }

      await api.createVehicle(employeeListData)

      showNotification('Lista de vehiculos guardada exitosamente', 'success')

      // Recargar lista de registros
      await loadRecords()

      // Cerrar modal y limpiar
      setShowSaveModal(false)
      setListName('')
      // Limpiar después de guardar (opcional)
      // setVehicles([])
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la lista. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadRecord = async (record: VehicleRecord) => {
    try {
      const response = await api.getVehicles(record.id)
      if (response.vehicles && response.vehicles.length > 0) {
        const vehicleRecord = response.vehicles[0]
        
        // Verificar si el registro tiene una lista de vehículos
        if (vehicleRecord.data && vehicleRecord.data.vehicles && Array.isArray(vehicleRecord.data.vehicles)) {
          // Cargar la lista completa de vehículos
          const loadedVehicles: Vehicle[] = vehicleRecord.data.vehicles.map((veh: any, index: number) => ({
            id: Date.now().toString() + index.toString(),
            name: veh.name || '',
            data: veh.data || {},
          }))
          setVehicles(loadedVehicles)
          setListName(vehicleRecord.name)
        } else {
          // Formato antiguo: un solo vehículo
          const loadedVehicle: Vehicle = {
            id: vehicleRecord.id,
            name: vehicleRecord.name,
            data: vehicleRecord.data || {},
          }
          setVehicles([loadedVehicle])
          setListName(vehicleRecord.name)
        }
        
        setShowRecordsModal(false)
        showNotification(`Lista "${record.name}" cargada`, 'success')
      } else {
        showNotification('El registro no tiene datos válidos', 'error')
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar el registro. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteRecord = async (recordId: string, recordName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el registro "${recordName}"?`)) {
      return
    }

    try {
      await api.deleteVehicle(recordId)
      showNotification('Registro eliminado', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el registro. Por favor, intenta de nuevo.'
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
          <button
            className="vehiculos-toolbar-button"
            onClick={() => {
              loadRecords()
              setShowRecordsModal(true)
            }}
            aria-label="Ver registros guardados"
            type="button"
          >
            <FolderIcon className="vehiculos-toolbar-icon" />
          </button>
        </div>

        <h1 className="vehiculos-page-title">Vehículos</h1>
        <p className="vehiculos-page-subtitle">
          Gestiona la información de tus vehículos: marca, modelo, placa, año, mantenimientos, seguros y más
        </p>

        {/* Formulario para agregar vehiculos */}
        <div className="vehiculos-form-section">
          <h2 className="vehiculos-section-title">
            {editingId ? 'Editar Vehículo' : 'Agregar Vehículo'}
          </h2>
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

        {/* Lista de vehiculos */}
        {vehicles.length > 0 && (
          <div className="vehiculos-list-section">
            <div className="vehiculos-section-header">
              <h2 className="vehiculos-section-title">
                Vehículos ({vehicles.length})
              </h2>
              <button
                className="vehiculos-save-button"
                onClick={handleSaveClick}
                disabled={isSaving}
                type="button"
              >
                <SaveIcon className="vehiculos-save-icon" />
                {isSaving ? 'Guardando...' : 'Guardar Lista'}
              </button>
            </div>
            <div className="vehiculos-list">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="vehiculos-item">
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
                  <div className="vehiculos-item-actions">
                    <button
                      className="vehiculos-item-action-button"
                      onClick={() => handleEdit(vehicle)}
                      aria-label="Editar"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="vehiculos-item-action-button vehiculos-item-action-button-delete"
                      onClick={() => handleDelete(vehicle.id)}
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

        {/* Modal para guardar lista */}
        {showSaveModal && (
          <div className="vehiculos-modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="vehiculos-modal" onClick={e => e.stopPropagation()}>
              <div className="vehiculos-modal-header">
                <h2 className="vehiculos-modal-title">Guardar Lista de Vehículos</h2>
                <button
                  className="vehiculos-modal-close"
                  onClick={() => {
                    setShowSaveModal(false)
                    setListName('')
                  }}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="vehiculos-modal-content">
                <div className="vehiculos-form-group">
                  <label htmlFor="listName" className="vehiculos-form-label">
                    Nombre de la Lista *
                  </label>
                  <input
                    type="text"
                    id="listName"
                    name="listName"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="vehiculos-form-input"
                    placeholder="Ej: Vehículos 2024, Personal de Oficina..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRecord()
                      }
                    }}
                  />
                </div>
                <div className="vehiculos-form-actions">
                  <button
                    type="button"
                    className="vehiculos-form-button vehiculos-form-button-secondary"
                    onClick={() => {
                      setShowSaveModal(false)
                      setListName('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="vehiculos-form-button vehiculos-form-button-primary"
                    onClick={handleSaveRecord}
                    disabled={isSaving || !listName.trim()}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de registros guardados */}
        {showRecordsModal && (
          <div className="vehiculos-modal-overlay" onClick={() => setShowRecordsModal(false)}>
            <div className="vehiculos-modal" onClick={e => e.stopPropagation()}>
              <div className="vehiculos-modal-header">
                <h2 className="vehiculos-modal-title">Registros Guardados</h2>
                <button
                  className="vehiculos-modal-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="vehiculos-modal-content">
                {isLoadingRecords ? (
                  <div className="vehiculos-modal-loading">Cargando...</div>
                ) : records.length === 0 ? (
                  <div className="vehiculos-modal-empty">No hay registros guardados</div>
                ) : (
                  <div className="vehiculos-records-list">
                    {records.map(record => (
                      <div key={record.id} className="vehiculos-record-item">
                        <div className="vehiculos-record-content">
                          <h3 className="vehiculos-record-name">{record.name}</h3>
                          <div className="vehiculos-record-meta">
                            {record.data && record.data.vehicles && Array.isArray(record.data.vehicles) ? (
                              <span>{record.data.vehicles.length} empleado{record.data.vehicles.length !== 1 ? 's' : ''}</span>
                            ) : (
                              <span>1 empleado</span>
                            )}
                          </div>
                          {record.created_at && (
                            <div className="vehiculos-record-date">
                              Creado:{' '}
                              {new Date(record.created_at).toLocaleDateString('es-CO')}
                            </div>
                          )}
                        </div>
                        <div className="vehiculos-record-actions">
                          <button
                            className="vehiculos-record-action-button"
                            onClick={() => handleLoadRecord(record)}
                            type="button"
                          >
                            Cargar
                          </button>
                          <button
                            className="vehiculos-record-action-button vehiculos-record-action-button-delete"
                            onClick={() => handleDeleteRecord(record.id, record.name)}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Vehiculos

