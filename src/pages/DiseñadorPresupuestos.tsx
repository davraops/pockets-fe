import { useState, useEffect, useRef } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
import RefreshIcon from '@mui/icons-material/Refresh'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import WarningIcon from '@mui/icons-material/Warning'
import SyncIcon from '@mui/icons-material/Sync'
import { api } from '../services/api'
import { devError, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import './DiseñadorPresupuestos.css'

interface BudgetItem {
  id: string
  name: string
  value: number
  category: string
}

interface CategoryTotal {
  category: string
  total: number
  items: BudgetItem[]
}

interface BudgetDraft {
  id: string
  name: string
  data: {
    items: BudgetItem[]
    categories?: Array<{
      name: string
      amount: number
      items_count: number
    }>
    total?: number
    created_at?: string
  }
  created_at: string
  updated_at: string
}

function DiseñadorPresupuestos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [items, setItems] = useState<BudgetItem[]>([])
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    category: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [drafts, setDrafts] = useState<BudgetDraft[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
  const [draftsLoadError, setDraftsLoadError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    calculateTotals()
  }, [items])

  useEffect(() => {
    loadDrafts()
  }, [])

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const calculateTotals = () => {
    // Obtener categorías únicas
    const uniqueCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean)))
    setCategories(uniqueCategories)

    // Calcular totales por categoría
    const totals: CategoryTotal[] = uniqueCategories.map(category => {
      const categoryItems = items.filter(item => item.category === category)
      const total = categoryItems.reduce((sum, item) => sum + item.value, 0)
      return {
        category,
        total,
        items: categoryItems,
      }
    })

    // Ordenar por total descendente
    totals.sort((a, b) => b.total - a.total)
    setCategoryTotals(totals)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.value || parseFloat(formData.value) <= 0) {
      showNotification('El valor debe ser mayor a 0', 'error')
      return
    }

    if (!formData.category.trim()) {
      showNotification('La categoría es requerida', 'error')
      return
    }

    if (editingId) {
      // Editar item existente
      setItems(prev =>
        prev.map(item =>
          item.id === editingId
            ? {
                ...item,
                name: formData.name.trim(),
                value: parseFloat(formData.value),
                category: formData.category.trim(),
              }
            : item
        )
      )
      setEditingId(null)
      showNotification('Item actualizado', 'success')
    } else {
      // Agregar nuevo item
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        value: parseFloat(formData.value),
        category: formData.category.trim(),
      }
      setItems(prev => [...prev, newItem])
      showNotification('Item agregado', 'success')
    }

    // Limpiar formulario
    setFormData({
      name: '',
      value: '',
      category: '',
    })
  }

  const handleEdit = (item: BudgetItem) => {
    setFormData({
      name: item.name,
      value: item.value.toString(),
      category: item.category,
    })
    setEditingId(item.id)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      value: '',
      category: '',
    })
  }

  const handleDelete = async (id: string) => {
    if ((await confirm({ message: '¿Estás seguro de que quieres eliminar este item?', variant: 'danger' }))) {
      setItems(prev => prev.filter(item => item.id !== id))
      showNotification('Item eliminado', 'success')
    }
  }

  const loadDrafts = async () => {
    try {
      setIsLoadingDrafts(true)
      setDraftsLoadError(null)
      const response = await api.getBudgetDrafts()
      if (response.drafts && Array.isArray(response.drafts)) {
        // Ordenar por fecha de creación (más recientes primero)
        const sortedDrafts = response.drafts.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })
        setDrafts(sortedDrafts)
      } else {
        setDrafts([])
      }
    } catch (err: any) {
      devError('Error al cargar borradores:', err)
      setDrafts([])
      setDraftsLoadError(
        getTranslatedErrorMessage(
          err,
          'Error al cargar los borradores. Por favor, intenta de nuevo.'
        )
      )
    } finally {
      setIsLoadingDrafts(false)
    }
  }

  const handleLoadDraft = (draft: BudgetDraft) => {
    if (draft.data && draft.data.items && Array.isArray(draft.data.items)) {
      setItems(draft.data.items)
      setDraftName(draft.name)
      setLoadedDraftId(draft.id)
      showNotification(`Borrador "${draft.name}" cargado`, 'success')
      // Scroll al inicio para ver los items cargados
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      showNotification('El borrador no tiene datos válidos', 'error')
    }
  }

  const handleDeleteDraft = async (draftId: string, draftName: string) => {
    if (!(await confirm({ message: `¿Estás seguro de que quieres eliminar el borrador "${draftName}"?`, variant: 'danger' }))) {
      return
    }

    try {
      await api.deleteBudgetDraft(draftId)
      if (loadedDraftId === draftId) {
        setLoadedDraftId(null)
      }
      showNotification('Borrador eliminado', 'success')
      await loadDrafts()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el borrador. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDebugCreateDrafts = async () => {
    if (!isDebugToolsEnabled()) return
    try {
      setIsDebugLoading(true)
      const demoDrafts = [
        {
          name: 'Presupuesto Mensual Demo',
          data: {
            items: [
              { id: '1', name: 'Alquiler', value: 1200000, category: 'Vivienda' },
              { id: '2', name: 'Servicios Públicos', value: 250000, category: 'Vivienda' },
              { id: '3', name: 'Supermercado', value: 800000, category: 'Alimentación' },
              { id: '4', name: 'Transporte', value: 300000, category: 'Transporte' },
              { id: '5', name: 'Entretenimiento', value: 200000, category: 'Ocio' },
            ],
          },
        },
        {
          name: 'Presupuesto Vacaciones',
          data: {
            items: [
              { id: '1', name: 'Vuelos', value: 2000000, category: 'Transporte' },
              { id: '2', name: 'Hotel', value: 1500000, category: 'Hospedaje' },
              { id: '3', name: 'Comidas', value: 800000, category: 'Alimentación' },
              { id: '4', name: 'Actividades', value: 500000, category: 'Ocio' },
            ],
          },
        },
        {
          name: 'Presupuesto Navidad',
          data: {
            items: [
              { id: '1', name: 'Regalos', value: 1500000, category: 'Regalos' },
              { id: '2', name: 'Decoración', value: 300000, category: 'Hogar' },
              { id: '3', name: 'Comida Navideña', value: 500000, category: 'Alimentación' },
            ],
          },
        },
      ]

      for (const draft of demoDrafts) {
        await api.createBudgetDraft(draft)
      }

      showNotification('Borradores demo creados exitosamente', 'success')
      await loadDrafts()
      setIsDebugModalOpen(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear borradores demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleDebugDeleteAll = async () => {
    if (!isDebugToolsEnabled()) return
    if (!(await confirm({ message: '¿Estás seguro de que quieres eliminar TODOS los borradores? Esta acción es irreversible.', variant: 'danger' }))) {
      return
    }

    try {
      setIsDebugLoading(true)
      await api.deleteAllBudgetDrafts()
      showNotification('Todos los borradores han sido eliminados', 'success')
      await loadDrafts()
      setIsDebugModalOpen(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar los borradores. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      showNotification('El nombre del borrador es requerido', 'error')
      return
    }

    if (items.length === 0) {
      showNotification('Debes agregar al menos un item antes de guardar', 'error')
      return
    }

    try {
      setIsSaving(true)

      // Preparar datos en formato JSON
      const draftData = {
        name: draftName.trim(),
        data: {
          items: items,
          categories: categoryTotals.map(ct => ({
            name: ct.category,
            amount: ct.total,
            items_count: ct.items.length,
          })),
          total: items.reduce((sum, item) => sum + item.value, 0),
          created_at: new Date().toISOString(),
        },
      }

      if (loadedDraftId) {
        await api.updateBudgetDraft(loadedDraftId, draftData)
        showNotification('Borrador actualizado exitosamente', 'success')
      } else {
        await api.createBudgetDraft(draftData)
        showNotification('Borrador guardado exitosamente', 'success')
      }
      
      // Recargar lista de borradores
      await loadDrafts()
      
      // Limpiar después de guardar (opcional - comentado para que el usuario pueda seguir editando)
      // setItems([])
      // setDraftName('')
      // setFormData({
      //   name: '',
      //   value: '',
      //   category: '',
      // })
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar el borrador. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const grandTotal = items.reduce((sum, item) => sum + item.value, 0)
  const uniqueCategories = new Set(items.map(item => item.category)).size

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content diseñador-content">
        {/* Toolbar */}
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/finanzas')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
          {isDebugToolsEnabled() && (
            <div className="app-toolbar-menu-container" ref={menuRef}>
              <button
                className="app-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
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
            </div>
          )}
        </div>

        <h1 className="app-page-title">Diseñador de Presupuestos</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen del diseñador"
          items={[
            { label: 'Items', value: items.length, tone: 'info' },
            { label: 'Categorías', value: uniqueCategories, tone: 'available' },
            {
              label: 'Total',
              value: formatCurrency(grandTotal),
              tone: 'expense',
              emphasis: true,
            },
            { label: 'Borradores', value: drafts.length, tone: 'info' },
          ]}
        />

        {/* Formulario para agregar items */}
        <div className="diseñador-form-section">
          <h2 className="app-section-title">
            {editingId ? 'Editar Item' : 'Agregar Item'}
          </h2>
          <form onSubmit={handleSubmit} className="diseñador-form">
            <div className="form-group-base form-group-base--compact">
              <label htmlFor="name" className="form-label-base form-label-base--inline">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input-base"
                placeholder="Ej: Arriendo, Comida, Transporte..."
                required
              />
            </div>

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="value" className="form-label-base form-label-base--inline">
                Valor (COP) *
              </label>
              <input
                type="number"
                id="value"
                name="value"
                value={formData.value}
                onChange={handleChange}
                className="form-input-base"
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="category" className="form-label-base form-label-base--inline">
                Categoría *
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input-base"
                placeholder="Ej: Vivienda, Alimentación, Transporte..."
                list="categories-list"
                required
              />
              <datalist id="categories-list">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="diseñador-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="diseñador-form-button diseñador-form-button-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="diseñador-form-button diseñador-form-button-primary"
              >
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de items */}
        {items.length > 0 && (
          <div className="diseñador-items-section">
            <h2 className="app-section-title">Items Agregados ({items.length})</h2>
            <div className="diseñador-items-list">
              {items.map(item => (
                <div key={item.id} className="diseñador-item">
                  <div className="diseñador-item-content">
                    <div className="diseñador-item-header">
                      <h3 className="diseñador-item-name">{item.name}</h3>
                      <span className="diseñador-item-value">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="diseñador-item-meta">
                      <span className="diseñador-item-category">{item.category}</span>
                    </div>
                  </div>
                  <div className="app-control-group diseñador-item-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(item)}
                      aria-label="Editar"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="btn-icon btn-icon--danger"
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

        {/* Totales por categoría */}
        {categoryTotals.length > 0 && (
          <div className="diseñador-totals-section">
            <h2 className="app-section-title">Totales por Categoría</h2>
            <div className="diseñador-totals-list">
              {categoryTotals.map(catTotal => (
                <div key={catTotal.category} className="diseñador-total-item">
                  <div className="diseñador-total-header">
                    <h3 className="diseñador-total-category">{catTotal.category}</h3>
                    <span className="diseñador-total-value">
                      {formatCurrency(catTotal.total)}
                    </span>
                  </div>
                  <p className="diseñador-total-items">
                    {catTotal.items.length} {catTotal.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              ))}
            </div>
            <div className="diseñador-grand-total">
              <span className="diseñador-grand-total-label">Total General:</span>
              <span className="diseñador-grand-total-value">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* Borradores Guardados */}
        {(drafts.length > 0 || draftsLoadError) && (
          <div className="diseñador-drafts-section">
            <div className="diseñador-section-header">
              <h2 className="app-section-title">
                Borradores Guardados{drafts.length > 0 ? ` (${drafts.length})` : ''}
              </h2>
              <button
                className="diseñador-refresh-button"
                onClick={loadDrafts}
                aria-label="Actualizar borradores"
                type="button"
                disabled={isLoadingDrafts}
              >
                <RefreshIcon className="diseñador-refresh-icon" />
              </button>
            </div>
            {isLoadingDrafts ? (
              <ListSkeleton variant="inset-row" count={3} aria-label="Cargando borradores" />
            ) : draftsLoadError && drafts.length === 0 ? (
              <div className="diseñador-empty-state diseñador-error-state" role="alert">
                <WarningIcon className="diseñador-error-icon" aria-hidden="true" />
                <p className="diseñador-empty-text">{draftsLoadError}</p>
                <button className="diseñador-retry-button" onClick={loadDrafts} type="button">
                  <SyncIcon aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            ) : (
              <div className="diseñador-drafts-list">
                {drafts.map(draft => (
                  <div key={draft.id} className="diseñador-draft-item">
                    <div
                      className="diseñador-draft-content"
                      onClick={() => handleLoadDraft(draft)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h3 className="diseñador-draft-name">{draft.name}</h3>
                      <div className="diseñador-draft-info">
                        {draft.data.items && (
                          <span className="diseñador-draft-meta">
                            {draft.data.items.length} {draft.data.items.length === 1 ? 'item' : 'items'}
                          </span>
                        )}
                        {draft.data.total && (
                          <>
                            <span className="diseñador-draft-separator">•</span>
                            <span className="diseñador-draft-meta">
                              {formatCurrency(draft.data.total)}
                            </span>
                          </>
                        )}
                        {draft.data.categories && draft.data.categories.length > 0 && (
                          <>
                            <span className="diseñador-draft-separator">•</span>
                            <span className="diseñador-draft-meta">
                              {draft.data.categories.length} {draft.data.categories.length === 1 ? 'categoría' : 'categorías'}
                            </span>
                          </>
                        )}
                      </div>
                      {draft.created_at && (
                        <p className="diseñador-draft-date">
                          Creado: {new Date(draft.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      className="diseñador-draft-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDraft(draft.id, draft.name)
                      }}
                      aria-label="Eliminar borrador"
                      type="button"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guardar borrador */}
        {items.length > 0 && (
          <div className="diseñador-save-section">
            <h2 className="app-section-title">Guardar Borrador</h2>
            <div className="diseñador-save-form">
              <input
                type="text"
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                className="form-input-base"
                placeholder="Nombre del borrador (ej: Presupuesto Enero 2024)"
              />
              <button
                className="diseñador-save-button"
                onClick={handleSaveDraft}
                disabled={isSaving || !draftName.trim()}
                type="button"
              >
                <SaveIcon className="diseñador-save-icon" />
                {isSaving
                  ? 'Guardando...'
                  : loadedDraftId
                    ? 'Actualizar Borrador'
                    : 'Guardar Borrador'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && drafts.length === 0 && (
          <div className="empty-state">
            <p className="empty-text">Agrega items en el formulario de arriba para comenzar</p>
            <p className="empty-subtext">Las categorías se convertirán en presupuestos al guardar</p>
          </div>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && isDebugToolsEnabled() && (
          <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-debug-dise-ador-de-presupuestos">🐛 Debug - Diseñador de Presupuestos</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button"
                    onClick={handleDebugCreateDrafts}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Borradores Demo</h3>
                      <p className="debug-option-description">
                        Crea 3 borradores de ejemplo con items predefinidos
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button debug-option-button-danger"
                    onClick={handleDebugDeleteAll}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todos los Borradores</h3>
                      <p className="debug-option-description">
                        Elimina permanentemente todos los borradores guardados
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  )
}

export default DiseñadorPresupuestos

