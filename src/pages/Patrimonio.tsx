import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import InventoryIcon from '@mui/icons-material/Inventory'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DescriptionIcon from '@mui/icons-material/Description'
import SecurityIcon from '@mui/icons-material/Security'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CategoryIcon from '@mui/icons-material/Category'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Patrimonio.css'

interface PatrimonyItem {
  id: string
  name: string
  data: {
    category?: string
    purchaseDate?: string
    purchaseValue?: number
    currency?: string
    description?: string
    brand?: string
    model?: string
    serialNumber?: string
    condition?: string
    currentValue?: number
    location?: string
    insurance?: {
      company?: string
      policyNumber?: string
      coverage?: number
    }
    photos?: string[]
    notes?: string
  }
  created_at?: string
  updated_at?: string
}

interface PatrimonyItemRecord {
  id: string
  name: string
  data: PatrimonyItem['data']
  created_at: string
  updated_at: string
}

function Patrimonio() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [patrimonyItems, setPatrimonyItems] = useState<PatrimonyItem[]>([])
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchaseDate: '',
    purchaseValue: '',
    currency: 'COP',
    description: '',
    brand: '',
    model: '',
    serialNumber: '',
    condition: '',
    currentValue: '',
    location: '',
    insuranceCompany: '',
    insurancePolicyNumber: '',
    insuranceCoverage: '',
    notes: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<PatrimonyItemRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadRecords()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getPatrimony()
      if (response.items && Array.isArray(response.items)) {
        setRecords(response.items)
        
        // Mapear cada item individual a la lista
        const mappedItems: PatrimonyItem[] = response.items.map((record: PatrimonyItemRecord) => ({
          id: record.id,
          name: record.name,
          data: record.data,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }))
        setPatrimonyItems(mappedItems)
      } else {
        setRecords([])
        setPatrimonyItems([])
      }
    } catch (err: any) {
      console.error('Error al cargar items de patrimonio:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar items de patrimonio. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setRecords([])
      setPatrimonyItems([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre del item es requerido', 'error')
      return
    }

    try {
      setIsSaving(true)

      const patrimonyData: PatrimonyItem['data'] = {
        category: formData.category.trim() || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchaseValue: formData.purchaseValue ? parseFloat(formData.purchaseValue) : undefined,
        currency: formData.currency.trim() || undefined,
        description: formData.description.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        model: formData.model.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        condition: formData.condition.trim() || undefined,
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
        location: formData.location.trim() || undefined,
        insurance:
          formData.insuranceCompany.trim() ||
          formData.insurancePolicyNumber.trim() ||
          formData.insuranceCoverage.trim()
            ? {
                company: formData.insuranceCompany.trim() || undefined,
                policyNumber: formData.insurancePolicyNumber.trim() || undefined,
                coverage: formData.insuranceCoverage ? parseFloat(formData.insuranceCoverage) : undefined,
              }
            : undefined,
        notes: formData.notes.trim() || undefined,
      }

      const patrimonyPayload = {
        name: formData.name.trim(),
        data: patrimonyData,
      }

      if (editingId) {
        // Editar item existente
        await api.updatePatrimonyItem(editingId, patrimonyPayload)
        showNotification('Item de Patrimonio actualizado exitosamente', 'success')
        setEditingId(null)
      } else {
        // Agregar nuevo item
        await api.createPatrimonyItem(patrimonyPayload)
        showNotification('Item de Patrimonio agregado exitosamente', 'success')
      }

      // Recargar items desde la API
      await loadRecords()

      // Limpiar formulario y cerrar modal
      setFormData({
        name: '',
        category: '',
        purchaseDate: '',
        purchaseValue: '',
        currency: 'COP',
        description: '',
        brand: '',
        model: '',
        serialNumber: '',
        condition: '',
        currentValue: '',
        location: '',
        insuranceCompany: '',
        insurancePolicyNumber: '',
        insuranceCoverage: '',
        notes: '',
      })
      setShowFormModal(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        editingId
          ? 'Error al actualizar el item. Por favor, intenta de nuevo.'
          : 'Error al agregar el item. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (item: PatrimonyItem) => {
    setFormData({
      name: item.name,
      category: item.data.category || '',
      purchaseDate: item.data.purchaseDate || '',
      purchaseValue: item.data.purchaseValue ? item.data.purchaseValue.toString() : '',
      currency: item.data.currency || 'COP',
      description: item.data.description || '',
      brand: item.data.brand || '',
      model: item.data.model || '',
      serialNumber: item.data.serialNumber || '',
      condition: item.data.condition || '',
      currentValue: item.data.currentValue ? item.data.currentValue.toString() : '',
      location: item.data.location || '',
      insuranceCompany: item.data.insurance?.company || '',
      insurancePolicyNumber: item.data.insurance?.policyNumber || '',
      insuranceCoverage: item.data.insurance?.coverage ? item.data.insurance.coverage.toString() : '',
      notes: item.data.notes || '',
    })
    setEditingId(item.id)
    setShowFormModal(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      category: '',
      purchaseDate: '',
      purchaseValue: '',
      currency: 'COP',
      description: '',
      brand: '',
      model: '',
      serialNumber: '',
      condition: '',
      currentValue: '',
      location: '',
      insuranceCompany: '',
      insurancePolicyNumber: '',
      insuranceCoverage: '',
      notes: '',
    })
    setShowFormModal(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el item "${name}"?`)) {
      return
    }

    try {
      await api.deletePatrimonyItem(id)
      showNotification('Item de Patrimonio eliminado exitosamente', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el item. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content patrimonio-content">
        {/* Toolbar */}
        <div className="patrimonio-toolbar">
          <button
            className="patrimonio-toolbar-button"
            onClick={() => navigate('/registros')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="patrimonio-toolbar-icon" />
          </button>
          <div className="patrimonio-toolbar-menu-container" ref={menuRef}>
            <button
              className="patrimonio-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <MoreVertIcon className="patrimonio-toolbar-icon" />
            </button>
            {isMenuOpen && (
              <div className="patrimonio-menu">
                <button
                  className="patrimonio-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setShowFormModal(true)
                  }}
                  type="button"
                >
                  <AddIcon className="patrimonio-menu-icon" />
                  <span>Agregar Item</span>
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    className="patrimonio-menu-item"
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

        <h1 className="patrimonio-page-title">Patrimonio</h1>
        <p className="patrimonio-page-subtitle">
          Gestiona tu inventario de items valiosos: fecha de compra, valor, características, observaciones y más
        </p>

        {/* Modal de Formulario */}
        {showFormModal && (
          <div className="patrimonio-modal-overlay" onClick={() => handleCancelEdit()}>
            <div className="patrimonio-modal patrimonio-modal-large" onClick={e => e.stopPropagation()}>
              <div className="patrimonio-modal-header">
                <h2 className="patrimonio-modal-title">
                  {editingId ? 'Editar Item de Patrimonio' : 'Agregar Item de Patrimonio'}
                </h2>
                <button
                  className="patrimonio-modal-close"
                  onClick={() => handleCancelEdit()}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="patrimonio-modal-content">
                <form onSubmit={handleSubmit} className="patrimonio-form">
            <div className="patrimonio-form-group">
              <label htmlFor="name" className="patrimonio-form-label">
                <InventoryIcon className="patrimonio-label-icon" />
                Nombre del Item *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="patrimonio-form-input"
                placeholder="Ej: Reloj Rolex Submariner"
                required
              />
            </div>

            <div className="patrimonio-form-row">
              <div className="patrimonio-form-group">
                <label htmlFor="category" className="patrimonio-form-label">
                  <CategoryIcon className="patrimonio-label-icon" />
                  Categoría
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="Ej: Relojes, Joyas, Arte, etc."
                />
              </div>

              <div className="patrimonio-form-group">
                <label htmlFor="purchaseDate" className="patrimonio-form-label">
                  <CalendarTodayIcon className="patrimonio-label-icon" />
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                />
              </div>
            </div>

            <div className="patrimonio-form-row">
              <div className="patrimonio-form-group">
                <label htmlFor="purchaseValue" className="patrimonio-form-label">
                  <AttachMoneyIcon className="patrimonio-label-icon" />
                  Valor de Compra
                </label>
                <input
                  type="number"
                  id="purchaseValue"
                  name="purchaseValue"
                  value={formData.purchaseValue}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="patrimonio-form-group">
                <label htmlFor="currency" className="patrimonio-form-label">
                  Moneda
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="patrimonio-form-group">
              <label htmlFor="description" className="patrimonio-form-label">
                <DescriptionIcon className="patrimonio-label-icon" />
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="patrimonio-form-input"
                placeholder="Descripción detallada del item..."
                rows={3}
              />
            </div>

            <div className="patrimonio-form-row">
              <div className="patrimonio-form-group">
                <label htmlFor="brand" className="patrimonio-form-label">
                  Marca
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="Ej: Rolex"
                />
              </div>

              <div className="patrimonio-form-group">
                <label htmlFor="model" className="patrimonio-form-label">
                  Modelo
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="Ej: Submariner Date"
                />
              </div>
            </div>

            <div className="patrimonio-form-row">
              <div className="patrimonio-form-group">
                <label htmlFor="serialNumber" className="patrimonio-form-label">
                  Número de Serie
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="Ej: M126610LN-0001"
                />
              </div>

              <div className="patrimonio-form-group">
                <label htmlFor="condition" className="patrimonio-form-label">
                  Condición
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Excelente">Excelente</option>
                  <option value="Muy Buena">Muy Buena</option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Necesita Reparación">Necesita Reparación</option>
                </select>
              </div>
            </div>

            <div className="patrimonio-form-row">
              <div className="patrimonio-form-group">
                <label htmlFor="currentValue" className="patrimonio-form-label">
                  <AttachMoneyIcon className="patrimonio-label-icon" />
                  Valor Actual (Estimado)
                </label>
                <input
                  type="number"
                  id="currentValue"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="patrimonio-form-group">
                <label htmlFor="location" className="patrimonio-form-label">
                  <LocationOnIcon className="patrimonio-label-icon" />
                  Ubicación
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="Ej: Casa, Caja fuerte, Banco"
                />
              </div>
            </div>

            <div className="patrimonio-form-section-divider">
              <h3 className="patrimonio-form-subsection-title">
                <SecurityIcon className="patrimonio-label-icon" />
                Seguro
              </h3>
            </div>

            <div className="patrimonio-form-row">
              <div className="patrimonio-form-group">
                <label htmlFor="insuranceCompany" className="patrimonio-form-label">
                  Compañía de Seguros
                </label>
                <input
                  type="text"
                  id="insuranceCompany"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="Ej: Seguros Premium"
                />
              </div>

              <div className="patrimonio-form-group">
                <label htmlFor="insurancePolicyNumber" className="patrimonio-form-label">
                  Número de Póliza
                </label>
                <input
                  type="text"
                  id="insurancePolicyNumber"
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={handleChange}
                  className="patrimonio-form-input"
                  placeholder="Ej: POL-123456"
                />
              </div>
            </div>

            <div className="patrimonio-form-group">
              <label htmlFor="insuranceCoverage" className="patrimonio-form-label">
                Cobertura (COP)
              </label>
              <input
                type="number"
                id="insuranceCoverage"
                name="insuranceCoverage"
                value={formData.insuranceCoverage}
                onChange={handleChange}
                className="patrimonio-form-input"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div className="patrimonio-form-group">
              <label htmlFor="notes" className="patrimonio-form-label">
                Notas
              </label>
              <input
                type="text"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="patrimonio-form-input"
                placeholder="Notas adicionales"
              />
            </div>

            <div className="patrimonio-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="patrimonio-form-button patrimonio-form-button-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="patrimonio-form-button patrimonio-form-button-primary"
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
          <div className="patrimonio-empty-state">
            <p className="patrimonio-empty-text">Cargando items de patrimonio...</p>
          </div>
        ) : error ? (
          <div className="patrimonio-empty-state">
            <p className="patrimonio-empty-text">{error}</p>
          </div>
        ) : patrimonyItems.length === 0 ? (
          <div className="patrimonio-empty-state">
            <p className="patrimonio-empty-text">No hay items de patrimonio agregados</p>
            <p className="patrimonio-empty-text">Agrega tu primer item usando el botón del menú</p>
          </div>
        ) : (
          <div className="patrimonio-list-section">
            <h2 className="patrimonio-section-title">
              Items de Patrimonio ({patrimonyItems.length})
            </h2>
            <div className="patrimonio-list">
              {patrimonyItems.map(item => (
                <div key={item.id} className="patrimonio-item">
                  <div className="patrimonio-item-content">
                    <div className="patrimonio-item-header">
                      <h3 className="patrimonio-item-name">{item.name}</h3>
                      {item.data.category && (
                        <span className="patrimonio-item-category">
                          {item.data.category}
                        </span>
                      )}
                    </div>
                    <div className="patrimonio-item-meta">
                      {item.data.brand && item.data.model && (
                        <>
                          <span className="patrimonio-item-meta-item">
                            <strong>{item.data.brand} {item.data.model}</strong>
                          </span>
                        </>
                      )}
                      {item.data.purchaseValue && (
                        <>
                          <span className="patrimonio-item-separator">•</span>
                          <span className="patrimonio-item-meta-item patrimonio-item-price">
                            <strong>Valor:</strong> {item.data.purchaseValue.toLocaleString('es-CO')} {item.data.currency || 'COP'}
                          </span>
                        </>
                      )}
                      {item.data.currentValue && (
                        <>
                          <span className="patrimonio-item-separator">•</span>
                          <span className="patrimonio-item-meta-item patrimonio-item-price">
                            <strong>Valor Actual:</strong> {item.data.currentValue.toLocaleString('es-CO')} {item.data.currency || 'COP'}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="patrimonio-item-details">
                      {item.data.purchaseDate && (
                        <div className="patrimonio-item-detail">
                          <CalendarTodayIcon className="patrimonio-item-detail-icon" />
                          <span>Comprado: {new Date(item.data.purchaseDate).toLocaleDateString('es-CO')}</span>
                        </div>
                      )}
                      {item.data.serialNumber && (
                        <div className="patrimonio-item-detail">
                          <span><strong>Serie:</strong> {item.data.serialNumber}</span>
                        </div>
                      )}
                      {item.data.condition && (
                        <div className="patrimonio-item-detail">
                          <span><strong>Condición:</strong> {item.data.condition}</span>
                        </div>
                      )}
                      {item.data.location && (
                        <div className="patrimonio-item-detail">
                          <LocationOnIcon className="patrimonio-item-detail-icon" />
                          <span>{item.data.location}</span>
                        </div>
                      )}
                      {item.data.insurance?.company && (
                        <div className="patrimonio-item-detail">
                          <SecurityIcon className="patrimonio-item-detail-icon" />
                          <span>Seguro: {item.data.insurance.company}</span>
                        </div>
                      )}
                      {item.data.description && (
                        <div className="patrimonio-item-detail">
                          <DescriptionIcon className="patrimonio-item-detail-icon" />
                          <span>{item.data.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="patrimonio-item-actions">
                    <button
                      className="patrimonio-item-action-button"
                      onClick={() => handleEdit(item)}
                      aria-label="Editar"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="patrimonio-item-action-button patrimonio-item-action-button-delete"
                      onClick={() => handleDelete(item.id, item.name)}
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

        {/* Modal de Debug */}
        {isDebugModalOpen && (
          <div className="patrimonio-modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
            <div className="patrimonio-modal" onClick={e => e.stopPropagation()}>
              <div className="patrimonio-modal-header">
                <h2 className="patrimonio-modal-title">🐛 Debug - Patrimonio</h2>
                <button
                  className="patrimonio-modal-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="patrimonio-modal-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button create-demo"
                    onClick={async () => {
                      try {
                        setIsDebugLoading(true)
                        const demoItems = [
                          {
                            name: 'Reloj Rolex Submariner',
                            data: {
                              category: 'Relojes',
                              purchaseDate: '2020-05-15',
                              purchaseValue: 15000000,
                              currency: 'COP',
                              description: 'Reloj de lujo submariner con caja de acero inoxidable',
                              brand: 'Rolex',
                              model: 'Submariner Date',
                              serialNumber: 'M126610LN-0001',
                              condition: 'Excelente',
                              currentValue: 18000000,
                              location: 'Caja fuerte',
                              insurance: {
                                company: 'Seguros Premium',
                                policyNumber: 'POL-ROLEX-001',
                                coverage: 20000000,
                              },
                              notes: 'Reloj en perfecto estado, con todos los papeles',
                            },
                          },
                          {
                            name: 'Laptop MacBook Pro 16"',
                            data: {
                              category: 'Electrónica',
                              purchaseDate: '2023-03-20',
                              purchaseValue: 12000000,
                              currency: 'COP',
                              description: 'MacBook Pro 16 pulgadas M2 Max, 32GB RAM, 1TB SSD',
                              brand: 'Apple',
                              model: 'MacBook Pro 16" M2 Max',
                              serialNumber: 'C02XK0ABCDEF',
                              condition: 'Muy Buena',
                              currentValue: 10000000,
                              location: 'Oficina',
                              notes: 'Equipo de trabajo principal',
                            },
                          },
                          {
                            name: 'Pintura Original',
                            data: {
                              category: 'Arte',
                              purchaseDate: '2019-11-10',
                              purchaseValue: 5000000,
                              currency: 'COP',
                              description: 'Pintura al óleo original de artista local',
                              condition: 'Buena',
                              currentValue: 7500000,
                              location: 'Casa',
                              insurance: {
                                company: 'Seguros Arte',
                                policyNumber: 'POL-ART-001',
                                coverage: 8000000,
                              },
                              notes: 'Valorizado por experto en 2023',
                            },
                          },
                        ]

                        // Guardar cada item en la API
                        for (const item of demoItems) {
                          await api.createPatrimonyItem({
                            name: item.name,
                            data: item.data,
                          })
                        }

                        showNotification(`${demoItems.length} items demo creados exitosamente`, 'success')
                        await loadRecords()
                        setIsDebugModalOpen(false)
                      } catch (err: any) {
                        const errorMessage = getTranslatedErrorMessage(
                          err,
                          'Error al crear los items demo. Por favor, intenta de nuevo.'
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
                      <h3 className="debug-option-title">Crear Items Demo</h3>
                      <p className="debug-option-description">
                        Crea 3 items de ejemplo con diferentes configuraciones
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button delete-all"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          '¿Estás seguro de que quieres eliminar TODOS los registros de patrimonio? Esta acción es irreversible.'
                        )
                      ) {
                        return
                      }

                      try {
                        setIsDebugLoading(true)
                        await api.deleteAllPatrimony()
                        showNotification('Todos los registros de patrimonio han sido eliminados', 'success')
                        await loadRecords()
                        setPatrimonyItems([])
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
                        Elimina todos los registros de patrimonio guardados (irreversible)
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

export default Patrimonio

