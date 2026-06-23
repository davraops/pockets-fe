import { useState, useEffect, useRef, useCallback } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import BookIcon from '@mui/icons-material/Book'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import CuadernoFormModal from '../components/cuadernos/CuadernoFormModal'
import CuadernoDetailModal from '../components/cuadernos/CuadernoDetailModal'
import CuadernoListRow from '../components/cuadernos/CuadernoListRow'
import CuadernoDebugModal from '../components/cuadernos/CuadernoDebugModal'
import {
  EMPTY_CUADERNO_FORM,
  EMPTY_CUADERNO_FORM_ERRORS,
  noteToFormData,
  formDataToNotePayload,
  validateCuadernoForm,
  type CuadernoFormData,
  type CuadernoFormErrors,
} from '../components/cuadernos/cuadernoFormUtils'
import {
  calculateCuadernoHighlights,
  cuadernoSummaryItems,
} from '../components/cuadernos/cuadernoDisplayUtils'
import type { Note } from '../components/cuadernos/cuadernosTypes'
import { mapNotesFromAPI } from '../components/cuadernos/cuadernosTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Cuadernos.css'

function Cuadernos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const tituloRef = useRef<HTMLInputElement>(null)
  const contenidoRef = useRef<HTMLTextAreaElement>(null)
  const [formData, setFormData] = useState<CuadernoFormData>(EMPTY_CUADERNO_FORM)
  const [formErrors, setFormErrors] = useState<CuadernoFormErrors>(EMPTY_CUADERNO_FORM_ERRORS)

  const loadNotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getNotes()
      if (response.notes && Array.isArray(response.notes)) {
        setNotes(mapNotesFromAPI(response.notes))
      } else {
        setNotes([])
      }
    } catch (err: unknown) {
      devError('Error al cargar notas:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar las notas. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setNotes([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const resetForm = () => {
    setFormData(EMPTY_CUADERNO_FORM)
    setFormErrors(EMPTY_CUADERNO_FORM_ERRORS)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setIsEditMode(false)
    resetForm()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    resetForm()
  }

  const handleOpenDetailModal = (note: Note) => {
    setSelectedNote(note)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData(noteToFormData(note))
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedNote(null)
    setIsEditMode(false)
    resetForm()
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (
      !selectedNote ||
      !(await confirm({ message: '¿Estás seguro de que quieres eliminar esta nota?', variant: 'danger' }))
    ) {
      return
    }

    try {
      setIsSaving(true)
      await api.deleteNote(selectedNote.id)
      await loadNotes()
      handleCloseDetailModal()
      showNotification('Nota eliminada exitosamente', 'success')
    } catch (err: unknown) {
      devError('Error al eliminar nota:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar la nota. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name as keyof CuadernoFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors } = validateCuadernoForm(formData)
    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => {
        if (errors.titulo) {
          tituloRef.current?.focus()
        } else if (errors.contenido) {
          contenidoRef.current?.focus()
        }
      })
      return
    }

    try {
      setIsSaving(true)
      const payload = formDataToNotePayload(formData)

      if (isEditMode && selectedNote) {
        await api.updateNote(selectedNote.id, payload)
        await loadNotes()
        handleCloseDetailModal()
        showNotification('Nota actualizada exitosamente', 'success')
      } else {
        await api.createNote(payload)
        await loadNotes()
        handleCloseModal()
        showNotification('Nota creada exitosamente', 'success')
      }
    } catch (err: unknown) {
      devError('Error al guardar nota:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la nota. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const highlights = calculateCuadernoHighlights(notes)

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content cuadernos-content">
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
                          setIsDebugModalOpen(true)
                          setIsMenuOpen(false)
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

          <h1 className="app-page-title">Cuadernos</h1>

          <CrudSummaryStrip
            ariaLabel="Resumen de notas"
            items={cuadernoSummaryItems(highlights)}
          />

          <button
            type="button"
            className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
            onClick={handleOpenModal}
            aria-label="Agregar nota"
          >
            <AddIcon aria-hidden={true} />
            Agregar nota
          </button>

          <CrudListPanel
            items={notes}
            isLoading={isLoading}
            error={error}
            onRetry={() => void loadNotes()}
            retryAriaLabel="Reintentar cargar notas"
            loadingAriaLabel="Cargando notas"
            emptyIcon={<BookIcon className="empty-state-icon" />}
            emptyTitle="No hay notas registradas"
            emptySubtext="Usa el botón de arriba para agregar la primera"
            getItemKey={note => note.id}
            renderItem={note => (
              <CuadernoListRow note={note} onClick={() => handleOpenDetailModal(note)} />
            )}
          />
        </div>
      </div>

      {isModalOpen && (
        <CuadernoFormModal
          title="Nueva Nota"
          modalTitleId="modal-title-nueva-nota"
          formData={formData}
          formErrors={formErrors}
          isSaving={isSaving}
          tituloRef={tituloRef}
          contenidoRef={contenidoRef}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}

      {isDetailModalOpen && selectedNote && !isEditMode && (
        <CuadernoDetailModal
          note={selectedNote}
          isSaving={isSaving}
          onClose={handleCloseDetailModal}
          onEdit={handleEditClick}
          onDelete={() => void handleDeleteClick()}
        />
      )}

      {isDetailModalOpen && selectedNote && isEditMode && (
        <CuadernoFormModal
          title="Editar Nota"
          modalTitleId="modal-title-editar-nota"
          fieldIdPrefix="edit-"
          formData={formData}
          formErrors={formErrors}
          isSaving={isSaving}
          tituloRef={tituloRef}
          contenidoRef={contenidoRef}
          overlayClassName="edit-modal-overlay"
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={handleCloseDetailModal}
        />
      )}

      {isDebugModalOpen && isDebugToolsEnabled() && (
        <CuadernoDebugModal
          onClose={() => setIsDebugModalOpen(false)}
          onReload={loadNotes}
          onClearList={() => setNotes([])}
        />
      )}
    </>
  )
}

export default Cuadernos
