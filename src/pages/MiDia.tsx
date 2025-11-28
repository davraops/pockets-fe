import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './MiDia.css'

interface RoutineAPI {
  id: string
  title: string
  description?: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
  days_of_week?: number[] | null
  day_of_month?: number | null
  scheduled_time?: string | null
  duration?: number | null
  color?: string | null
  current_streak?: number
  longest_streak?: number
  total_completions?: number
  last_completed_date?: string | null
  completions_this_month?: number
}

interface RoutineEvent {
  routine: RoutineAPI
  isCompleted: boolean
  completionId?: string
  completedDate?: string
}

function MiDia() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [todayRoutines, setTodayRoutines] = useState<RoutineEvent[]>([])
  const [weekRoutines, setWeekRoutines] = useState<RoutineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtener fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Obtener fechas de la semana (hoy + 6 días más)
  const getWeekDates = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  // Cargar rutinas y completados
  const loadRoutines = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const today = getTodayDate()
      const weekDates = getWeekDates()

      // Obtener rutinas de hoy
      const todayResponse = await api.getRoutinesByDate(today)
      const todayRoutinesData = todayResponse.routines || []

      // Obtener rutinas de la semana (sin duplicados)
      const weekRoutinesMap = new Map<string, RoutineAPI>()
      for (const date of weekDates) {
        const response = await api.getRoutinesByDate(date)
        const routines = response.routines || []
        routines.forEach((routine: RoutineAPI) => {
          if (!weekRoutinesMap.has(routine.id)) {
            weekRoutinesMap.set(routine.id, routine)
          }
        })
      }
      const weekRoutinesData = Array.from(weekRoutinesMap.values())

      // Obtener completados del día
      const completionsResponse = await api.getRoutineCompletions({
        start_date: today,
        end_date: today,
      })
      const completions = completionsResponse.completions || []
      
      // Filtrar solo completados que realmente sean de hoy (validación adicional)
      // Normalizar fechas para comparación (remover hora si existe)
      const todayCompletions = completions.filter((c: any) => {
        const completionDate = c.completed_date || c.completedDate
        if (!completionDate) return false
        // Normalizar fecha: tomar solo la parte de fecha (YYYY-MM-DD)
        const normalizedDate = completionDate.split('T')[0]
        return normalizedDate === today
      })
      
      const completedRoutineIds = new Set(
        todayCompletions.map((c: any) => c.routine_id)
      )

      // Crear eventos de hoy
      const todayEvents: RoutineEvent[] = todayRoutinesData.map((routine: RoutineAPI) => {
        const completion = todayCompletions.find((c: any) => c.routine_id === routine.id)
        return {
          routine,
          isCompleted: completedRoutineIds.has(routine.id),
          completionId: completion?.id,
          completedDate: completion?.completed_date || completion?.completedDate,
        }
      })

      // Función para ordenar por hora programada
      const sortByScheduledTime = (a: RoutineEvent, b: RoutineEvent) => {
        const timeA = a.routine.scheduled_time || ''
        const timeB = b.routine.scheduled_time || ''
        
        // Si ambas tienen hora, comparar por hora
        if (timeA && timeB) {
          return timeA.localeCompare(timeB)
        }
        // Si solo una tiene hora, la que tiene hora va primero
        if (timeA && !timeB) return -1
        if (!timeA && timeB) return 1
        // Si ninguna tiene hora, mantener orden original
        return 0
      }

      // Separar pendientes y completadas
      const pending = todayEvents.filter(e => !e.isCompleted).sort(sortByScheduledTime)
      const completed = todayEvents.filter(e => e.isCompleted).sort(sortByScheduledTime)
      // Ordenar: pendientes primero (ordenadas por hora), completadas al final (ordenadas por hora)
      setTodayRoutines([...pending, ...completed])

      // Crear eventos de la semana (excluir las de hoy)
      const weekEvents: RoutineEvent[] = weekRoutinesData
        .filter((routine: RoutineAPI) => !todayRoutinesData.some((tr: RoutineAPI) => tr.id === routine.id))
        .map((routine: RoutineAPI) => ({
          routine,
          isCompleted: false,
        }))

      setWeekRoutines(weekEvents)
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

  useEffect(() => {
    loadRoutines()
  }, [])

  // Marcar rutina como completada
  const handleCompleteRoutine = async (routine: RoutineAPI) => {
    try {
      setIsLoading(true)
      const today = getTodayDate()
      const now = new Date()
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      const completionData = {
        routine_id: routine.id,
        completed_date: today,
        completed_time: timeString,
        duration: routine.duration || null,
      }

      // Calcular nuevos valores de racha
      const currentStreak = (routine.current_streak || 0) + 1
      const longestStreak = Math.max(routine.longest_streak || 0, currentStreak)

      // Guardar estado anterior para poder revertir en caso de error
      const previousRoutines = todayRoutines

      // Función para ordenar por hora programada
      const sortByScheduledTime = (a: RoutineEvent, b: RoutineEvent) => {
        const timeA = a.routine.scheduled_time || ''
        const timeB = b.routine.scheduled_time || ''
        
        // Si ambas tienen hora, comparar por hora
        if (timeA && timeB) {
          return timeA.localeCompare(timeB)
        }
        // Si solo una tiene hora, la que tiene hora va primero
        if (timeA && !timeB) return -1
        if (!timeA && timeB) return 1
        // Si ninguna tiene hora, mantener orden original
        return 0
      }

      // Actualización optimista: marcar como completada y actualizar racha inmediatamente
      setTodayRoutines(prevRoutines => {
        const updatedRoutines = prevRoutines.map(event => {
          if (event.routine.id === routine.id) {
            return {
              ...event,
              routine: {
                ...event.routine,
                current_streak: currentStreak,
                longest_streak: longestStreak,
              },
              isCompleted: true,
              completedDate: today,
            }
          }
          return event
        })
        
        // Reordenar: pendientes primero (ordenadas por hora), completadas al final (ordenadas por hora)
        const pending = updatedRoutines.filter(e => !e.isCompleted).sort(sortByScheduledTime)
        const completed = updatedRoutines.filter(e => e.isCompleted).sort(sortByScheduledTime)
        return [...pending, ...completed]
      })

      showNotification(`${routine.title} completada`, 'success')

      // Enviar al backend (en segundo plano, sin bloquear la UI)
      try {
        await Promise.all([
          api.createRoutineCompletion(completionData),
          api.updateRoutine(routine.id, {
            title: routine.title,
            current_streak: currentStreak,
            longest_streak: longestStreak,
          })
        ])
      } catch (backendErr: any) {
        // Si falla, revertir actualización optimista
        setTodayRoutines(previousRoutines)
        const errorMessage = getTranslatedErrorMessage(
          backendErr,
          'Error al guardar el completado. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      }
    } catch (err: any) {
      // Revertir actualización optimista en caso de error
      await loadRoutines()
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al completar la rutina. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    return timeString.slice(0, 5)
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
    return `Día ${day}`
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content midia-content">
        {/* Toolbar */}
        <div className="midia-toolbar">
          <button
            className="midia-toolbar-button"
            onClick={() => navigate('/tiempo')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="midia-toolbar-icon" />
          </button>
        </div>

        <h1 className="midia-page-title">Mi Día</h1>
        <p className="midia-page-subtitle">Gestiona tus rutinas del día y la semana</p>

        {/* Rutinas de Hoy */}
        <div className="midia-section">
          <h2 className="midia-section-title">Hoy</h2>
          {isLoading ? (
            <div className="midia-empty-state">
              <p>Cargando rutinas...</p>
            </div>
          ) : error ? (
            <div className="midia-empty-state">
              <p>{error}</p>
            </div>
          ) : todayRoutines.length === 0 ? (
            <div className="midia-empty-state">
              <p className="empty-state-text">No hay rutinas programadas para hoy</p>
            </div>
          ) : (
            <div className="midia-routines-list">
              {todayRoutines.map(event => (
                <div
                  key={event.routine.id}
                  className={`midia-routine-item ${event.isCompleted ? 'completed' : ''}`}
                >
                  <button
                    className="midia-routine-check"
                    onClick={() => !event.isCompleted && handleCompleteRoutine(event.routine)}
                    disabled={event.isCompleted || isLoading}
                    aria-label={event.isCompleted ? 'Completada' : 'Marcar como completada'}
                    type="button"
                  >
                    {event.isCompleted ? (
                      <CheckCircleIcon className="midia-check-icon completed" />
                    ) : (
                      <RadioButtonUncheckedIcon className="midia-check-icon" />
                    )}
                  </button>
                  <div className="midia-routine-content">
                    <div className="midia-routine-header">
                      {event.routine.color && (
                        <div
                          className="midia-routine-color-indicator"
                          style={{ backgroundColor: event.routine.color }}
                        />
                      )}
                      <h3 className="midia-routine-title">{event.routine.title}</h3>
                    </div>
                    {event.routine.description && (
                      <p className="midia-routine-description">{event.routine.description}</p>
                    )}
                    <div className="midia-routine-meta">
                      <span className="midia-routine-frequency">
                        {formatFrequency(event.routine.frequency)}
                      </span>
                      {event.routine.frequency === 'weekly' && event.routine.days_of_week && event.routine.days_of_week.length > 0 && (
                        <span className="midia-routine-days">
                          {formatDaysOfWeek(event.routine.days_of_week)}
                        </span>
                      )}
                      {event.routine.frequency === 'monthly' && event.routine.day_of_month !== null && event.routine.day_of_month !== undefined && (
                        <span className="midia-routine-days">
                          {formatDayOfMonth(event.routine.day_of_month)}
                        </span>
                      )}
                      {event.routine.scheduled_time && (
                        <span className="midia-routine-time">
                          <AccessTimeIcon className="midia-routine-time-icon" />
                          {formatTime(event.routine.scheduled_time)}
                        </span>
                      )}
                      {event.routine.duration !== null && event.routine.duration !== undefined && (
                        <span className="midia-routine-duration">
                          {event.routine.duration} min
                        </span>
                      )}
                      {event.routine.current_streak !== undefined && event.routine.current_streak > 0 && (
                        <span className="midia-routine-streak">
                          <LocalFireDepartmentIcon className="midia-routine-streak-icon" />
                          {event.routine.current_streak} {event.routine.current_streak === 1 ? 'día' : 'días'}
                        </span>
                      )}
                      {event.routine.total_completions !== undefined && event.routine.total_completions > 0 && (
                        <span className="midia-routine-completions">
                          <CheckCircleIcon className="midia-routine-completions-icon" />
                          {event.routine.total_completions} {event.routine.total_completions === 1 ? 'completado' : 'completados'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rutinas de la Semana */}
        {weekRoutines.length > 0 && (
          <div className="midia-section">
            <h2 className="midia-section-title">Esta Semana</h2>
            <div className="midia-routines-list">
              {weekRoutines.map(event => (
                <div
                  key={event.routine.id}
                  className="midia-routine-item week"
                >
                  <div className="midia-routine-content">
                    <div className="midia-routine-header">
                      {event.routine.color && (
                        <div
                          className="midia-routine-color-indicator"
                          style={{ backgroundColor: event.routine.color }}
                        />
                      )}
                      <h3 className="midia-routine-title">{event.routine.title}</h3>
                    </div>
                    {event.routine.description && (
                      <p className="midia-routine-description">{event.routine.description}</p>
                    )}
                    <div className="midia-routine-meta">
                      <span className="midia-routine-frequency">
                        {formatFrequency(event.routine.frequency)}
                      </span>
                      {event.routine.frequency === 'weekly' && event.routine.days_of_week && event.routine.days_of_week.length > 0 && (
                        <span className="midia-routine-days">
                          {formatDaysOfWeek(event.routine.days_of_week)}
                        </span>
                      )}
                      {event.routine.frequency === 'monthly' && event.routine.day_of_month !== null && event.routine.day_of_month !== undefined && (
                        <span className="midia-routine-days">
                          {formatDayOfMonth(event.routine.day_of_month)}
                        </span>
                      )}
                      {event.routine.scheduled_time && (
                        <span className="midia-routine-time">
                          <AccessTimeIcon className="midia-routine-time-icon" />
                          {formatTime(event.routine.scheduled_time)}
                        </span>
                      )}
                      {event.routine.duration !== null && event.routine.duration !== undefined && (
                        <span className="midia-routine-duration">
                          {event.routine.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MiDia

