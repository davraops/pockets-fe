import { useState, useEffect, useRef, useMemo } from 'react'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import InventoryIcon from '@mui/icons-material/Inventory'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import PatrimonioFormModal from '../components/patrimonio/PatrimonioFormModal'
import PatrimonioDetailModal from '../components/patrimonio/PatrimonioDetailModal'
import PatrimonioCard from '../components/patrimonio/PatrimonioCard'
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
  filterPatrimonyByQuery,
  patrimonySummaryItems,
} from '../components/patrimonio/patrimonioDisplayUtils'
import type { PatrimonyItem } from '../components/patrimonio/patrimonioTypes'
import { mapPatrimonyRecords } from '../components/patrimonio/patrimonioTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import './AppPage.css'
import './Patrimonio.css'

function Patrimonio() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [patrimonyItems, setPatrimonyItems] = useState<PatrimonyItem[]>([])
  const [formData, setFormData] = useState<PatrimonyFormData>(EMPTY_PATRIMONY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<PatrimonyItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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

  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormData(EMPTY_PATRIMONY_FORM)
    setFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
    setShowFormModal(true)
  }

  const handleCancelForm = () => {
    const returnToDetail = editingId && selectedItem
    resetForm()
    if (returnToDetail) {
      setIsDetailModalOpen(true)
    }
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
      setIsSaving(true)
      const patrimonyPayload = formDataToPatrimonyPayload(formData)

      if (editingId) {
        await api.updatePatrimonyItem(editingId, patrimonyPayload)
        showNotification('Ítem de patrimonio actualizado', 'success')
      } else {
        await api.createPatrimonyItem(patrimonyPayload)
        showNotification('Ítem de patrimonio agregado', 'success')
      }

      await loadRecords()
      resetForm()
      setIsDetailModalOpen(false)
      setSelectedItem(null)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        editingId
          ? 'Error al actualizar el ítem. Por favor, intenta de nuevo.'
          : 'Error al agregar el ítem. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenDetailModal = (item: PatrimonyItem) => {
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedItem(null)
  }

  const handleEditFromDetail = () => {
    if (!selectedItem) {
      return
    }
    setFormData(patrimonyItemToFormData(selectedItem))
    setEditingId(selectedItem.id)
    setIsDetailModalOpen(false)
    setShowFormModal(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !(await confirm({
        message: `¿Estás seguro de que quieres eliminar "${name}"?`,
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsSaving(true)
      await api.deletePatrimonyItem(id)
      showNotification('Ítem de patrimonio eliminado', 'success')
      await loadRecords()
      handleCloseDetailModal()
      resetForm()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el ítem. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const highlights = calculatePatrimonyHighlights(patrimonyItems)
  const hasSearch = searchQuery.trim().length > 0
  const filteredItems = useMemo(
    () => filterPatrimonyByQuery(patrimonyItems, searchQuery),
    [patrimonyItems, searchQuery]
  )
  const isBusy = isSaving

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content patrimonio-content utilidades-sub-content">
        <UtilidadesSubHeader
          title="Patrimonio"
          context="Bienes"
          meta={
            !isLoading && !error
              ? hasSearch
                ? `${filteredItems.length} de ${patrimonyItems.length} ítem${patrimonyItems.length !== 1 ? 's' : ''}`
                : `${patrimonyItems.length} ítem${patrimonyItems.length !== 1 ? 's' : ''}`
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

        {!isLoading && !error && patrimonyItems.length > 0 ? (
          <CrudSummaryStrip
            ariaLabel="Resumen de patrimonio"
            items={patrimonySummaryItems(highlights)}
          />
        ) : null}

        <div
          className={`patrimonio-toolbar${!isLoading && !error && patrimonyItems.length === 0 ? ' patrimonio-toolbar--solo-cta' : ''}`}
        >
          {!isLoading && !error && (patrimonyItems.length > 0 || hasSearch) ? (
            <label className="patrimonio-search">
              <SearchIcon className="patrimonio-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="patrimonio-search-input"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre, categoría, marca…"
                aria-label="Buscar ítems de patrimonio"
              />
            </label>
          ) : null}
          <button
            type="button"
            className="btn-base btn-accent btn-submit crud-primary-cta patrimonio-toolbar-cta"
            onClick={handleOpenCreateModal}
            aria-label="Agregar ítem de patrimonio"
          >
            <AddIcon aria-hidden={true} />
            Agregar ítem
          </button>
        </div>

        <CrudListPanel
          items={filteredItems}
          isLoading={isLoading}
          error={error}
          onRetry={() => void loadRecords()}
          retryAriaLabel="Reintentar cargar patrimonio"
          loadingAriaLabel="Cargando patrimonio"
          skeletonCount={6}
          emptyIcon={<InventoryIcon className="empty-state-icon" />}
          emptyTitle={hasSearch ? 'Sin coincidencias' : 'No hay ítems de patrimonio'}
          emptySubtext={
            hasSearch
              ? 'Prueba con otro término o limpia la búsqueda'
              : 'Usa Agregar ítem para registrar el primero'
          }
          getItemKey={item => item.id}
          listOuterClassName="patrimonio-list"
          loadingListClassName="patrimonio-card-grid patrimonio-card-grid--loading"
          renderBody={() => (
            <div className="patrimonio-card-grid" role="list">
              {filteredItems.map(item => (
                <PatrimonioCard
                  key={item.id}
                  item={item}
                  onClick={() => handleOpenDetailModal(item)}
                />
              ))}
            </div>
          )}
        />

        {showFormModal && (
          <PatrimonioFormModal
            editingId={editingId}
            formData={formData}
            formErrors={formErrors}
            nameRef={nameRef}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        )}

        {isDetailModalOpen && selectedItem && !showFormModal && (
          <PatrimonioDetailModal
            item={selectedItem}
            isBusy={isBusy}
            onClose={handleCloseDetailModal}
            onEdit={handleEditFromDetail}
            onDelete={() => void handleDelete(selectedItem.id, selectedItem.name)}
          />
        )}

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
