import { useState, useEffect, useMemo } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate } from 'react-router-dom'
import RepeatIcon from '@mui/icons-material/Repeat'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import ListSkeleton from '../components/ListSkeleton'
import MiDiaRoutineRow from '../components/miDia/MiDiaRoutineRow'
import LifestyleSubHeader from '../components/tiempo/LifestyleSubHeader'
import {
  filterMiDiaEventsByQuery,
  partitionTodayRoutineEvents,
  type MiDiaRoutineEvent,
} from '../components/miDia/miDiaDisplayUtils'
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

function MiDia() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [todayRoutines, setTodayRoutines] = useState<MiDiaRoutineEvent[]>([])
  const [weekRoutines, setWeekRoutines] = useState<MiDiaRoutineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const getTodayDate = () => new Date().toISOString().split('T')[0]

  const getWeekDates = () => {
    const dates: string[] = []
    const today = new Date()
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(today)
      date.setDate(today.getDate() + index)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const loadRoutines = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const today = getTodayDate()
      const weekDates = getWeekDates()

      const todayResponse = await api.getRoutinesByDate(today)
      const todayRoutinesData = todayResponse.routines || []

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

      const completionsResponse = await api.getRoutineCompletions({
        start_date: today,
        end_date: today,
      })
      const completions = completionsResponse.completions || []

      const todayCompletions = completions.filter((completion: { completed_date?: string; completedDate?: string }) => {
        const completionDate = completion.completed_date ?? completion.completedDate
        if (!completionDate) {
          return false
        }
        return completionDate.split('T')[0] === today
      })

      const completedRoutineIds = new Set(
        todayCompletions.map((completion: { routine_id: string }) => completion.routine_id)
      )

      const todayEvents: MiDiaRoutineEvent[] = todayRoutinesData.map((routine: RoutineAPI) => {
        const completion = todayCompletions.find(
          (item: { routine_id: string }) => item.routine_id === routine.id
        )
        return {
          routine,
          isCompleted: completedRoutineIds.has(routine.id),
          ...(completion?.id ? { completionId: completion.id } : {}),
        }
      })

      setTodayRoutines(todayEvents)

      const weekEvents: MiDiaRoutineEvent[] = weekRoutinesData
        .filter(
          (routine: RoutineAPI) =>
            !todayRoutinesData.some((todayRoutine: RoutineAPI) => todayRoutine.id === routine.id)
        )
        .map((routine: RoutineAPI) => ({
          routine,
          isCompleted: false,
        }))

      setWeekRoutines(weekEvents)
    } catch (err: unknown) {
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
    void loadRoutines()
  }, [])

  const handleCompleteRoutine = async (routine: RoutineAPI) => {
    const previousRoutines = todayRoutines

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

      const currentStreak = (routine.current_streak || 0) + 1
      const longestStreak = Math.max(routine.longest_streak || 0, currentStreak)

      setTodayRoutines(previous =>
        previous.map(event =>
          event.routine.id === routine.id
            ? {
                ...event,
                routine: {
                  ...event.routine,
                  current_streak: currentStreak,
                  longest_streak: longestStreak,
                },
                isCompleted: true,
              }
            : event
        )
      )

      showNotification(`${routine.title} completada`, 'success')

      try {
        await Promise.all([
          api.createRoutineCompletion(completionData),
          api.updateRoutine(routine.id, {
            title: routine.title,
            current_streak: currentStreak,
            longest_streak: longestStreak,
          }),
        ])
      } catch (backendErr: unknown) {
        setTodayRoutines(previousRoutines)
        const errorMessage = getTranslatedErrorMessage(
          backendErr,
          'Error al guardar el completado. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      }
    } catch (err: unknown) {
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

  const hasSearch = searchQuery.trim().length > 0
  const hasAnyRoutines = todayRoutines.length > 0 || weekRoutines.length > 0

  const filteredToday = useMemo(
    () => filterMiDiaEventsByQuery(todayRoutines, searchQuery),
    [todayRoutines, searchQuery]
  )
  const filteredWeek = useMemo(
    () => filterMiDiaEventsByQuery(weekRoutines, searchQuery),
    [weekRoutines, searchQuery]
  )
  const { pending, completed } = useMemo(
    () => partitionTodayRoutineEvents(filteredToday),
    [filteredToday]
  )

  const highlights = {
    hoy: todayRoutines.length,
    completadas: todayRoutines.filter(event => event.isCompleted).length,
    semana: weekRoutines.length,
  }

  const showStrip = !isLoading && !error && hasAnyRoutines

  const headerMeta = !isLoading && !error
    ? hasSearch
      ? `${filteredToday.length + filteredWeek.length} de ${todayRoutines.length + weekRoutines.length} rutina${todayRoutines.length + weekRoutines.length !== 1 ? 's' : ''}`
      : highlights.hoy === 0
        ? 'Sin rutinas programadas hoy'
        : `${highlights.completadas}/${highlights.hoy} completadas · ${highlights.semana} esta semana`
    : undefined

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content midia-content lifestyle-sub-content">
        <LifestyleSubHeader title="Mi Día" context="Operativo" meta={headerMeta} />

        {showStrip ? (
          <CrudSummaryStrip
            ariaLabel="Resumen del día"
            items={[
              { label: 'Hoy', value: highlights.hoy, tone: 'info' },
              { label: 'Completadas', value: highlights.completadas, tone: 'available' },
              { label: 'Esta semana', value: highlights.semana, tone: 'info' },
            ]}
          />
        ) : null}

        <div
          className={`lifestyle-toolbar${!isLoading && !error && !hasAnyRoutines ? ' lifestyle-toolbar--solo-cta' : ''}`}
        >
          {!isLoading && !error && (hasAnyRoutines || hasSearch) ? (
            <label className="lifestyle-search">
              <SearchIcon className="lifestyle-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="lifestyle-search-input"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Buscar rutinas de hoy o de la semana…"
                aria-label="Buscar rutinas"
              />
            </label>
          ) : null}
          <button
            type="button"
            className="btn-base btn-secondary btn-submit lifestyle-toolbar-cta"
            onClick={() => navigate('/tiempo/rutinas')}
            aria-label="Gestionar rutinas"
          >
            <RepeatIcon aria-hidden={true} />
            Gestionar rutinas
          </button>
        </div>

        <section className="midia-section" aria-label="Rutinas de hoy">
          {isLoading && todayRoutines.length === 0 ? (
            <div className="glass-group">
              <ListSkeleton variant="inset-row" count={3} aria-label="Cargando rutinas de hoy" />
            </div>
          ) : error ? (
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
          ) : hasSearch && pending.length === 0 && completed.length === 0 ? (
            <div className="empty-state">
              <RepeatIcon className="empty-state-icon" />
              <p className="empty-text">Sin coincidencias hoy</p>
              <p className="empty-subtext">Prueba con otro término o limpia la búsqueda</p>
            </div>
          ) : todayRoutines.length === 0 ? (
            <div className="empty-state">
              <RepeatIcon className="empty-state-icon" />
              <p className="empty-text">No hay rutinas programadas para hoy</p>
              <p className="empty-subtext">Usa Gestionar rutinas para crear o editar las tuyas</p>
            </div>
          ) : (
            <>
              {pending.length > 0 ? (
                <div className="midia-subsection">
                  <h2 className="midia-section-title">
                    Pendientes{hasSearch ? '' : ` (${pending.length})`}
                  </h2>
                  <div className="glass-group">
                    {pending.map(event => (
                      <MiDiaRoutineRow
                        key={event.routine.id}
                        event={event}
                        variant="today"
                        isBusy={isLoading}
                        onComplete={() => void handleCompleteRoutine(event.routine as RoutineAPI)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {completed.length > 0 ? (
                <div className="midia-subsection">
                  <h2 className="midia-section-title">
                    Completadas{hasSearch ? '' : ` (${completed.length})`}
                  </h2>
                  <div className="glass-group">
                    {completed.map(event => (
                      <MiDiaRoutineRow
                        key={event.routine.id}
                        event={event}
                        variant="today"
                        isBusy={isLoading}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        {!isLoading && !error && (hasSearch ? filteredWeek.length > 0 : weekRoutines.length > 0) ? (
          <section className="midia-section" aria-label="Rutinas de la semana">
            <h2 className="midia-section-title">
              Esta semana ({hasSearch ? filteredWeek.length : weekRoutines.length})
            </h2>
            <div className="glass-group">
              {filteredWeek.map(event => (
                <MiDiaRoutineRow key={event.routine.id} event={event} variant="week" />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

export default MiDia
