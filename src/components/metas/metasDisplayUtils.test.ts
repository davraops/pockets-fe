import { describe, expect, it } from 'vitest'
import {
  calculateGoalProgress,
  cycleGoalTaskStatus,
  filterGoalsByQuery,
  formatGoalMeta,
  isGoalComplete,
  summarizeGoalsStats,
  updateGoalTaskStatus,
} from './metasDisplayUtils'
import type { Goal } from './metaTypes'

const sampleGoal: Goal = {
  id: 'goal-1',
  title: 'Correr maratón',
  description: 'Meta anual',
  tasks: [
    { id: 't1', title: 'Comprar zapatillas', status: 'done' },
    { id: 't2', title: 'Plan 12 semanas', status: 'in_progress' },
    { id: 't3', title: 'Inscribirse', status: 'pending' },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

describe('metasDisplayUtils', () => {
  it('calculates task progress for a goal', () => {
    expect(calculateGoalProgress(sampleGoal.tasks)).toEqual({
      done: 1,
      inProgress: 1,
      pending: 1,
      total: 3,
      percent: 33,
    })
  })

  it('detects completed goals only when every task is done', () => {
    expect(isGoalComplete(sampleGoal)).toBe(false)
    expect(
      isGoalComplete({
        tasks: sampleGoal.tasks.map(task => ({ ...task, status: 'done' })),
      })
    ).toBe(true)
  })

  it('cycles task status in pending → in_progress → done order', () => {
    expect(cycleGoalTaskStatus('pending')).toBe('in_progress')
    expect(cycleGoalTaskStatus('in_progress')).toBe('done')
    expect(cycleGoalTaskStatus('done')).toBe('pending')
  })

  it('updates a single task status immutably', () => {
    const updated = updateGoalTaskStatus(sampleGoal.tasks, 't3', 'done')
    expect(updated.find(task => task.id === 't3')?.status).toBe('done')
    expect(sampleGoal.tasks.find(task => task.id === 't3')?.status).toBe('pending')
  })

  it('filters goals by title, description and task titles', () => {
    expect(filterGoalsByQuery([sampleGoal], 'zapatillas')).toHaveLength(1)
    expect(filterGoalsByQuery([sampleGoal], 'anual')).toHaveLength(1)
    expect(filterGoalsByQuery([sampleGoal], 'inexistente')).toHaveLength(0)
  })

  it('formats goal meta with progress context', () => {
    expect(formatGoalMeta(sampleGoal)).toBe('1/3 tareas · 1 en curso')
    expect(
      formatGoalMeta({
        ...sampleGoal,
        tasks: sampleGoal.tasks.map(task => ({ ...task, status: 'done' })),
      })
    ).toBe('Completada')
  })

  it('summarizes goals stats for hub subtitles', () => {
    expect(summarizeGoalsStats([sampleGoal])).toEqual({
      total: 1,
      completed: 0,
      pendingTasks: 2,
    })
  })
})
