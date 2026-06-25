export type RoutineFrequency = 'daily' | 'weekly' | 'monthly'

export interface Routine {
  id: string
  title: string
  description?: string | null
  frequency: RoutineFrequency
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

export interface RoutineFormData {
  title: string
  description: string
  frequency: RoutineFrequency
  days_of_week: number[]
  day_of_month: number | null
  scheduled_time: string
  color: string
  duration: number | null
}

export const DEFAULT_ROUTINE_FORM: RoutineFormData = {
  title: '',
  description: '',
  frequency: 'daily',
  days_of_week: [],
  day_of_month: null,
  scheduled_time: '',
  color: '#007AFF',
  duration: null,
}

export type RoutineFrequencyFilter = 'all' | RoutineFrequency
