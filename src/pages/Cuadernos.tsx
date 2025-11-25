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
import './Cuadernos.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface NoteAPI {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Note {
  id: string
  titulo: string
  contenido: string
  fechaCreacion: string
  fechaActualizacion: string
}

function Cuadernos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
  })
  const [formErrors, setFormErrors] = useState({
    titulo: '',
    contenido: '',
  })

  // Mapear Nota de API a formato interno
  const mapNoteFromAPI = (apiNote: NoteAPI): Note => {
    return {
      id: apiNote.id,
      titulo: apiNote.title,
      contenido: apiNote.content,
      fechaCreacion: apiNote.created_at,
      fechaActualizacion: apiNote.updated_at,
    }
  }

  // Cargar notas desde la API
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.getNotes()
        if (response.notes && Array.isArray(response.notes)) {
          const mappedNotes = response.notes.map(mapNoteFromAPI)
          setNotes(mappedNotes)
        } else {
          setNotes([])
        }
      } catch (err: any) {
        console.error('Error al cargar notas:', err)
        setError('Error al cargar las notas. Por favor, intenta de nuevo.')
        setNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    loadNotes()
  }, [])

  // Cerrar menú al hacer clic fuera - HIG: Clear Feedback
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.cuadernos-toolbar-menu-container')) {
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

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setIsEditMode(false)
    setFormData({
      titulo: '',
      contenido: '',
    })
    setFormErrors({
      titulo: '',
      contenido: '',
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setFormData({
      titulo: '',
      contenido: '',
    })
    setFormErrors({
      titulo: '',
      contenido: '',
    })
  }

  const handleOpenDetailModal = (note: Note) => {
    setSelectedNote(note)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      titulo: note.titulo,
      contenido: note.contenido,
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedNote(null)
    setIsEditMode(false)
    setFormData({
      titulo: '',
      contenido: '',
    })
    setFormErrors({
      titulo: '',
      contenido: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (selectedNote && window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      try {
        setIsLoading(true)
        await api.deleteNote(selectedNote.id)
        const response = await api.getNotes()
        if (response.notes && Array.isArray(response.notes)) {
          const mappedNotes = response.notes.map(mapNoteFromAPI)
          setNotes(mappedNotes)
        }
        handleCloseDetailModal()
        showNotification('Nota eliminada exitosamente', 'success')
      } catch (err: any) {
        console.error('Error al eliminar nota:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar la nota. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const validateForm = (): boolean => {
    const errors = {
      titulo: '',
      contenido: '',
    }
    let isValid = true

    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es requerido'
      isValid = false
    }

    if (!formData.contenido.trim()) {
      errors.contenido = 'El contenido es requerido'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = validateForm()
    if (!isValid) {
      return
    }

    try {
      setIsLoading(true)
      if (isEditMode && selectedNote) {
        // Editar nota existente
        await api.updateNote(selectedNote.id, {
          title: formData.titulo.trim(),
          content: formData.contenido.trim(),
        })

        const response = await api.getNotes()
        if (response.notes && Array.isArray(response.notes)) {
          const mappedNotes = response.notes.map(mapNoteFromAPI)
          setNotes(mappedNotes)
        }
        handleCloseDetailModal()
        showNotification('Nota actualizada exitosamente', 'success')
      } else {
        // Agregar nueva nota
        await api.createNote({
          title: formData.titulo.trim(),
          content: formData.contenido.trim(),
        })

        const response = await api.getNotes()
        if (response.notes && Array.isArray(response.notes)) {
          const mappedNotes = response.notes.map(mapNoteFromAPI)
          setNotes(mappedNotes)
        }
        handleCloseModal()
        showNotification('Nota creada exitosamente', 'success')
      }
    } catch (err: any) {
      console.error('Error al guardar nota:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la nota. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDebugCreateNotes = async () => {
    try {
      setIsLoading(true)
      const demoNotes = [
        {
          title: 'Nota de ejemplo 1',
          content:
            'Esta es una nota de ejemplo para pruebas. Puedo escribir cualquier contenido aquí.',
        },
        {
          title: 'Ideas para el proyecto',
          content:
            'Lista de ideas:\n- Implementar nueva funcionalidad\n- Mejorar la UI\n- Agregar más tests',
        },
        {
          title: 'Recordatorios importantes',
          content: 'Recordar:\n1. Revisar el código\n2. Hacer commit\n3. Deploy a producción',
        },
        {
          title: 'Notas de reunión',
          content:
            'Reunión del día de hoy:\n- Discutimos nuevas features\n- Acordamos timeline\n- Próxima reunión: viernes',
        },
        {
          title: 'Lista de tareas',
          content: 'Tareas pendientes:\n- [ ] Tarea 1\n- [ ] Tarea 2\n- [x] Tarea 3 (completada)',
        },
      ]

      for (const note of demoNotes) {
        await api.createNote(note)
      }

      const response = await api.getNotes()
      if (response.notes && Array.isArray(response.notes)) {
        const mappedNotes = response.notes.map(mapNoteFromAPI)
        setNotes(mappedNotes)
      }
      setIsDebugModalOpen(false)
      showNotification('Notas demo creadas exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al crear notas demo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear las notas demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllNotes = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODAS las notas? Esta acción es irreversible.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllNotes()
        setNotes([])
        setIsDebugModalOpen(false)
        showNotification('Todas las notas han sido eliminadas', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todas las notas:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar las notas. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content cuadernos-content">
          {/* Toolbar */}
          <div className="cuadernos-toolbar">
            <button
              className="cuadernos-toolbar-button"
              onClick={() => navigate('/registros')}
              aria-label="Volver a Registros"
              type="button"
            >
              <ArrowBackIcon className="cuadernos-toolbar-icon" />
            </button>
            <div className="cuadernos-toolbar-menu-container" ref={menuRef}>
              <button
                className="cuadernos-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
                type="button"
              >
                <MoreVertIcon className="cuadernos-toolbar-icon" />
              </button>
              {isMenuOpen && (
                <div className="cuadernos-menu">
                  <button
                    className="cuadernos-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleOpenModal()
                    }}
                    type="button"
                  >
                    <AddIcon className="cuadernos-menu-icon" />
                    <span>Agregar Nota</span>
                  </button>
                  {api.isTestUser() && (
                    <button
                      className="cuadernos-menu-item"
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

          <h1 className="cuadernos-page-title">Cuadernos</h1>
          <p className="cuadernos-page-subtitle">Gestiona tus cuadernos de notas</p>

          {/* Lista de Notas */}
          <div className="cuadernos-list">
            {isLoading ? (
              <div className="cuadernos-loading">
                <p className="cuadernos-loading-text">Cargando notas...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="cuadernos-empty">
                <BookIcon className="cuadernos-empty-icon" />
                <p className="cuadernos-empty-text">No hay notas registradas</p>
                <button className="cuadernos-empty-button" onClick={handleOpenModal} type="button">
                  <AddIcon />
                  <span>Agregar</span>
                </button>
              </div>
            ) : (
              <div className="cuadernos-group">
                {notes.map(note => (
                  <button
                    key={note.id}
                    className="cuadernos-row"
                    onClick={() => handleOpenDetailModal(note)}
                    type="button"
                  >
                    <div className="cuadernos-row-content">
                      <div className="cuadernos-row-header">
                        <h3 className="cuadernos-row-title">{note.titulo}</h3>
                        <ChevronRightIcon className="cuadernos-row-chevron" aria-hidden="true" />
                      </div>
                      <p className="cuadernos-row-preview">
                        {note.contenido.length > 100
                          ? `${note.contenido.substring(0, 100)}...`
                          : note.contenido}
                      </p>
                      <p className="cuadernos-row-date">
                        {note.fechaCreacion === note.fechaActualizacion
                          ? `Creada: ${formatDate(note.fechaCreacion)}`
                          : `Actualizada: ${formatDate(note.fechaActualizacion)}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón flotante para agregar */}
          {notes.length > 0 && (
            <button
              className="cuadernos-fab"
              onClick={handleOpenModal}
              aria-label="Agregar Nota"
              type="button"
            >
              <AddIcon />
            </button>
          )}
        </div>
      </div>

      {/* Modal para crear/editar Nota */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva Nota</h2>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="titulo" className="form-label">
                  Título
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`form-input ${formErrors.titulo ? 'input-error' : ''}`}
                  placeholder="Ej: Mi primera nota"
                  required
                />
                {formErrors.titulo && (
                  <span className="error-message" role="alert">
                    {formErrors.titulo}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contenido" className="form-label">
                  Contenido
                </label>
                <textarea
                  id="contenido"
                  name="contenido"
                  value={formData.contenido}
                  onChange={handleChange}
                  className={`form-input form-textarea ${formErrors.contenido ? 'input-error' : ''}`}
                  placeholder="Escribe el contenido de tu nota aquí..."
                  rows={8}
                  required
                />
                {formErrors.contenido && (
                  <span className="error-message" role="alert">
                    {formErrors.contenido}
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-button secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {isDetailModalOpen && selectedNote && !isEditMode && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedNote.titulo}</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <div className="detail-info">
                  <h3 className="detail-name">{selectedNote.titulo}</h3>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Contenido</span>
              </div>
              <div className="detail-content-text">
                <pre className="detail-content-pre">{selectedNote.contenido}</pre>
              </div>

              <div className="detail-row">
                <span className="detail-label">Fecha de Creación</span>
                <span className="detail-value">{formatDate(selectedNote.fechaCreacion)}</span>
              </div>

              {selectedNote.fechaCreacion !== selectedNote.fechaActualizacion && (
                <div className="detail-row">
                  <span className="detail-label">Última Actualización</span>
                  <span className="detail-value">
                    {formatDate(selectedNote.fechaActualizacion)}
                  </span>
                </div>
              )}
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="detail-action-button"
                onClick={handleEditClick}
                aria-label="Editar Nota"
              >
                <EditIcon />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className="detail-action-button danger"
                onClick={handleDeleteClick}
                aria-label="Eliminar Nota"
              >
                <DeleteIcon />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isDetailModalOpen && selectedNote && isEditMode && (
        <div className="modal-overlay edit-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Nota</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="edit-titulo" className="form-label">
                  Título
                </label>
                <input
                  type="text"
                  id="edit-titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`form-input ${formErrors.titulo ? 'input-error' : ''}`}
                  placeholder="Ej: Mi primera nota"
                  required
                />
                {formErrors.titulo && (
                  <span className="error-message" role="alert">
                    {formErrors.titulo}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-contenido" className="form-label">
                  Contenido
                </label>
                <textarea
                  id="edit-contenido"
                  name="contenido"
                  value={formData.contenido}
                  onChange={handleChange}
                  className={`form-input form-textarea ${formErrors.contenido ? 'input-error' : ''}`}
                  placeholder="Escribe el contenido de tu nota aquí..."
                  rows={8}
                  required
                />
                {formErrors.contenido && (
                  <span className="error-message" role="alert">
                    {formErrors.contenido}
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={handleCloseDetailModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="modal-button primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Debug */}
      {isDebugModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Cuadernos</h2>
              <button
                className="modal-close"
                onClick={() => setIsDebugModalOpen(false)}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateNotes}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Notas Demo</h3>
                    <p className="debug-option-description">Crea 5 notas de ejemplo para pruebas</p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllNotes}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Notas</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todas las notas (IRREVERSIBLE)
                    </p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button secondary"
                onClick={() => setIsDebugModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Cuadernos
