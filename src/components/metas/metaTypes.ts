export type GoalTaskStatus = 'pending' | 'in_progress' | 'done'

export interface GoalTask {
  id: string
  title: string
  status: GoalTaskStatus
}

export interface Goal {
  id: string
  title: string
  description: string | null
  tasks: GoalTask[]
  created_at: string
  updated_at: string
}

export interface GoalProgress {
  done: number
  inProgress: number
  pending: number
  total: number
  percent: number
}
