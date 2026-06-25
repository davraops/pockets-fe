import { api } from '../services/api'

export interface RoutineCompletionInput {
  id: string
  title: string
  duration?: number | null
  current_streak?: number | null
  longest_streak?: number | null
}

export function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0]
}

export function getRoutineStreakAfterCompletion(routine: RoutineCompletionInput): {
  currentStreak: number
  longestStreak: number
} {
  const currentStreak = (routine.current_streak ?? 0) + 1
  const longestStreak = Math.max(routine.longest_streak ?? 0, currentStreak)
  return { currentStreak, longestStreak }
}

export function buildRoutineCompletionRequest(routine: RoutineCompletionInput) {
  const today = getTodayDateKey()
  const now = new Date()
  const completed_time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const { currentStreak, longestStreak } = getRoutineStreakAfterCompletion(routine)

  return {
    completionData: {
      routine_id: routine.id,
      completed_date: today,
      completed_time,
      duration: routine.duration ?? null,
    },
    routineUpdate: {
      title: routine.title,
      current_streak: currentStreak,
      longest_streak: longestStreak,
    },
    currentStreak,
    longestStreak,
  }
}

export async function persistRoutineCompletion(routine: RoutineCompletionInput): Promise<{
  currentStreak: number
  longestStreak: number
}> {
  const { completionData, routineUpdate, currentStreak, longestStreak } =
    buildRoutineCompletionRequest(routine)

  await Promise.all([
    api.createRoutineCompletion(completionData),
    api.updateRoutine(routine.id, routineUpdate),
  ])

  return { currentStreak, longestStreak }
}
