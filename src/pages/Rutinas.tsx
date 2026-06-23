import { useState, useEffect, useRef } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RepeatIcon from '@mui/icons-material/Repeat'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../services/api'
import { devError, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import './Rutinas.css'

// Interfaz que coincide con la respuesta de la API
interface RoutineAPI {
  id: string
  title: string
  description?: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
  days_of_week?: number[] | null
  day_of_month?: number | null
  scheduled_time?: string | null
  start_date: string
  end_date?: string | null
  is_active: boolean
  color?: string | null
  target_count?: number | null
  duration?: number | null
  current_streak?: number
  longest_streak?: number
  last_completed_date?: string | null
  total_completions?: number
  completions_this_month?: number
  created_at: string
  updated_at: string
}

function Rutinas() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [routines, setRoutines] = useState<RoutineAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineAPI | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const dayOfMonthRef = useRef<HTMLInputElement>(null)
  const daysOfWeekRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    days_of_week: [] as number[],
    day_of_month: null as number | null,
    scheduled_time: '',
    color: '#007AFF',
    duration: null as number | null,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadRoutines()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.rutinas-toolbar-menu-container')) {
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
    setFormData({
      title: '',
      description: '',
      frequency: 'daily',
      days_of_week: [],
      day_of_month: null,
      scheduled_time: '',
      color: '#007AFF',
      duration: null,
    })
    setFormErrors({})
  }

  const handleOpenDetailModal = (routine: RoutineAPI) => {
    setSelectedRoutine(routine)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      title: routine.title,
      description: routine.description || '',
      frequency: routine.frequency,
      days_of_week: routine.days_of_week || [],
      day_of_month: routine.day_of_month ?? null,
      scheduled_time: routine.scheduled_time ? routine.scheduled_time.slice(0, 5) : '',
      color: routine.color || '#007AFF',
      duration: routine.duration ?? null,
    })
    setFormErrors({})
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedRoutine(null)
    setIsEditMode(false)
    setFormData({
      title: '',
      description: '',
      frequency: 'daily',
      days_of_week: [],
      day_of_month: null,
      scheduled_time: '',
      color: '#007AFF',
      duration: null,
    })
    setFormErrors({})
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
      setIsLoading(true)

      const routineData: any = {
        title: formData.title.trim(),
        frequency: formData.frequency,
      }

      if (formData.description) {
        routineData.description = formData.description.trim()
      }

      // Limpiar y establecer campos según la frecuencia
      routineData.days_of_week = null
      routineData.day_of_month = null

      // Solo establecer el campo relevante según la frecuencia
      if (formData.frequency === 'weekly') {
        routineData.days_of_week = formData.days_of_week.length > 0 ? formData.days_of_week : null
      } else if (formData.frequency === 'monthly') {
        routineData.day_of_month = formData.day_of_month !== null ? formData.day_of_month : null
      }
      // Para 'daily', ambos campos quedan en null

      if (formData.scheduled_time) {
        routineData.scheduled_time = formData.scheduled_time
      }

      routineData.color = formData.color

      if (formData.duration !== null && formData.duration !== undefined) {
        routineData.duration = formData.duration
      }

      if (selectedRoutine) {
        // Modo edición
        const updateResponse = await api.updateRoutine(selectedRoutine.id, routineData)
        
        // Recargar todas las rutinas
        await loadRoutines()
        
        // Recargar la rutina específica para actualizar el modal
        const updatedRoutineResponse = await api.getRoutines(selectedRoutine.id)
        if (updatedRoutineResponse.routines && updatedRoutineResponse.routines.length > 0) {
          const updatedRoutine = updatedRoutineResponse.routines[0]
          setSelectedRoutine(updatedRoutine)
          // Actualizar el formData con los nuevos datos
          setFormData({
            title: updatedRoutine.title,
            description: updatedRoutine.description || '',
            frequency: updatedRoutine.frequency,
            days_of_week: updatedRoutine.days_of_week || [],
            day_of_month: updatedRoutine.day_of_month ?? null,
            scheduled_time: updatedRoutine.scheduled_time ? updatedRoutine.scheduled_time.slice(0, 5) : '',
            color: updatedRoutine.color || '#007AFF',
            duration: updatedRoutine.duration ?? null,
          })
        }
        showNotification('Rutina actualizada exitosamente', 'success')
      } else {
        // Modo creación
        const createResponse = await api.createRoutine(routineData)
        
        // Recargar todas las rutinas
        await loadRoutines()
        
        // Cerrar el modal
        handleCloseDetailModal()
        showNotification('Rutina creada exitosamente', 'success')
      }
      
      setIsEditMode(false)
      showNotification('Rutina actualizada exitosamente', 'success')
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar la rutina. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
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

  const formatFrequency = (frequency: string): string => {
    switch (frequency) {
      case 'daily':
        return 'Diaria'
      case 'weekly':
        return 'Semanal'
      case 'monthly':
        return 'Mensual'
      default:
        return frequency
    }
  }

  const formatDaysOfWeek = (days: number[] | null | undefined): string => {
    if (!days || days.length === 0) return ''
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const sortedDays = [...days].sort((a, b) => a - b)
    return sortedDays.map(day => dayNames[day]).join(', ')
  }

  const formatDayOfMonth = (day: number | null | undefined): string => {
    if (day === null || day === undefined) return ''
    return `Día ${day} del mes`
  }

  const daysOfWeekOptions = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
  ]

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

  const calculateHighlights = () => {
    const total = routines.length
    const diarias = routines.filter(r => r.frequency === 'daily').length
    const semanales = routines.filter(r => r.frequency === 'weekly').length
    const conRacha = routines.filter(r => (r.current_streak ?? 0) > 0).length

    return { total, diarias, semanales, conRacha }
  }

  const highlights = calculateHighlights()

  const formatRoutineMeta = (routine: RoutineAPI) => {
    const parts = [formatFrequency(routine.frequency)]
    if (routine.frequency === 'weekly' && routine.days_of_week?.length) {
      parts.push(formatDaysOfWeek(routine.days_of_week))
    }
    if (routine.frequency === 'monthly' && routine.day_of_month != null) {
      parts.push(formatDayOfMonth(routine.day_of_month))
    }
    if (routine.scheduled_time) parts.push(routine.scheduled_time.slice(0, 5))
    return parts.join(' • ')
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content rutinas-content">
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

        <h1 className="app-page-title">Rutinas</h1>

        <div className="crud-summary-strip" role="region" aria-label="Resumen de rutinas">
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Total</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--info">
              {highlights.total}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Diarias</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--available">
              {highlights.diarias}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Semanales</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--info">
              {highlights.semanales}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Con racha</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--info">
              {highlights.conRacha}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={handleOpenCreateModal}
          aria-label="Agregar rutina"
        >
          <AddIcon aria-hidden={true} />
          Agregar rutina
        </button>

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
                className="btn-base btn-secondary finanzas-stats-retry-button"
                onClick={() => void loadRoutines()}
                aria-label="Reintentar cargar rutinas"
              >
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        ) : routines.length === 0 ? (
          <div className="empty-state">
            <RepeatIcon className="empty-state-icon" />
            <p className="empty-text">No hay rutinas registradas aún</p>
            <p className="empty-subtext">Usa el botón de arriba para agregar la primera</p>
          </div>
        ) : (
          <div className="glass-group">
            {routines.map(routine => (
              <button
                key={routine.id}
                type="button"
                className="crud-inset-row crud-row-accent-green"
                onClick={() => handleOpenDetailModal(routine)}
                aria-label={`Ver rutina ${routine.title}`}
              >
                <div className="crud-row-content">
                  <div className="crud-row-header">
                    <div className="crud-row-title-section">
                      {routine.color && (
                        <span
                          className="crud-row-icon"
                          style={{ color: routine.color }}
                          aria-hidden="true"
                        >
                          ●
                        </span>
                      )}
                      <span className="crud-row-title">{routine.title}</span>
                    </div>
                    {(routine.current_streak ?? 0) > 0 && (
                      <span className="crud-row-value">{routine.current_streak}d</span>
                    )}
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </div>
                  <p className="crud-row-meta">{formatRoutineMeta(routine)}</p>
                  {routine.description && (
                    <p className="crud-row-preview">{routine.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Modal de Detalle/Edición/Creación */}
        {isDetailModalOpen && (
          <ModalOverlay onClose={handleCloseDetailModal} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-selectedroutine-iseditmode-editar-rutina-selectedroutine-title-crear-rutina">
                  {selectedRoutine 
                    ? (isEditMode ? 'Editar Rutina' : selectedRoutine.title)
                    : 'Crear Rutina'
                  }
                </h2>
                <div className="rutinas-modal-actions">
                  {selectedRoutine && !isEditMode && (
                    <>
                      <button
                        className="rutinas-modal-action-button"
                        onClick={() => setIsEditMode(true)}
                        aria-label="Editar"
                        type="button"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="rutinas-modal-action-button rutinas-modal-delete-button"
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

              {(isEditMode || !selectedRoutine) ? (
                <form onSubmit={handleSubmit} className="rutinas-modal-form" noValidate>
                  {/* Advertencia sobre cambios - Solo en modo edición */}
                  {selectedRoutine && isEditMode && (
                    <div className="rutinas-warning-message">
                      <div className="rutinas-warning-icon">⚠️</div>
                      <div className="rutinas-warning-content">
                        <p className="rutinas-warning-title">Advertencia sobre cambios</p>
                        <p className="rutinas-warning-text">
                          Modificar la frecuencia, días de la semana o día del mes de esta rutina puede afectar tus rachas existentes. 
                          Recuerda que una rutina es un compromiso contigo mismo para cumplirla desde el principio.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rutinas-form-group">
                    <label htmlFor="title" className="form-label-base">
                      Título *
                    </label>
                    <input
                      ref={titleRef}
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`form-input-base ${formErrors.title  ? 'input-error' : ''}`}
                      placeholder="Ej: Ejercicio matutino"
                      autoFocus={!selectedRoutine}
                      aria-invalid={!!formErrors.title}
                      {...(formErrors.title ? { 'aria-describedby': 'title-error' } : {})}
                    />
                    {formErrors.title && (
                      <span id="title-error" className="rutinas-form-error" role="alert">
                        {formErrors.title}
                      </span>
                    )}
                  </div>

                  <div className="rutinas-form-group">
                    <label htmlFor="description" className="form-label-base">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-textarea-base"
                      rows={3}
                      placeholder="Descripción de la rutina (opcional)"
                    />
                  </div>

                  <div className="rutinas-form-group">
                    <label htmlFor="frequency" className="form-label-base">
                      Frecuencia *
                    </label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className={`form-select-base ${formErrors.frequency ? 'input-error' : ''}`}
                    >
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>

                  {formData.frequency === 'weekly' && (
                    <div className="rutinas-form-group">
                      <label className="form-label-base">Días de la semana *</label>
                      <div id="days-of-week-group" ref={daysOfWeekRef} className="rutinas-days-selector">
                        {daysOfWeekOptions.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            className={`rutinas-day-button ${formData.days_of_week.includes(day.value) ? 'selected' : ''}`}
                            onClick={() => handleDayToggle(day.value)}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      {formErrors.days_of_week && (
                        <span id="days-of-week-error" className="rutinas-form-error" role="alert">
                          {formErrors.days_of_week}
                        </span>
                      )}
                    </div>
                  )}

                  {formData.frequency === 'monthly' && (
                    <div className="rutinas-form-group">
                      <label htmlFor="day_of_month" className="form-label-base">
                        Día del mes *
                      </label>
                      <input
                        ref={dayOfMonthRef}
                        type="number"
                        id="day_of_month"
                        name="day_of_month"
                        value={formData.day_of_month ?? ''}
                        onChange={handleChange}
                        min="1"
                        max="31"
                        className={`form-input-base ${formErrors.day_of_month  ? 'input-error' : ''}`}
                        placeholder="1-31"
                        aria-invalid={!!formErrors.day_of_month}
                        {...(formErrors.day_of_month ? { 'aria-describedby': 'day-of-month-error' } : {})}
                      />
                      {formErrors.day_of_month && (
                        <span id="day-of-month-error" className="rutinas-form-error" role="alert">
                          {formErrors.day_of_month}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="rutinas-form-group">
                    <label htmlFor="scheduled_time" className="form-label-base">
                      Hora programada
                    </label>
                    <input
                      type="time"
                      id="scheduled_time"
                      name="scheduled_time"
                      value={formData.scheduled_time}
                      onChange={handleChange}
                      className="form-input-base"
                    />
                  </div>

                  <div className="rutinas-form-group">
                    <label htmlFor="duration" className="form-label-base">
                      Duración esperada (minutos)
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration ?? ''}
                      onChange={handleChange}
                      min="0"
                      className="form-input-base"
                      placeholder="Ej: 30"
                    />
                    <p className="rutinas-form-help-text">
                      Duración estimada que tomará completar esta rutina (opcional)
                    </p>
                  </div>

                  <div className="rutinas-form-group">
                    <label htmlFor="color" className="form-label-base">
                      Color
                    </label>
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="rutinas-form-color-input"
                    />
                  </div>

                  <div className="rutinas-modal-form-actions">
                    <button
                      type="button"
                      className="rutinas-form-button rutinas-form-button-secondary"
                      onClick={() => setIsEditMode(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rutinas-form-button rutinas-form-button-primary"
                      disabled={isLoading}
                    >
                      {isLoading 
                        ? (selectedRoutine ? 'Guardando...' : 'Creando...') 
                        : (selectedRoutine ? 'Guardar Cambios' : 'Crear Rutina')
                      }
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rutinas-detail-content">
                  {selectedRoutine.description && (
                    <div className="rutinas-detail-section">
                      <h3 className="rutinas-detail-label">Descripción</h3>
                      <p className="rutinas-detail-value">{selectedRoutine.description}</p>
                    </div>
                  )}

                  <div className="rutinas-detail-section">
                    <h3 className="rutinas-detail-label">Frecuencia</h3>
                    <p className="rutinas-detail-value">{formatFrequency(selectedRoutine.frequency)}</p>
                  </div>

                  {selectedRoutine.frequency === 'weekly' && selectedRoutine.days_of_week && selectedRoutine.days_of_week.length > 0 && (
                    <div className="rutinas-detail-section">
                      <h3 className="rutinas-detail-label">Días de la semana</h3>
                      <p className="rutinas-detail-value">{formatDaysOfWeek(selectedRoutine.days_of_week)}</p>
                    </div>
                  )}

                  {selectedRoutine.frequency === 'monthly' && selectedRoutine.day_of_month !== null && selectedRoutine.day_of_month !== undefined && (
                    <div className="rutinas-detail-section">
                      <h3 className="rutinas-detail-label">Día del mes</h3>
                      <p className="rutinas-detail-value">Día {selectedRoutine.day_of_month}</p>
                    </div>
                  )}

                  {selectedRoutine.scheduled_time && (
                    <div className="rutinas-detail-section">
                      <h3 className="rutinas-detail-label">Hora programada</h3>
                      <p className="rutinas-detail-value">{selectedRoutine.scheduled_time.slice(0, 5)}</p>
                    </div>
                  )}

                  {selectedRoutine.duration !== null && selectedRoutine.duration !== undefined && (
                    <div className="rutinas-detail-section">
                      <h3 className="rutinas-detail-label">Duración esperada</h3>
                      <p className="rutinas-detail-value">{selectedRoutine.duration} minutos</p>
                    </div>
                  )}

                  <div className="rutinas-detail-stats">
                    <div className="rutinas-detail-stat">
                      <h3 className="rutinas-detail-label">Racha actual</h3>
                      <p className="rutinas-detail-value rutinas-detail-streak">
                        <LocalFireDepartmentIcon className="rutinas-detail-streak-icon" />
                        {selectedRoutine.current_streak !== undefined ? selectedRoutine.current_streak : 0} días
                      </p>
                    </div>
                    <div className="rutinas-detail-stat">
                      <h3 className="rutinas-detail-label">Racha más larga</h3>
                      <p className="rutinas-detail-value">
                        {selectedRoutine.longest_streak !== undefined ? selectedRoutine.longest_streak : 0} días
                      </p>
                    </div>
                    <div className="rutinas-detail-stat">
                      <h3 className="rutinas-detail-label">Total completados</h3>
                      <p className="rutinas-detail-value rutinas-detail-completions">
                        <CheckCircleIcon className="rutinas-detail-completions-icon" />
                        {selectedRoutine.total_completions !== undefined ? selectedRoutine.total_completions : 0}
                      </p>
                    </div>
                    {selectedRoutine.completions_this_month !== undefined && selectedRoutine.completions_this_month > 0 && (
                      <div className="rutinas-detail-stat">
                        <h3 className="rutinas-detail-label">Completados este mes</h3>
                        <p className="rutinas-detail-value">{selectedRoutine.completions_this_month}</p>
                      </div>
                    )}
                    {selectedRoutine.last_completed_date && (
                      <div className="rutinas-detail-stat">
                        <h3 className="rutinas-detail-label">Último completado</h3>
                        <p className="rutinas-detail-value">
                          {new Date(selectedRoutine.last_completed_date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

              <div className="rutinas-detail-content">
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
