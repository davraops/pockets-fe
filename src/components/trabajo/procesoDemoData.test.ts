import { describe, expect, it } from 'vitest'
import { buildDemoHiringProcesses } from './procesoDemoData'

describe('procesoDemoData', () => {
  it('builds five demo processes with future interview dates', () => {
    const processes = buildDemoHiringProcesses()
    expect(processes).toHaveLength(5)

    const openWithInterviews = processes.filter(
      process =>
        process.data.status === 'Abierto' &&
        Array.isArray(process.data.interviewDates) &&
        process.data.interviewDates.length > 0
    )

    expect(openWithInterviews.length).toBeGreaterThan(0)
    openWithInterviews.forEach(process => {
      const interviews = process.data.interviewDates as Array<{ date: string }>
      expect(interviews.some(interview => interview.date >= new Date().toISOString().split('T')[0])).toBe(
        true
      )
    })
  })
})
