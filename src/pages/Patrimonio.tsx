import { useState, useEffect, useRef } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import InventoryIcon from '@mui/icons-material/Inventory'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import PatrimonioFormModal from '../components/patrimonio/PatrimonioFormModal'
import PatrimonioListRow from '../components/patrimonio/PatrimonioListRow'
import PatrimonioDebugModal from '../components/patrimonio/PatrimonioDebugModal'
import {
  EMPTY_PATRIMONY_FORM,
  EMPTY_PATRIMONY_FORM_ERRORS,
  patrimonyItemToFormData,
  formDataToPatrimonyPayload,
  validatePatrimonyForm,
  type PatrimonyFormData,
  type PatrimonyFormErrors,
} from '../components/patrimonio/patrimonioFormUtils'
import {
  calculatePatrimonyHighlights,
  patrimonySummaryItems,
} from '../components/patrimonio/patrimonioDisplayUtils'
import type { PatrimonyItem } from '../components/patrimonio/patrimonioTypes'
import { mapPatrimonyRecords } from '../components/patrimonio/patrimonioTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Patrimonio.css'

function Patrimonio() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [patrimonyItems, setPatrimonyItems] = useState<PatrimonyItem[]>([])
  const [formData, setFormData] = useState<PatrimonyFormData>(EMPTY_PATRIMONY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<PatrimonyFormErrors>(EMPTY_PATRIMONY_FORM_ERRORS)

  useEffect(() => {
    void loadRecords()
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
        setPatrimonyItems(mapPatrimonyRecords(response.items))
      } else {
        setPatrimonyItems([])
      }
    } catch (err: unknown) {
      devError('Error al cargar items de patrimonio:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar items de patrimonio. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setPatrimonyItems([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name as keyof PatrimonyFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData(EMPTY_PATRIMONY_FORM)
    setFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
    setShowFormModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors } = validatePatrimonyForm(formData)
    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => nameRef.current?.focus())
      return
    }

    try {
      const patrimonyPayload = formDataToPatrimonyPayload(formData)

      if (editingId) {
        await api.updatePatrimonyItem(editingId, patrimonyPayload)
        showNotification('Item de Patrimonio actualizado exitosamente', 'success')
      } else {
        await api.createPatrimonyItem(patrimonyPayload)
        showNotification('Item de Patrimonio agregado exitosamente', 'success')
      }

      await loadRecords()
      resetForm()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        editingId
          ? 'Error al actualizar el item. Por favor, intenta de nuevo.'
          : 'Error al agregar el item. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleEdit = (item: PatrimonyItem) => {
    setFormData(patrimonyItemToFormData(item))
    setEditingId(item.id)
    setShowFormModal(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !(await confirm({
        message: `¿Estás seguro de que quieres eliminar el item "${name}"?`,
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      await api.deletePatrimonyItem(id)
      showNotification('Item de Patrimonio eliminado exitosamente', 'success')
      await loadRecords()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el item. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteFromForm = () => {
    const item = patrimonyItems.find(i => i.id === editingId)
    if (!item) {
      return
    }
    void handleDelete(item.id, item.name).then(() => {
      resetForm()
    })
  }

  const highlights = calculatePatrimonyHighlights(patrimonyItems)

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content patrimonio-content">
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

        <h1 className="app-page-title">Patrimonio</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen de patrimonio"
          items={patrimonySummaryItems(highlights)}
        />

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={() => setShowFormModal(true)}
          aria-label="Agregar item de patrimonio"
        >
          <AddIcon aria-hidden={true} />
          Agregar item
        </button>

        {showFormModal && (
          <PatrimonioFormModal
            editingId={editingId}
            formData={formData}
            formErrors={formErrors}
            nameRef={nameRef}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            onDelete={editingId ? handleDeleteFromForm : undefined}
          />
        )}

        <CrudListPanel
          items={patrimonyItems}
          isLoading={isLoading}
          error={error}
          onRetry={() => void loadRecords()}
          retryAriaLabel="Reintentar cargar patrimonio"
          loadingAriaLabel="Cargando patrimonio"
          emptyIcon={<InventoryIcon className="empty-state-icon" />}
          emptyTitle="No hay items de patrimonio agregados"
          emptySubtext="Usa el botón de arriba para agregar el primero"
          getItemKey={item => item.id}
          renderItem={item => (
            <PatrimonioListRow item={item} onClick={() => handleEdit(item)} />
          )}
        />

        {isDebugModalOpen && isDebugToolsEnabled() && (
          <PatrimonioDebugModal
            onClose={() => setIsDebugModalOpen(false)}
            onReload={loadRecords}
            onClearList={() => setPatrimonyItems([])}
          />
        )}
      </div>
    </div>
  )
}

export default Patrimonio
