import { useState, useEffect, useRef, useMemo } from 'react'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import BookIcon from '@mui/icons-material/Book'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import MiDiarioCardSkeleton from '../components/miDiario/MiDiarioCardSkeleton'
import MiDiarioEntryCard from '../components/miDiario/MiDiarioEntryCard'
import MiDiarioReader from '../components/miDiario/MiDiarioReader'
import MiDiarioStreakStrip from '../components/miDiario/MiDiarioStreakStrip'
import MiDiarioTodayPanel from '../components/miDiario/MiDiarioTodayPanel'
import LifestyleSubHeader from '../components/tiempo/LifestyleSubHeader'
import './MiDiario.css'
import { devError, devLog } from '../utils/debugTools'
import {
  calculateDiaryStreaks,
  filterDiaryEntriesByQuery,
  formatDiaryCardWeekday,
  formatDiaryDateLong,
  formatDiaryListTitle,
  formatDiaryWordCount,
  getDiaryStreakMessage,
  groupDiaryEntriesByMonth,
  hasDiaryEntryToday,
  splitTodayDiaryEntry,
} from '../components/miDiario/miDiarioDisplayUtils'

interface DiaryEntryAPI {
  id: string
  entry_date: string
  content: string
  created_at: string
  updated_at: string
}

function MiDiario() {
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
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadEntries()
  }, [])

  // Calcular racha cuando cambian las entradas
  useEffect(() => {
    const streaks = calculateDiaryStreaks(entries.map(entry => entry.entry_date))
    setCurrentStreak(streaks.current)
    setLongestStreak(streaks.longest)
  }, [entries])

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

  const filteredEntries = useMemo(
    () => filterDiaryEntriesByQuery(entries, searchQuery),
    [entries, searchQuery]
  )
  const hasSearch = searchQuery.trim().length > 0
  const hasTodayEntry = useMemo(() => hasDiaryEntryToday(entries), [entries])
  const { todayEntry, rest: restEntries } = useMemo(
    () => splitTodayDiaryEntry(filteredEntries),
    [filteredEntries]
  )
  const feedEntries = hasSearch ? filteredEntries : restEntries
  const monthGroups = useMemo(
    () => groupDiaryEntriesByMonth(feedEntries),
    [feedEntries]
  )

  const highlights = {
    total: entries.length,
    rachaActual: currentStreak,
    rachaLarga: longestStreak,
  }
  const streakMessage = getDiaryStreakMessage(
    highlights.rachaActual,
    hasTodayEntry,
    highlights.total
  )

  const headerMeta = !isLoading && !error
    ? hasSearch
      ? `${filteredEntries.length} de ${entries.length} entrada${entries.length !== 1 ? 's' : ''}`
      : entries.length === 0
        ? 'Empieza tu primera entrada'
        : currentStreak > 0
          ? `${entries.length} entradas · racha ${currentStreak} días`
          : `${entries.length} entrada${entries.length !== 1 ? 's' : ''}`
    : undefined

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content midiario-content lifestyle-sub-content">
          <LifestyleSubHeader title="Mi Diario" context="Reflexión" meta={headerMeta} />

          {!isLoading && !error && entries.length > 0 ? (
            <MiDiarioStreakStrip
              totalEntries={highlights.total}
              currentStreak={highlights.rachaActual}
              longestStreak={highlights.rachaLarga}
              message={streakMessage}
            />
          ) : null}

          <div
            className={`lifestyle-toolbar${!isLoading && !error && entries.length === 0 ? ' lifestyle-toolbar--solo-cta' : ''}`}
          >
            {!isLoading && !error && (entries.length > 0 || hasSearch) ? (
              <label className="lifestyle-search">
                <SearchIcon className="lifestyle-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="lifestyle-search-input"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Buscar en el contenido o por fecha…"
                  aria-label="Buscar entradas de diario"
                />
              </label>
            ) : null}
            <button
              type="button"
              className="btn-base btn-accent btn-submit crud-primary-cta lifestyle-toolbar-cta"
              onClick={handleOpenCreateModal}
              aria-label="Nueva entrada de diario"
            >
              <AddIcon aria-hidden={true} />
              Nueva entrada
            </button>
          </div>

          {/* Lista de Entradas */}
          {isLoading && entries.length === 0 ? (
            <div role="status" aria-label="Cargando entradas de diario">
              <MiDiarioCardSkeleton count={4} />
            </div>
          ) : error && entries.length === 0 ? (
            <div className="loader-container">
              <div className="loader finanzas-stats-error-panel">
                <p className="loader-text loader-text--error" role="alert">
                  {error}
                </p>
                <button
                  type="button"
                  className="btn-base btn-secondary btn-retry"
                  onClick={() => void loadEntries()}
                  aria-label="Reintentar cargar entradas"
                >
                  <span>Reintentar</span>
                </button>
              </div>
            </div>
          ) : hasSearch && filteredEntries.length === 0 ? (
            <div className="empty-state">
              <BookIcon className="empty-state-icon" />
              <p className="empty-text">Sin coincidencias</p>
              <p className="empty-subtext">Prueba con otro término o limpia la búsqueda</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="midiario-welcome">
              <BookIcon className="midiario-welcome__icon" aria-hidden="true" />
              <h2 className="midiario-welcome__title">Tu espacio de reflexión</h2>
              <p className="midiario-welcome__text">
                Escribe unas líneas al final del día. Sin presión, sin formato perfecto: solo tú y
                tus pensamientos.
              </p>
              <button
                type="button"
                className="btn-base btn-accent midiario-welcome__cta"
                onClick={handleOpenCreateModal}
              >
                <AddIcon aria-hidden="true" />
                Escribir la primera entrada
              </button>
            </div>
          ) : (
            <div className="midiario-feed">
              {!hasSearch ? (
                <MiDiarioTodayPanel
                  todayEntry={todayEntry}
                  streakMessage={streakMessage}
                  onWriteToday={handleOpenCreateModal}
                  onOpenEntry={handleOpenDetailModal}
                />
              ) : (
                <p className="midiario-search-meta" role="status">
                  {filteredEntries.length} resultado{filteredEntries.length === 1 ? '' : 's'}
                </p>
              )}

              {hasSearch ? (
                <div className="midiario-card-list">
                  {filteredEntries.map(entry => (
                    <MiDiarioEntryCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => handleOpenDetailModal(entry)}
                    />
                  ))}
                </div>
              ) : (
                monthGroups.map(group => (
                  <section key={group.monthKey} className="midiario-month-group">
                    <div className="midiario-month-header">
                      <h2 className="midiario-month-label">{group.label}</h2>
                      <span className="midiario-month-count">
                        {group.entries.length} entrada{group.entries.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="midiario-card-list">
                      {group.entries.map(entry => (
                        <MiDiarioEntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => handleOpenDetailModal(entry)}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle/Edición/Creación */}
      {isDetailModalOpen && (
        <ModalOverlay onClose={handleCloseDetailModal} className="modal-overlay">
          <div
            className={`modal-panel midiario-modal lifestyle-modal${isEditMode || !selectedEntry ? ' lifestyle-modal--form' : ' lifestyle-modal--reader'}`}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="modal-title-midiario"
          >
            <div className="lifestyle-modal__header">
              <div className="lifestyle-modal__header-copy">
                <p className="lifestyle-modal__kicker">
                  Mi Diario · {selectedEntry ? (isEditMode ? 'Editar' : 'Detalle') : 'Nuevo'}
                </p>
                <h2 className="modal-panel-title" id="modal-title-midiario">
                  {selectedEntry
                    ? isEditMode
                      ? 'Editar entrada'
                      : formatDiaryListTitle(selectedEntry.content, selectedEntry.entry_date)
                    : 'Nueva entrada'}
                </h2>
                {selectedEntry && !isEditMode ? (
                  <p className="lifestyle-modal__subtitle">
                    {formatDiaryCardWeekday(selectedEntry.entry_date)} ·{' '}
                    {formatDiaryDateLong(selectedEntry.entry_date)} ·{' '}
                    {formatDiaryWordCount(selectedEntry.content)}
                  </p>
                ) : null}
              </div>
              <div className="lifestyle-modal__header-actions">
                {selectedEntry && !isEditMode ? (
                  <>
                    <button
                      className="lifestyle-modal__action-button"
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
                      className="lifestyle-modal__action-button lifestyle-modal__action-button--danger"
                      onClick={handleDelete}
                      aria-label="Eliminar"
                      type="button"
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </button>
                  </>
                ) : null}
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

                <div className="modal-actions-base lifestyle-modal__footer">
                  <button
                    type="button"
                    className="btn-base btn-secondary lifestyle-modal__btn"
                    onClick={handleCloseDetailModal}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-base btn-accent lifestyle-modal__btn"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? selectedEntry
                        ? 'Guardando...'
                        : 'Creando...'
                      : selectedEntry
                        ? 'Guardar cambios'
                        : 'Crear entrada'}
                  </button>
                </div>
              </form>
            ) : selectedEntry ? (
              <div className="modal-panel-content lifestyle-modal__body">
                <MiDiarioReader
                  entryDate={selectedEntry.entry_date}
                  content={selectedEntry.content}
                />
                <div className="modal-actions-base lifestyle-modal__footer lifestyle-modal__footer--detail">
                  <button
                    type="button"
                    className="btn-base btn-secondary lifestyle-modal__btn lifestyle-modal__btn--danger"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <DeleteIcon aria-hidden="true" />
                    Eliminar
                  </button>
                  <button
                    type="button"
                    className="btn-base btn-accent lifestyle-modal__btn lifestyle-modal__btn--primary"
                    onClick={() => {
                      setFormData({
                        entry_date: formatDateForInput(selectedEntry.entry_date),
                        content: selectedEntry.content,
                      })
                      setIsEditMode(true)
                    }}
                  >
                    <EditIcon aria-hidden="true" />
                    Editar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </ModalOverlay>
      )}
    </>
  )
}

export default MiDiario

