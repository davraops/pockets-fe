import type { Goal, GoalProgress, GoalTask, GoalTaskStatus } from './metaTypes'

export const GOAL_TASK_STATUSES: GoalTaskStatus[] = ['pending', 'in_progress', 'done']

export function normalizeGoalTaskStatus(status: string | undefined): GoalTaskStatus {
  if (status === 'in_progress' || status === 'done') {
    return status
  }
  return 'pending'
}

export function calculateGoalProgress(tasks: GoalTask[]): GoalProgress {
  const done = tasks.filter(task => task.status === 'done').length
  const inProgress = tasks.filter(task => task.status === 'in_progress').length
  const pending = tasks.filter(task => task.status === 'pending').length
  const total = tasks.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return { done, inProgress, pending, total, percent }
}

export function isGoalComplete(goal: Pick<Goal, 'tasks'>): boolean {
  const { total, done } = calculateGoalProgress(goal.tasks)
  return total > 0 && done === total
}

export function getGoalTaskStatusLabel(status: GoalTaskStatus): string {
  switch (status) {
    case 'in_progress':
      return 'En curso'
    case 'done':
      return 'Hecha'
    default:
      return 'Pendiente'
  }
}

export function cycleGoalTaskStatus(status: GoalTaskStatus): GoalTaskStatus {
  if (status === 'pending') {
    return 'in_progress'
  }
  if (status === 'in_progress') {
    return 'done'
  }
  return 'pending'
}

export function updateGoalTaskStatus(tasks: GoalTask[], taskId: string, status: GoalTaskStatus): GoalTask[] {
  return tasks.map(task => (task.id === taskId ? { ...task, status } : task))
}

export function filterGoalsByQuery(goals: Goal[], query: string): Goal[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return goals
  }

  return goals.filter(goal => {
    const haystack = [
      goal.title,
      goal.description ?? '',
      ...goal.tasks.map(task => task.title),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}

export function sortGoalsByUpdated(goals: Goal[]): Goal[] {
  return [...goals].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
}

export function formatGoalMeta(goal: Goal): string {
  const progress = calculateGoalProgress(goal.tasks)
  if (progress.total === 0) {
    return 'Sin tareas'
  }
  if (isGoalComplete(goal)) {
    return 'Completada'
  }
  if (progress.inProgress > 0) {
    return `${progress.done}/${progress.total} tareas · ${progress.inProgress} en curso`
  }
  return `${progress.done}/${progress.total} tareas`
}

export function summarizeGoalsStats(goals: Array<Pick<Goal, 'tasks'>>): {
  total: number
  completed: number
  pendingTasks: number
} {
  let completed = 0
  let pendingTasks = 0

  goals.forEach(goal => {
    if (isGoalComplete(goal)) {
      completed += 1
    }
    pendingTasks += goal.tasks.filter(task => task.status !== 'done').length
  })

  return {
    total: goals.length,
    completed,
    pendingTasks,
  }
}
