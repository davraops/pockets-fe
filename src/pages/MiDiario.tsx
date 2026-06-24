import { useState, useEffect, useRef } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import BookIcon from '@mui/icons-material/Book'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import './MiDiario.css'
import { devError, devLog } from '../utils/debugTools'

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
  const { confirm } = useConfirm()
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntryAPI | null>(null)
  const [entries, setEntries] = useState<DiaryEntryAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const entryDateRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [formData, setFormData] = useState({
    entry_date: '',
    content: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)

  useEffect(() => {
    loadEntries()
  }, [])

  // Calcular racha cuando cambian las entradas
  useEffect(() => {
    if (entries.length > 0) {
      calculateStreaks()
    } else {
      setCurrentStreak(0)
      setLongestStreak(0)
    }
  }, [entries])

  const calculateStreaks = () => {
    // Obtener todas las fechas únicas de las entradas
    const entryDates = new Set<string>()
    entries.forEach(entry => {
      const dateStr = entry.entry_date.split('T')[0] // Asegurar formato YYYY-MM-DD
      entryDates.add(dateStr)
    })

    // Convertir a array y ordenar
    const sortedDates = Array.from(entryDates)
      .map(dateStr => new Date(dateStr + 'T00:00:00'))
      .sort((a, b) => b.getTime() - a.getTime()) // Más recientes primero

    if (sortedDates.length === 0) {
      setCurrentStreak(0)
      setLongestStreak(0)
      return
    }

    // Calcular racha actual (desde hoy o ayer hacia atrás)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Verificar si hay entrada hoy o ayer
    const hasToday = sortedDates.some(date => {
      const dateStr = date.toISOString().split('T')[0]
      const todayStr = today.toISOString().split('T')[0]
      return dateStr === todayStr
    })

    const hasYesterday = sortedDates.some(date => {
      const dateStr = date.toISOString().split('T')[0]
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      return dateStr === yesterdayStr
    })

    let startDate: Date
    if (hasToday) {
      startDate = new Date(today)
    } else if (hasYesterday) {
      startDate = new Date(yesterday)
    } else {
      // No hay entrada hoy ni ayer, racha = 0
      setCurrentStreak(0)
      // Calcular racha más larga
      calculateLongestStreak(sortedDates)
      return
    }

    // Contar días consecutivos desde startDate hacia atrás
    let streak = 0
    const checkDate = new Date(startDate)
    let hasEntry = true

    while (hasEntry) {
      const checkDateStr = checkDate.toISOString().split('T')[0]
      hasEntry = sortedDates.some(date => {
        const dateStr = date.toISOString().split('T')[0]
        return dateStr === checkDateStr
      })

      if (!hasEntry) {
        break
      }

      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    setCurrentStreak(streak)
    calculateLongestStreak(sortedDates)
  }

  const calculateLongestStreak = (sortedDates: Date[]) => {
    if (sortedDates.length === 0) {
      setLongestStreak(0)
      return
    }

    // Ordenar de más antiguo a más reciente para calcular racha más larga
    const datesAsc = [...sortedDates].sort((a, b) => a.getTime() - b.getTime())
    
    let longestStreakCount = 1
    let currentStreakCount = 1

    for (let i = 1; i < datesAsc.length; i++) {
      const prevDate = new Date(datesAsc[i - 1])
      const currDate = new Date(datesAsc[i])
      
      // Calcular diferencia en días
      const diffTime = currDate.getTime() - prevDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Días consecutivos
        currentStreakCount++
        longestStreakCount = Math.max(longestStreakCount, currentStreakCount)
      } else {
        // Rompió la racha
        currentStreakCount = 1
      }
    }

    setLongestStreak(longestStreakCount)
  }

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getDiaryEntries()
      devLog('🔵 GET /diary-entries - Respuesta:', response)

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
      devError('Error al cargar entradas de diario:', err)
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
    if (Object.keys(errors).length > 0) {
      queueMicrotask(() => {
        if (errors.entry_date) {
          entryDateRef.current?.focus()
        } else if (errors.content) {
          contentRef.current?.focus()
        }
      })
    }
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
        devLog('🟡 PUT /diary-entries/' + selectedEntry.id + ' - Payload:', entryData)
        const updateResponse = await api.updateDiaryEntry(selectedEntry.id, entryData)
        devLog('🟢 PUT /diary-entries/' + selectedEntry.id + ' - Respuesta:', updateResponse)

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
        devLog('🟢 POST /diary-entries - Payload:', entryData)
        const createResponse = await api.createDiaryEntry(entryData)
        devLog('🟢 POST /diary-entries - Respuesta:', createResponse)

        await loadEntries()
        handleCloseDetailModal()
        showNotification('Entrada de diario creada exitosamente', 'success')
      }
    } catch (err: any) {
      devError('Error al guardar entrada de diario:', err)
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

    if (!(await confirm({ message: '¿Estás seguro de que deseas eliminar esta entrada de diario?', variant: 'danger' }))) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteDiaryEntry(selectedEntry.id)
      showNotification('Entrada de diario eliminada exitosamente', 'success')
      handleCloseDetailModal()
      await loadEntries()
    } catch (err: any) {
      devError('Error al eliminar entrada de diario:', err)
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

  const highlights = {
    total: entries.length,
    rachaActual: currentStreak,
    rachaLarga: longestStreak,
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content midiario-content">
          {/* Toolbar */}
          <div className="app-toolbar">
            <button
              className="app-toolbar-button"
              onClick={() => navigate('/tiempo')}
              aria-label={backToHubLabel('tiempo')}
              type="button"
            >
              <ArrowBackIcon className="app-toolbar-icon" />
            </button>

          </div>

          <h1 className="app-page-title">Mi Diario</h1>

          <div className="crud-summary-strip" role="region" aria-label="Resumen del diario">
            <div className="crud-summary-strip-item">
              <span className="crud-summary-strip-label">Entradas</span>
              <span className="crud-summary-strip-value crud-summary-strip-value--info">
                {highlights.total}
              </span>
            </div>
            <div className="crud-summary-strip-separator" aria-hidden="true" />
            <div className="crud-summary-strip-item">
              <span className="crud-summary-strip-label">Racha actual</span>
              <span className="crud-summary-strip-value crud-summary-strip-value--available">
                {highlights.rachaActual}
              </span>
            </div>
            <div className="crud-summary-strip-separator" aria-hidden="true" />
            <div className="crud-summary-strip-item">
              <span className="crud-summary-strip-label">Récord</span>
              <span className="crud-summary-strip-value crud-summary-strip-value--info">
                {highlights.rachaLarga}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
            onClick={handleOpenCreateModal}
            aria-label="Nueva entrada de diario"
          >
            <AddIcon aria-hidden={true} />
            Nueva entrada
          </button>

          {/* Lista de Entradas */}
          {isLoading && entries.length === 0 ? (
            <div className="glass-group">
              <ListSkeleton variant="inset-row" count={4} aria-label="Cargando entradas de diario" />
            </div>
          ) : error && entries.length === 0 ? (
            <div className="loader-container">
              <div className="loader finanzas-stats-error-panel">
                <p className="loader-text loader-text--error" role="alert">
                  {error}
                </p>
                <button
                  type="button"
                  className="btn-base btn-secondary finanzas-stats-retry-button"
                  onClick={() => void loadEntries()}
                  aria-label="Reintentar cargar entradas"
                >
                  <span>Reintentar</span>
                </button>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <BookIcon className="empty-state-icon" />
              <p className="empty-text">No hay entradas de diario aún</p>
              <p className="empty-subtext">Usa el botón de arriba para escribir la primera</p>
            </div>
          ) : (
            <div className="midiario-list">
              <div className="glass-group">
                {entries.map(entry => (
                  <button
                    key={entry.id}
                    className="crud-inset-row crud-row-accent-purple"
                    onClick={() => handleOpenDetailModal(entry)}
                    type="button"
                  >
                    <div className="crud-row-content">
                      <div className="crud-row-header">
                        <span className="crud-row-title">{formatDate(entry.entry_date)}</span>
                        <ChevronRightIcon className="crud-row-chevron" />
                      </div>
                      <p className="crud-row-preview">{entry.content}</p>
                      <span className="crud-row-meta">{formatDateShort(entry.entry_date)}</span>
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
        <ModalOverlay onClose={handleCloseDetailModal} className="modal-overlay">
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-panel-header">
              <h2 className="modal-panel-title" id="modal-panel-title-selectedentry-iseditmode-editar-entrada-formatdate-selectedentry-entry-date-nueva-entrada">
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
                  className="modal-panel-close"
                  onClick={handleCloseDetailModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>

            {(isEditMode || !selectedEntry) ? (
              <form onSubmit={handleSubmit} className="midiario-modal-form" noValidate>
                <div className="form-group-base">
                  <label htmlFor="entry_date" className="midiario-form-label">
                    Fecha *
                  </label>
                  <input
                    ref={entryDateRef}
                    type="date"
                    id="entry_date"
                    name="entry_date"
                    value={formData.entry_date}
                    onChange={handleChange}
                    className={`form-input-base ${formErrors.entry_date  ? 'input-error' : ''}`}
                    autoFocus={!selectedEntry}
                    aria-invalid={!!formErrors.entry_date}
                    {...(formErrors.entry_date ? { 'aria-describedby': 'entry-date-error' } : {})}
                  />
                  {formErrors.entry_date && (
                    <span id="entry-date-error" className="midiario-form-error" role="alert">
                      {formErrors.entry_date}
                    </span>
                  )}
                </div>

                <div className="form-group-base">
                  <label htmlFor="content" className="midiario-form-label">
                    Contenido *
                  </label>
                  <textarea
                    ref={contentRef}
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    className={`form-textarea-base ${formErrors.content  ? 'input-error' : ''}`}
                    rows={10}
                    placeholder="Escribe sobre tu día..."
                    aria-invalid={!!formErrors.content}
                    {...(formErrors.content ? { 'aria-describedby': 'content-error' } : {})}
                  />
                  {formErrors.content && (
                    <span id="content-error" className="midiario-form-error" role="alert">
                      {formErrors.content}
                    </span>
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
        </ModalOverlay>
      )}
    </>
  )
}

export default MiDiario

