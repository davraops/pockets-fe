import { describe, expect, it } from 'vitest'
import {
  addManualTimeLog,
  buildNewActivityData,
  computeActivityMetrics,
  formatDurationMinutes,
  getStatusDurations,
  getTotalLoggedMinutes,
  normalizeActivityData,
  patchActivityFields,
  startTimer,
  stopTimer,
  transitionActivityStatus,
} from './activityMetricsUtils'

const createdAt = '2026-06-20T10:00:00.000Z'

describe('activityMetricsUtils', () => {
  it('builds new activity with initial status history', () => {
    const data = buildNewActivityData({
      client: 'Acme',
      status: 'defined',
    })

    expect(data.statusHistory).toHaveLength(1)
    expect(data.statusHistory?.[0].status).toBe('defined')
    expect(data.timeLogs).toEqual([])
    expect(data.activeTimerStartedAt).toBeNull()
  })

  it('tracks status transitions and resolution timestamp', () => {
    const base = buildNewActivityData({ client: 'Acme', status: 'defined' })
    const inProgress = transitionActivityStatus(base, 'in_progress', '2026-06-21T10:00:00.000Z')
    const done = transitionActivityStatus(inProgress, 'done', '2026-06-22T15:00:00.000Z')

    expect(done.statusHistory).toHaveLength(3)
    expect(done.resolvedAt).toBe('2026-06-22T15:00:00.000Z')
    expect(done.completedDate).toBe('2026-06-22')
  })

  it('records timer sessions into time logs', () => {
    const started = startTimer(buildNewActivityData({ client: 'Acme' }), '2026-06-21T10:00:00.000Z')
    const stopped = stopTimer(started, '2026-06-21T11:30:00.000Z')

    expect(stopped.activeTimerStartedAt).toBeNull()
    expect(stopped.timeLogs).toHaveLength(1)
    expect(stopped.timeLogs?.[0].minutes).toBe(90)
    expect(
      getTotalLoggedMinutes(stopped, Date.parse('2026-06-21T11:30:00.000Z'))
    ).toBe(90)
  })

  it('adds manual time entries', () => {
    const data = addManualTimeLog(buildNewActivityData({ client: 'Acme' }), 45, 'Revisión', createdAt)
    expect(data.timeLogs).toHaveLength(1)
    expect(data.timeLogs?.[0].minutes).toBe(45)
    expect(data.timeLogs?.[0].note).toBe('Revisión')
  })

  it('patches fields and transitions status when needed', () => {
    const existing = buildNewActivityData({ client: 'Acme', status: 'defined' })
    const patched = patchActivityFields(
      existing,
      { client: 'Acme', status: 'blocked', ticket: 'JIRA-1' },
      createdAt
    )

    expect(patched.status).toBe('blocked')
    expect(patched.ticket).toBe('JIRA-1')
    expect(patched.statusHistory?.some(event => event.status === 'blocked')).toBe(true)
  })

  it('computes lead time and status durations', () => {
    const data = transitionActivityStatus(
      transitionActivityStatus(
        normalizeActivityData({ client: 'Acme', status: 'defined' }, createdAt),
        'in_progress',
        '2026-06-21T10:00:00.000Z'
      ),
      'done',
      '2026-06-22T10:00:00.000Z'
    )
    const activity = {
      created_at: createdAt,
      data,
    }

    const metrics = computeActivityMetrics(activity, Date.parse('2026-06-22T10:00:00.000Z'))
    expect(metrics.leadTimeMinutes).toBe(48 * 60)
    expect(formatDurationMinutes(metrics.leadTimeMinutes)).toBe('48h')

    const durations = getStatusDurations(activity.data, activity.created_at, Date.parse('2026-06-22T10:00:00.000Z'))
    expect(durations.find(row => row.status === 'defined')?.minutes).toBe(24 * 60)
    expect(durations.find(row => row.status === 'in_progress')?.minutes).toBe(24 * 60)
  })
})
