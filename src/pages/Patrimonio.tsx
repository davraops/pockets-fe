import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
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
      const response = await api.getPatrimony()
      if (response.items && Array.isArray(response.items)) {
        setRecords(response.items)
      }
    } catch (err: any) {
      console.error('Error al cargar registros de patrimonio:', err)
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
      showNotification('El nombre del item es requerido', 'error')
      return
    }

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

    if (editingId) {
      // Editar item existente
      const updatedPatrimonyItem: PatrimonyItem = {
        id: editingId,
        name: formData.name.trim(),
        data: patrimonyData,
      }
      setPatrimonyItems(prev =>
        prev.map(item => (item.id === editingId ? updatedPatrimonyItem : item))
      )
      setEditingId(null)
      showNotification('Item de Patrimonio actualizado', 'success')
    } else {
      // Agregar nuevo item
      const newPatrimonyItem: PatrimonyItem = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        data: patrimonyData,
      }
      setPatrimonyItems(prev => [...prev, newPatrimonyItem])
      showNotification('Item de Patrimonio agregado', 'success')
    }

    // Limpiar formulario
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
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este item de patrimonio?')) {
      setPatrimonyItems(prev => prev.filter(item => item.id !== id))
      showNotification('Item de Patrimonio eliminado', 'success')
    }
  }

  const handleSaveClick = () => {
    if (patrimonyItems.length === 0) {
      showNotification('Debes agregar al menos un item antes de guardar', 'error')
      return
    }
    setShowSaveModal(true)
  }

  const handleSaveRecord = async () => {
    if (!listName.trim()) {
      showNotification('El nombre de la lista es requerido', 'error')
      return
    }

    if (patrimonyItems.length === 0) {
      showNotification('Debes agregar al menos un item antes de guardar', 'error')
      return
    }

    try {
      setIsSaving(true)

      // Guardar toda la lista de patrimonio en un solo registro
      const patrimonyListData = {
        name: listName.trim(),
        data: {
          items: patrimonyItems.map(item => ({
            name: item.name,
            data: item.data,
          })),
          created_at: new Date().toISOString(),
        },
      }

      await api.createPatrimonyItem(patrimonyListData)

      showNotification('Lista de patrimonio guardada exitosamente', 'success')

      // Recargar lista de registros
      await loadRecords()

      // Cerrar modal y limpiar
      setShowSaveModal(false)
      setListName('')
      // Limpiar después de guardar (opcional)
      // setPatrimonyItems([])
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

  const handleLoadRecord = async (record: PatrimonyItemRecord) => {
    try {
      const response = await api.getPatrimony(record.id)
      if (response.items && response.items.length > 0) {
        const itemRecord = response.items[0]
        
        // Verificar si el registro tiene una lista de items
        if (itemRecord.data && itemRecord.data.items && Array.isArray(itemRecord.data.items)) {
          // Cargar la lista completa de items
          const loadedPatrimonyItems: PatrimonyItem[] = itemRecord.data.items.map((item: any, index: number) => ({
            id: Date.now().toString() + index.toString(),
            name: item.name || '',
            data: item.data || {},
          }))
          setPatrimonyItems(loadedPatrimonyItems)
          setListName(itemRecord.name)
        } else {
          // Formato antiguo: un solo item
          const loadedPatrimonyItem: PatrimonyItem = {
            id: itemRecord.id,
            name: itemRecord.name,
            data: itemRecord.data || {},
          }
          setPatrimonyItems([loadedPatrimonyItem])
          setListName(itemRecord.name)
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
      await api.deletePatrimonyItem(recordId)
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
          <button
            className="patrimonio-toolbar-button"
            onClick={() => {
              loadRecords()
              setShowRecordsModal(true)
            }}
            aria-label="Ver registros guardados"
            type="button"
          >
            <FolderIcon className="patrimonio-toolbar-icon" />
          </button>
        </div>

        <h1 className="patrimonio-page-title">Patrimonio</h1>
        <p className="patrimonio-page-subtitle">
          Gestiona tu inventario de items valiosos: fecha de compra, valor, características, observaciones y más
        </p>

        {/* Formulario para agregar patrimonio */}
        <div className="patrimonio-form-section">
          <h2 className="patrimonio-section-title">
            {editingId ? 'Editar Item de Patrimonio' : 'Agregar Item de Patrimonio'}
          </h2>
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

        {/* Lista de patrimonio */}
        {patrimonyItems.length > 0 && (
          <div className="patrimonio-list-section">
            <div className="patrimonio-section-header">
              <h2 className="patrimonio-section-title">
                Items de Patrimonio ({patrimonyItems.length})
              </h2>
              <button
                className="patrimonio-save-button"
                onClick={handleSaveClick}
                disabled={isSaving}
                type="button"
              >
                <SaveIcon className="patrimonio-save-icon" />
                {isSaving ? 'Guardando...' : 'Guardar Lista'}
              </button>
            </div>
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
                      onClick={() => handleDelete(item.id)}
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
          <div className="patrimonio-modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="patrimonio-modal" onClick={e => e.stopPropagation()}>
              <div className="patrimonio-modal-header">
                <h2 className="patrimonio-modal-title">Guardar Lista de Items de Patrimonio</h2>
                <button
                  className="patrimonio-modal-close"
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
              <div className="patrimonio-modal-content">
                <div className="patrimonio-form-group">
                  <label htmlFor="listName" className="patrimonio-form-label">
                    Nombre de la Lista *
                  </label>
                  <input
                    type="text"
                    id="listName"
                    name="listName"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="patrimonio-form-input"
                    placeholder="Ej: Item de Patrimonios 2024, Personal de Oficina..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRecord()
                      }
                    }}
                  />
                </div>
                <div className="patrimonio-form-actions">
                  <button
                    type="button"
                    className="patrimonio-form-button patrimonio-form-button-secondary"
                    onClick={() => {
                      setShowSaveModal(false)
                      setListName('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="patrimonio-form-button patrimonio-form-button-primary"
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
          <div className="patrimonio-modal-overlay" onClick={() => setShowRecordsModal(false)}>
            <div className="patrimonio-modal" onClick={e => e.stopPropagation()}>
              <div className="patrimonio-modal-header">
                <h2 className="patrimonio-modal-title">Registros Guardados</h2>
                <button
                  className="patrimonio-modal-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="patrimonio-modal-content">
                {isLoadingRecords ? (
                  <div className="patrimonio-modal-loading">Cargando...</div>
                ) : records.length === 0 ? (
                  <div className="patrimonio-modal-empty">No hay registros guardados</div>
                ) : (
                  <div className="patrimonio-records-list">
                    {records.map(record => (
                      <div key={record.id} className="patrimonio-record-item">
                        <div className="patrimonio-record-content">
                          <h3 className="patrimonio-record-name">{record.name}</h3>
                          <div className="patrimonio-record-meta">
                            {record.data && record.data.items && Array.isArray(record.data.items) ? (
                              <span>{record.data.items.length} item{record.data.items.length !== 1 ? 's' : ''}</span>
                            ) : (
                              <span>1 item</span>
                            )}
                          </div>
                          {record.created_at && (
                            <div className="patrimonio-record-date">
                              Creado:{' '}
                              {new Date(record.created_at).toLocaleDateString('es-CO')}
                            </div>
                          )}
                        </div>
                        <div className="patrimonio-record-actions">
                          <button
                            className="patrimonio-record-action-button"
                            onClick={() => handleLoadRecord(record)}
                            type="button"
                          >
                            Cargar
                          </button>
                          <button
                            className="patrimonio-record-action-button patrimonio-record-action-button-delete"
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

export default Patrimonio

