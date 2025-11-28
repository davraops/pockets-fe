import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import BookIcon from '@mui/icons-material/Book'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './MiDiario.css'

interface DiaryEntryAPI {
  id: string
  entry_date: string
  content: string
  created_at: string
  updated_at: string
}

function MiDiario() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntryAPI | null>(null)
  const [entries, setEntries] = useState<DiaryEntryAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    entry_date: '',
    content: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadEntries()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.midiario-toolbar-menu-container')) {
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

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getDiaryEntries()
      console.log('🔵 GET /diary-entries - Respuesta:', response)

      if (response.entries && Array.isArray(response.entries)) {
        // Ordenar por fecha descendente (más recientes primero)
        const sortedEntries = [...response.entries].sort((a, b) => {
          return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
        })
        setEntries(sortedEntries)
      } else {
        setEntries([])
      }
    } catch (err: any) {
      console.error('Error al cargar entradas de diario:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar las entradas de diario. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedEntry(null)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      entry_date: today,
      content: '',
    })
    setFormErrors({})
  }

  // Helper para formatear fecha al formato YYYY-MM-DD para input date
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }
    // Si viene en otro formato, convertir a YYYY-MM-DD
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleOpenDetailModal = (entry: DiaryEntryAPI) => {
    setSelectedEntry(entry)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      entry_date: formatDateForInput(entry.entry_date),
      content: entry.content,
    })
    setFormErrors({})
  }

  // Actualizar formData cuando se cambia a modo edición
  useEffect(() => {
    if (isEditMode && selectedEntry) {
      setFormData({
        entry_date: formatDateForInput(selectedEntry.entry_date),
        content: selectedEntry.content,
      })
    }
  }, [isEditMode, selectedEntry])

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedEntry(null)
    setIsEditMode(false)
    setFormData({
      entry_date: '',
      content: '',
    })
    setFormErrors({})
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.entry_date.trim()) {
      errors.entry_date = 'La fecha es requerida'
    }

    if (!formData.content.trim()) {
      errors.content = 'El contenido es requerido'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const entryData = {
        entry_date: formData.entry_date.trim(),
        content: formData.content.trim(),
      }

      if (selectedEntry) {
        // Modo edición
        console.log('🟡 PUT /diary-entries/' + selectedEntry.id + ' - Payload:', entryData)
        const updateResponse = await api.updateDiaryEntry(selectedEntry.id, entryData)
        console.log('🟢 PUT /diary-entries/' + selectedEntry.id + ' - Respuesta:', updateResponse)

        await loadEntries()

        // Recargar la entrada específica para actualizar el modal
        const updatedEntryResponse = await api.getDiaryEntries({ id: selectedEntry.id })
        if (updatedEntryResponse.entries && updatedEntryResponse.entries.length > 0) {
          const updatedEntry = updatedEntryResponse.entries[0]
          setSelectedEntry(updatedEntry)
          setFormData({
            entry_date: formatDateForInput(updatedEntry.entry_date),
            content: updatedEntry.content,
          })
        }
        showNotification('Entrada de diario actualizada exitosamente', 'success')
      } else {
        // Modo creación
        console.log('🟢 POST /diary-entries - Payload:', entryData)
        const createResponse = await api.createDiaryEntry(entryData)
        console.log('🟢 POST /diary-entries - Respuesta:', createResponse)

        await loadEntries()
        handleCloseDetailModal()
        showNotification('Entrada de diario creada exitosamente', 'success')
      }
    } catch (err: any) {
      console.error('Error al guardar entrada de diario:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la entrada de diario. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEntry) {
      return
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar esta entrada de diario?')) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteDiaryEntry(selectedEntry.id)
      showNotification('Entrada de diario eliminada exitosamente', 'success')
      handleCloseDetailModal()
      await loadEntries()
    } catch (err: any) {
      console.error('Error al eliminar entrada de diario:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar la entrada de diario. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content midiario-content">
          {/* Toolbar */}
          <div className="midiario-toolbar">
            <button
              className="midiario-toolbar-button"
              onClick={() => navigate('/tiempo')}
              aria-label="Volver"
              type="button"
            >
              <ArrowBackIcon className="midiario-toolbar-icon" />
            </button>

            <div className="midiario-toolbar-menu-container" ref={menuRef}>
              <button
                className="midiario-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
                type="button"
              >
                <MoreVertIcon className="midiario-toolbar-icon" />
              </button>
              {isMenuOpen && (
                <div className="midiario-menu">
                  <button
                    className="midiario-menu-item"
                    onClick={() => {
                      handleOpenCreateModal()
                      setIsMenuOpen(false)
                    }}
                    type="button"
                  >
                    <AddIcon className="midiario-menu-icon" />
                    <span>Nueva Entrada</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <h1 className="midiario-page-title">Mi Diario</h1>
          <p className="midiario-page-subtitle">Reflexiona sobre tus días</p>

          {/* Lista de Entradas */}
          {isLoading ? (
            <div className="midiario-empty-state">
              <p>Cargando entradas...</p>
            </div>
          ) : error ? (
            <div className="midiario-empty-state">
              <p>{error}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="midiario-empty-state">
              <BookIcon className="empty-state-icon" />
              <p className="empty-state-text">No hay entradas de diario aún.</p>
            </div>
          ) : (
            <div className="midiario-list">
              <div className="midiario-group">
                {entries.map(entry => (
                  <button
                    key={entry.id}
                    className="midiario-row"
                    onClick={() => handleOpenDetailModal(entry)}
                    type="button"
                  >
                    <div className="midiario-row-content">
                      <div className="midiario-row-header">
                        <h3 className="midiario-row-title">{formatDate(entry.entry_date)}</h3>
                        <ChevronRightIcon className="midiario-row-chevron" />
                      </div>
                      <p className="midiario-row-preview">{entry.content}</p>
                      <span className="midiario-row-date">{formatDateShort(entry.entry_date)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle/Edición/Creación */}
      {isDetailModalOpen && (
        <div className="midiario-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="midiario-modal" onClick={e => e.stopPropagation()}>
            <div className="midiario-modal-header">
              <h2 className="midiario-modal-title">
                {selectedEntry ? (isEditMode ? 'Editar Entrada' : formatDate(selectedEntry.entry_date)) : 'Nueva Entrada'}
              </h2>
              <div className="midiario-modal-actions">
                {selectedEntry && !isEditMode && (
                  <>
                    <button
                      className="midiario-modal-action-button"
                      onClick={() => {
                        if (selectedEntry) {
                          setFormData({
                            entry_date: formatDateForInput(selectedEntry.entry_date),
                            content: selectedEntry.content,
                          })
                        }
                        setIsEditMode(true)
                      }}
                      aria-label="Editar"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="midiario-modal-action-button midiario-modal-delete-button"
                      onClick={handleDelete}
                      aria-label="Eliminar"
                      type="button"
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </button>
                  </>
                )}
                <button
                  className="midiario-modal-close-button"
                  onClick={handleCloseDetailModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>

            {(isEditMode || !selectedEntry) ? (
              <form onSubmit={handleSubmit} className="midiario-modal-form">
                <div className="midiario-form-group">
                  <label htmlFor="entry_date" className="midiario-form-label">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    id="entry_date"
                    name="entry_date"
                    value={formData.entry_date}
                    onChange={handleChange}
                    className={`midiario-form-input ${formErrors.entry_date ? 'error' : ''}`}
                    required
                  />
                  {formErrors.entry_date && (
                    <span className="midiario-form-error">{formErrors.entry_date}</span>
                  )}
                </div>

                <div className="midiario-form-group">
                  <label htmlFor="content" className="midiario-form-label">
                    Contenido *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    className={`midiario-form-textarea ${formErrors.content ? 'error' : ''}`}
                    rows={10}
                    required
                    placeholder="Escribe sobre tu día..."
                  />
                  {formErrors.content && (
                    <span className="midiario-form-error">{formErrors.content}</span>
                  )}
                </div>

                <div className="midiario-form-actions">
                  <button
                    type="button"
                    className="midiario-form-button midiario-form-button-secondary"
                    onClick={handleCloseDetailModal}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="midiario-form-button midiario-form-button-primary"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? (selectedEntry ? 'Guardando...' : 'Creando...')
                      : (selectedEntry ? 'Guardar Cambios' : 'Crear Entrada')
                    }
                  </button>
                </div>
              </form>
            ) : (
              <div className="midiario-detail-content">
                <div className="midiario-detail-section">
                  <p className="midiario-detail-content-text">{selectedEntry.content}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default MiDiario

