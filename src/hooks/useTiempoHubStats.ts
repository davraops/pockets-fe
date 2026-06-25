import { useCallback, useEffect, useState } from 'react'
import {
  applyRoutineCompletionToHubData,
  buildTiempoHubData,
  EMPTY_TIEMPO_HUB_DATA,
  type TiempoHubData,
} from '../components/tiempo/tiempoHubUtils'
import { useNotification } from '../contexts/NotificationContext'
import { api } from '../services/api'
import { devError } from '../utils/debugTools'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { persistRoutineCompletion, getRoutineStreakAfterCompletion } from '../utils/routineCompletion'

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function useTiempoHubStats() {
  const { showNotification } = useNotification()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<TiempoHubData>(EMPTY_TIEMPO_HUB_DATA)
  const [completingRoutineId, setCompletingRoutineId] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const today = getTodayDate()
      const [eventsResponse, todayRoutinesResponse, allRoutinesResponse, completionsResponse, diaryResponse, goalsResponse, valuesResponse] =
        await Promise.all([
          api.getEvents(),
          api.getRoutinesByDate(today),
          api.getRoutines(),
          api.getRoutineCompletions({ start_date: today, end_date: today }),
          api.getDiaryEntries(),
          api.getGoals(),
          api.getPersonalValues(),
        ])

      const events = eventsResponse.events ?? []
      const todayRoutines = todayRoutinesResponse.routines ?? []
      const allRoutines = allRoutinesResponse.routines ?? []
      const completions = completionsResponse.completions ?? []
      const diaryEntries = diaryResponse.entries ?? []
      const goals = goalsResponse.goals ?? []
      const personalValues = valuesResponse.entries ?? []

      const completedRoutineIds = new Set<string>(
        completions
          .filter((completion: { completed_date?: string; completedDate?: string }) => {
            const completionDate = (completion.completed_date ?? completion.completedDate ?? '').split('T')[0]
            return completionDate === today
          })
          .map((completion: { routine_id: string }) => completion.routine_id)
      )

      setData(
        buildTiempoHubData({
          events,
          todayRoutines,
          completedRoutineIds,
          allRoutines,
          diaryEntries,
          goals,
          personalValues,
          today,
        })
      )
    } catch (error) {
      devError('Error al cargar hub de Lifestyle:', error)
      setLoadError('No se pudo cargar el resumen de Lifestyle. Intenta de nuevo.')
      setData(EMPTY_TIEMPO_HUB_DATA)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const completeRoutine = useCallback(
    async (routineId: string) => {
      const routine = data.todayRoutines.find(item => item.id === routineId)
      if (!routine || routine.isCompleted || completingRoutineId) {
        return
      }

      const previousData = data
      const streaks = getRoutineStreakAfterCompletion({
        id: routine.id,
        title: routine.title,
        duration: routine.duration,
        current_streak: routine.currentStreak,
        longest_streak: routine.longestStreak,
      })

      setCompletingRoutineId(routineId)
      setData(current =>
        applyRoutineCompletionToHubData(current, routineId, {
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
        })
      )

      try {
        await persistRoutineCompletion({
          id: routine.id,
          title: routine.title,
          duration: routine.duration,
          current_streak: routine.currentStreak,
          longest_streak: routine.longestStreak,
        })
        showNotification(`${routine.title} completada`, 'success')
      } catch (error) {
        setData(previousData)
        const errorMessage = getTranslatedErrorMessage(
          error,
          'Error al completar la rutina. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setCompletingRoutineId(null)
      }
    },
    [completingRoutineId, data, showNotification]
  )

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  return {
    isLoading,
    loadError,
    data,
    stats: data.stats,
    completingRoutineId,
    completeRoutine,
    loadStats,
  }
}
