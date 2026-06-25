import { describe, expect, it } from 'vitest'
import { buildProcessInsights } from './procesoHubUtils'
import type { TrabajoProcessRow } from './trabajoHubUtils'

const today = new Date('2026-06-24T12:00:00')

describe('procesoHubUtils', () => {
  const processes: TrabajoProcessRow[] = [
    {
      id: 'p1',
      name: 'Senior FE',
      created_at: '2026-06-01T10:00:00.000Z',
      data: {
        company: 'Globex',
        status: 'Abierto',
        applicationDate: '2026-06-01',
        interviewDates: [{ date: '2026-06-25', time: '10:00' }],
        hiringSteps: [
          { step: 'HR', completed: true },
          { step: 'Tech', completed: false },
        ],
        interactions: [{ date: '2026-06-20', description: 'Follow-up' }],
        negotiatedSalary: { amount: 8000, currency: 'USD' },
      },
    },
    {
      id: 'p2',
      name: 'Backend lead',
      created_at: '2026-05-01T10:00:00.000Z',
      data: {
        company: 'Initech',
        status: 'Abierto',
        applicationDate: '2026-05-01',
        hiringSteps: [{ step: 'CV', completed: false }],
        interactions: [{ date: '2026-06-01', description: 'Applied' }],
        hasAgency: true,
        agencyName: 'Hunters',
      },
    },
    {
      id: 'p3',
      name: 'Closed role',
      data: { company: 'Umbrella', status: 'Cerrado' },
    },
  ]

  it('builds pipeline stats and interview insights', () => {
    const insights = buildProcessInsights(processes, today)

    expect(insights.stats.procesosAbiertos).toBe(2)
    expect(insights.stats.procesosCerrados).toBe(1)
    expect(insights.stats.entrevistasProximas).toBe(1)
    expect(insights.stats.conSalarioNegociado).toBe(1)
    expect(insights.stats.conAgencia).toBe(1)
    expect(insights.stats.avancePromedioPasos).toBe(25)
    expect(insights.upcomingInterviews[0].whenLabel).toBe('Mañana')
    expect(insights.activePipeline.length).toBeGreaterThan(0)
  })

  it('flags stalled processes without recent follow-up', () => {
    const insights = buildProcessInsights(processes, today)
    expect(insights.stalledProcesses.some(item => item.id === 'p2')).toBe(true)
    expect(insights.summaryLines.some(line => line.includes('sin seguimiento'))).toBe(true)
  })
})
