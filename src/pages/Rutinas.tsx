import { useState, useEffect, useRef, useMemo } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate } from 'react-router-dom'
import RepeatIcon from '@mui/icons-material/Repeat'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import TodayIcon from '@mui/icons-material/Today'
import { api } from '../services/api'
import { devError, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import LifestyleSubHeader from '../components/tiempo/LifestyleSubHeader'
import RutinaDetailModalBody from '../components/rutinas/RutinaDetailModalBody'
import RutinaFormModalBody from '../components/rutinas/RutinaFormModalBody'
import RutinaFrequencyFilters from '../components/rutinas/RutinaFrequencyFilters'
import RutinaListRow from '../components/rutinas/RutinaListRow'
import {
  calculateRoutineHighlights,
  filterRoutinesByFrequency,
  filterRoutinesByQuery,
  formatRoutineMeta,
  groupRoutinesByFrequency,
  routineFormDataFromRoutine,
  sortRoutinesForDisplay,
} from '../components/rutinas/routineDisplayUtils'
import {
  DEFAULT_ROUTINE_FORM,
  type Routine,
  type RoutineFormData,
  type RoutineFrequencyFilter,
} from '../components/rutinas/routineTypes'
import './Rutinas.css'

function Rutinas() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const dayOfMonthRef = useRef<HTMLInputElement>(null)
  const daysOfWeekRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<RoutineFormData>(DEFAULT_ROUTINE_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [frequencyFilter, setFrequencyFilter] = useState<RoutineFrequencyFilter>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadRoutines()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.lifestyle-sub-menu-container')) {
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

  const loadRoutines = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getRoutines()
      if (response.routines && Array.isArray(response.routines)) {
        // Normalizar is_active: asegurar que sea boolean
        const normalizedRoutines = response.routines.map(routine => ({
          ...routine,
          is_active: routine.is_active === true || routine.is_active === 'true' || routine.is_active === 1
        }))
        setRoutines(normalizedRoutines)
      } else {
        setRoutines([])
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar las rutinas. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setSelectedRoutine(null)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData(DEFAULT_ROUTINE_FORM)
    setFormErrors({})
  }

  const handleOpenDetailModal = (routine: Routine) => {
    setSelectedRoutine(routine)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData(routineFormDataFromRoutine(routine))
    setFormErrors({})
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedRoutine(null)
    setIsEditMode(false)
    setFormData(DEFAULT_ROUTINE_FORM)
    setFormErrors({})
  }

  const handleFormCancel = () => {
    if (selectedRoutine) {
      setIsEditMode(false)
      setFormData(routineFormDataFromRoutine(selectedRoutine))
      setFormErrors({})
      return
    }
    handleCloseDetailModal()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name === 'day_of_month') {
      setFormData(prev => ({
        ...prev,
        day_of_month: value === '' ? null : parseInt(value, 10),
      }))
    } else if (name === 'duration') {
      setFormData(prev => ({
        ...prev,
        duration: value === '' ? null : parseInt(value, 10),
      }))
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }

    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleDayToggle = (day: number) => {
    setFormData(prev => {
      const currentDays = prev.days_of_week || []
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day]
      return {
        ...prev,
        days_of_week: newDays,
      }
    })
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'El título es requerido'
    }

    if (formData.frequency === 'weekly' && (!formData.days_of_week || formData.days_of_week.length === 0)) {
      errors.days_of_week = 'Debes seleccionar al menos un día de la semana'
    }

    if (formData.frequency === 'monthly' && (formData.day_of_month === null || formData.day_of_month === undefined)) {
      errors.day_of_month = 'Debes seleccionar un día del mes'
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      queueMicrotask(() => {
        if (errors.title) {
          titleRef.current?.focus()
        } else if (errors.days_of_week) {
          daysOfWeekRef.current?.querySelector('button')?.focus()
        } else if (errors.day_of_month) {
          dayOfMonthRef.current?.focus()
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
      setIsSubmitting(true)

      const routineData = {
        title: formData.title.trim(),
        frequency: formData.frequency,
        days_of_week: null as number[] | null,
        day_of_month: null as number | null,
        ...(formData.description.trim() ? { description: formData.description.trim() } : {}),
        ...(formData.scheduled_time ? { scheduled_time: formData.scheduled_time } : {}),
        color: formData.color,
        ...(formData.duration != null ? { duration: formData.duration } : {}),
      }

      if (formData.frequency === 'weekly') {
        routineData.days_of_week = formData.days_of_week.length > 0 ? formData.days_of_week : null
      } else if (formData.frequency === 'monthly') {
        routineData.day_of_month = formData.day_of_month
      }

      if (selectedRoutine) {
        await api.updateRoutine(selectedRoutine.id, routineData)
        await loadRoutines()

        const updatedRoutineResponse = await api.getRoutines(selectedRoutine.id)
        if (updatedRoutineResponse.routines && updatedRoutineResponse.routines.length > 0) {
          const updatedRoutine = updatedRoutineResponse.routines[0] as Routine
          setSelectedRoutine(updatedRoutine)
          setFormData(routineFormDataFromRoutine(updatedRoutine))
        }
        setIsEditMode(false)
        showNotification('Rutina actualizada exitosamente', 'success')
      } else {
        await api.createRoutine(routineData)
        await loadRoutines()
        handleCloseDetailModal()
        showNotification('Rutina creada exitosamente', 'success')
      }
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        selectedRoutine
          ? 'Error al actualizar la rutina. Por favor, intenta de nuevo.'
          : 'Error al crear la rutina. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRoutine) return

    if (!(await confirm({ message: '¿Estás seguro de que quieres eliminar esta rutina? Esta acción es irreversible.', variant: 'danger' }))) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteRoutine(selectedRoutine.id)
      await loadRoutines()
      handleCloseDetailModal()
      showNotification('Rutina eliminada exitosamente', 'success')
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar la rutina. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para crear rutinas dummy
  const handleDebugCreateRoutines = async () => {
    if (!isDebugToolsEnabled()) return
    try {
      setIsLoading(true)
      const demoRoutines = [
        {
          title: 'Ejercicio matutino',
          description: '30 minutos de ejercicio cada mañana',
          frequency: 'daily' as const,
          scheduled_time: '07:00',
          duration: 30,
          color: '#FF5733',
        },
        {
          title: 'Meditación',
          description: '15 minutos de meditación para empezar el día',
          frequency: 'daily' as const,
          scheduled_time: '06:30',
          duration: 15,
          color: '#9B59B6',
        },
        {
          title: 'Leer',
          description: 'Leer 20 páginas de un libro',
          frequency: 'daily' as const,
          scheduled_time: '21:00',
          duration: 20,
          color: '#3498DB',
        },
        {
          title: 'Gimnasio',
          description: 'Entrenamiento de fuerza',
          frequency: 'weekly' as const,
          days_of_week: [1, 3, 5], // Lunes, Miércoles, Viernes
          scheduled_time: '18:00',
          duration: 60,
          color: '#E74C3C',
        },
        {
          title: 'Yoga',
          description: 'Sesión de yoga para relajación',
          frequency: 'weekly' as const,
          days_of_week: [0, 6], // Domingo, Sábado
          scheduled_time: '10:00',
          duration: 45,
          color: '#1ABC9C',
        },
        {
          title: 'Revisión de gastos',
          description: 'Revisar y planificar gastos del mes',
          frequency: 'monthly' as const,
          day_of_month: 1,
          scheduled_time: '09:00',
          duration: 45,
          color: '#F39C12',
        },
        {
          title: 'Llamada a familia',
          description: 'Llamar a los padres',
          frequency: 'weekly' as const,
          days_of_week: [0], // Domingo
          scheduled_time: '17:00',
          duration: 30,
          color: '#16A085',
        },
        {
          title: 'Planificación semanal',
          description: 'Planificar la semana siguiente',
          frequency: 'weekly' as const,
          days_of_week: [6], // Sábado
          scheduled_time: '09:00',
          duration: 60,
          color: '#8E44AD',
        },
      ]

      // Crear rutinas con rachas inventadas y completados
      const routinesWithStreaks = [
        { routine: demoRoutines[0], current_streak: 7, longest_streak: 12, completionsCount: 7 }, // Ejercicio matutino
        { routine: demoRoutines[1], current_streak: 5, longest_streak: 8, completionsCount: 5 }, // Meditación
        { routine: demoRoutines[2], current_streak: 3, longest_streak: 5, completionsCount: 3 }, // Leer
        { routine: demoRoutines[3], current_streak: 3, longest_streak: 6, completionsCount: 3 }, // Gimnasio
        { routine: demoRoutines[4], current_streak: 2, longest_streak: 4, completionsCount: 2 }, // Yoga
        { routine: demoRoutines[5], current_streak: 2, longest_streak: 3, completionsCount: 2 }, // Revisión de gastos
        { routine: demoRoutines[6], current_streak: 1, longest_streak: 2, completionsCount: 1 }, // Llamada a familia
        { routine: demoRoutines[7], current_streak: 4, longest_streak: 6, completionsCount: 4 }, // Planificación semanal
      ]

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const getDateString = (daysAgo: number) => {
        const date = new Date(today)
        date.setDate(date.getDate() - daysAgo)
        return date.toISOString().split('T')[0]
      }

      const getTimeString = (hour: number, minute: number = 0) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }

      for (const { routine, current_streak, longest_streak, completionsCount } of routinesWithStreaks) {
        const response = await api.createRoutine(routine)
        
        if (response.routine && response.routine.id) {
          // Crear completados para generar historial
          if (completionsCount > 0) {
            if (routine.frequency === 'daily') {
              // Rutinas diarias: crear completados consecutivos desde hoy hacia atrás
              for (let i = 0; i < completionsCount; i++) {
                const [hours, minutes] = routine.scheduled_time?.split(':').map(Number) || [9, 0]
                const completionData = {
                  routine_id: response.routine.id,
                  completed_date: getDateString(i),
                  completed_time: getTimeString(hours, minutes),
                  duration: routine.duration || null,
                }
                await api.createRoutineCompletion(completionData)
              }
            } else if (routine.frequency === 'weekly' && routine.days_of_week) {
              // Rutinas semanales: crear completados en días válidos
              const daysOfWeek = routine.days_of_week
              let count = 0
              for (let i = 0; i < 14 && count < completionsCount; i++) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                if (daysOfWeek.includes(date.getDay())) {
                  const [hours, minutes] = routine.scheduled_time?.split(':').map(Number) || [9, 0]
                  const completionData = {
                    routine_id: response.routine.id,
                    completed_date: getDateString(i),
                    completed_time: getTimeString(hours, minutes),
                    duration: routine.duration || null,
                  }
                  await api.createRoutineCompletion(completionData)
                  count++
                }
              }
            } else if (routine.frequency === 'monthly' && routine.day_of_month) {
              // Rutinas mensuales: crear completados en el día del mes
              const dayOfMonth = routine.day_of_month
              for (let i = 0; i < completionsCount; i++) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, dayOfMonth)
                const [hours, minutes] = routine.scheduled_time?.split(':').map(Number) || [9, 0]
                const completionData = {
                  routine_id: response.routine.id,
                  completed_date: date.toISOString().split('T')[0],
                  completed_time: getTimeString(hours, minutes),
                  duration: routine.duration || null,
                }
                await api.createRoutineCompletion(completionData)
              }
            }
          }
          
          // Actualizar directamente las rachas con valores inventados
          const updateData = {
            title: routine.title, // Campo válido requerido
            current_streak,
            longest_streak,
          }
          try {
            await api.updateRoutine(response.routine.id, updateData)
          } catch (updateErr: any) {
            // Si falla, intentar solo con title para cumplir el requisito mínimo
            await api.updateRoutine(response.routine.id, { title: routine.title })
          }
        }
      }

      // Delay para que el backend procese todo
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsDebugModalOpen(false)
      showNotification('Rutinas demo creadas con rachas iniciadas', 'success')
    } catch (err: any) {
      devError('Error al crear rutinas demo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear las rutinas demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllRoutines = async () => {
    if (!isDestructiveDebugEnabled()) return
    if (
      (await confirm({ message: '¿Estás seguro de que quieres eliminar TODAS las rutinas y sus completaciones? Esta acción es irreversible.', variant: 'danger' }))
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllRoutines()
        setRoutines([])
        setIsDebugModalOpen(false)
        showNotification('Todas las rutinas y completaciones han sido eliminadas', 'success')
      } catch (err: any) {
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar las rutinas. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const hasSearch = searchQuery.trim().length > 0

  const filteredRoutines = useMemo(() => {
    const searched = filterRoutinesByQuery(routines, searchQuery)
    const filtered = filterRoutinesByFrequency(searched, frequencyFilter)
    return sortRoutinesForDisplay(filtered)
  }, [routines, searchQuery, frequencyFilter])

  const routineGroups = useMemo(() => {
    if (hasSearch || frequencyFilter !== 'all') {
      return []
    }
    return groupRoutinesByFrequency(filteredRoutines)
  }, [filteredRoutines, frequencyFilter, hasSearch])

  const frequencyCounts = useMemo(
    () => ({
      all: routines.length,
      daily: routines.filter(routine => routine.frequency === 'daily').length,
      weekly: routines.filter(routine => routine.frequency === 'weekly').length,
      monthly: routines.filter(routine => routine.frequency === 'monthly').length,
    }),
    [routines]
  )
  const highlights = calculateRoutineHighlights(routines)

  const headerMeta = !isLoading && !error
    ? hasSearch
      ? `${filteredRoutines.length} de ${routines.length} rutina${routines.length !== 1 ? 's' : ''}`
      : routines.length === 0
        ? 'Aún no tienes rutinas'
        : `${highlights.total} rutinas · ${highlights.diarias} diarias · ${highlights.conRacha} con racha`
    : undefined

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content rutinas-content lifestyle-sub-content">
        <LifestyleSubHeader
          title="Rutinas"
          context="Hábitos"
          meta={headerMeta}
          toolbarActions={
            isDebugToolsEnabled() ? (
              <div className="lifestyle-sub-menu-container" ref={menuRef}>
                <button
                  className="app-toolbar-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Opciones de depuración"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  <MoreVertIcon className="app-toolbar-icon" />
                </button>
                {isMenuOpen ? (
                  <div className="lifestyle-sub-menu">
                    <button
                      className="lifestyle-sub-menu-item"
                      onClick={() => {
                        setIsDebugModalOpen(true)
                        setIsMenuOpen(false)
                      }}
                      type="button"
                    >
                      🐛 Debug
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />

        {!isLoading && !error && routines.length > 0 ? (
        <CrudSummaryStrip
          ariaLabel="Resumen de rutinas"
          items={[
            { label: 'Total', value: highlights.total, tone: 'info' },
            { label: 'Diarias', value: highlights.diarias, tone: 'available' },
            { label: 'Semanales', value: highlights.semanales, tone: 'info' },
            { label: 'Mensuales', value: highlights.mensuales, tone: 'info' },
            { label: 'Con racha', value: highlights.conRacha, tone: 'available' },
          ]}
        />
        ) : null}

        <div
          className={`lifestyle-toolbar${!isLoading && !error && routines.length === 0 ? ' lifestyle-toolbar--solo-cta' : ''}`}
        >
          {!isLoading && !error && (routines.length > 0 || hasSearch) ? (
            <label className="lifestyle-search">
              <SearchIcon className="lifestyle-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="lifestyle-search-input"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Buscar por título, frecuencia…"
                aria-label="Buscar rutinas"
              />
            </label>
          ) : null}
          {!isLoading && !error && routines.length > 0 ? (
            <button
              type="button"
              className="btn-base btn-secondary lifestyle-toolbar-cta"
              onClick={() => navigate('/tiempo/mi-dia')}
              aria-label="Ir a Mi Día"
            >
              <TodayIcon aria-hidden="true" />
              Mi Día
            </button>
          ) : null}
          <button
            type="button"
            className="btn-base btn-accent btn-submit crud-primary-cta lifestyle-toolbar-cta"
            onClick={handleOpenCreateModal}
            aria-label="Agregar rutina"
          >
            <AddIcon aria-hidden={true} />
            Agregar rutina
          </button>
        </div>

        {!isLoading && !error && routines.length > 0 ? (
          <RutinaFrequencyFilters
            value={frequencyFilter}
            counts={frequencyCounts}
            onChange={setFrequencyFilter}
          />
        ) : null}

        {/* Lista de Rutinas */}
        {isLoading && routines.length === 0 ? (
          <div className="glass-group">
            <ListSkeleton variant="inset-row" count={4} aria-label="Cargando rutinas" />
          </div>
        ) : error && routines.length === 0 ? (
          <div className="loader-container">
            <div className="loader finanzas-stats-error-panel">
              <p className="loader-text loader-text--error" role="alert">
                {error}
              </p>
              <button
                type="button"
                className="btn-base btn-secondary btn-retry"
                onClick={() => void loadRoutines()}
                aria-label="Reintentar cargar rutinas"
              >
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        ) : hasSearch && filteredRoutines.length === 0 ? (
          <div className="empty-state">
            <RepeatIcon className="empty-state-icon" />
            <p className="empty-text">Sin coincidencias</p>
            <p className="empty-subtext">Prueba con otro término o limpia la búsqueda</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="empty-state">
            <RepeatIcon className="empty-state-icon" />
            <p className="empty-text">Aún no tienes rutinas</p>
            <p className="empty-subtext">
              Crea hábitos recurrentes y complétalos cada día desde Mi Día.
            </p>
            <div className="rutinas-empty-actions">
              <button
                type="button"
                className="btn-base btn-accent"
                onClick={handleOpenCreateModal}
              >
                <AddIcon aria-hidden="true" />
                Crear primera rutina
              </button>
              <button
                type="button"
                className="btn-base btn-secondary"
                onClick={() => navigate('/tiempo/mi-dia')}
              >
                <TodayIcon aria-hidden="true" />
                Ver Mi Día
              </button>
            </div>
          </div>
        ) : routineGroups.length > 0 ? (
          <div className="rutinas-sections">
            {routineGroups.map(group => (
              <section key={group.key} className="rutinas-section app-content-section" aria-label={group.label}>
                <h2 className="app-group-label">{group.label}</h2>
                <div className="glass-group">
                  {group.routines.map(routine => (
                    <RutinaListRow
                      key={routine.id}
                      routine={routine}
                      onClick={() => handleOpenDetailModal(routine)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="glass-group">
            {filteredRoutines.map(routine => (
              <RutinaListRow
                key={routine.id}
                routine={routine}
                onClick={() => handleOpenDetailModal(routine)}
              />
            ))}
          </div>
        )}

        {/* Modal de Detalle/Edición/Creación */}
        {isDetailModalOpen && (
          <ModalOverlay onClose={handleCloseDetailModal} className="modal-overlay">
            <div
              className={`modal-panel rutinas-modal lifestyle-modal${isEditMode || !selectedRoutine ? ' lifestyle-modal--form' : ''}`}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title-rutinas"
            >
              <div className="lifestyle-modal__header">
                <div className="lifestyle-modal__header-copy">
                  <p className="lifestyle-modal__kicker">
                    Rutinas ·{' '}
                    {selectedRoutine ? (isEditMode ? 'Editar' : 'Detalle') : 'Nuevo'}
                  </p>
                  <h2 className="modal-panel-title" id="modal-title-rutinas">
                    {selectedRoutine
                      ? isEditMode
                        ? 'Editar rutina'
                        : selectedRoutine.title
                      : 'Nueva rutina'}
                  </h2>
                  {selectedRoutine && !isEditMode ? (
                    <p className="lifestyle-modal__subtitle">{formatRoutineMeta(selectedRoutine)}</p>
                  ) : null}
                </div>
                <div className="lifestyle-modal__header-actions">
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

              {(isEditMode || !selectedRoutine) ? (
                <RutinaFormModalBody
                  formData={formData}
                  formErrors={formErrors}
                  isLoading={isSubmitting}
                  isEditing={Boolean(selectedRoutine && isEditMode)}
                  titleRef={titleRef}
                  dayOfMonthRef={dayOfMonthRef}
                  daysOfWeekRef={daysOfWeekRef}
                  onChange={handleChange}
                  onDayToggle={handleDayToggle}
                  onSubmit={handleSubmit}
                  onCancel={handleFormCancel}
                />
              ) : selectedRoutine ? (
                <RutinaDetailModalBody
                  routine={selectedRoutine}
                  isLoading={isLoading || isSubmitting}
                  onEdit={() => setIsEditMode(true)}
                  onDelete={handleDelete}
                />
              ) : null}
            </div>
        </ModalOverlay>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && isDebugToolsEnabled() && (
          <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-debug-rutinas">Debug - Rutinas</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar modal"
                  type="button"
                >
                  ×
                </button>
              </div>

              <div className="modal-panel-content rutinas-detail-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button create-demo"
                    onClick={handleDebugCreateRoutines}
                    disabled={isLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Rutinas Demo</h3>
                      <p className="debug-option-description">
                        Crea 8 rutinas de ejemplo para pruebas (diarias, semanales, mensuales)
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button delete-all"
                    onClick={handleDeleteAllRoutines}
                    disabled={isLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todas las Rutinas</h3>
                      <p className="debug-option-description">
                        ⚠️ PELIGROSO: Elimina todas las rutinas y sus completaciones (IRREVERSIBLE)
                      </p>
                    </div>
                  </button>
                </div>

                <div className="rutinas-modal-form-actions">
                  <button
                    type="button"
                    className="rutinas-form-button rutinas-form-button-secondary"
                    onClick={() => setIsDebugModalOpen(false)}
                  >
                    Cerrar
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

export default Rutinas
