import { describe, expect, it } from 'vitest'
import {
  buildTrabajoHubData,
  formatTrabajoHeroSubline,
  formatTrabajoHeroValue,
  formatTrabajoModuleSubtitle,
  isActiveActivityStatus,
} from './trabajoHubUtils'

const today = new Date('2026-06-24T12:00:00')

describe('trabajoHubUtils', () => {
  it('identifies active activity statuses', () => {
    expect(isActiveActivityStatus('in_progress')).toBe(true)
    expect(isActiveActivityStatus('blocked')).toBe(true)
    expect(isActiveActivityStatus('done')).toBe(false)
    expect(isActiveActivityStatus('wont_do')).toBe(false)
  })

  it('builds hub stats from contracts, activities and processes', () => {
    const data = buildTrabajoHubData({
      today,
      contracts: [
        { id: 'c1', name: 'Contrato A', data: { exclusivity: true } },
        { id: 'c2', name: 'Contrato B', data: {} },
      ],
      activities: [
        {
          id: 'a1',
          name: 'API rollout',
          data: {
            client: 'Acme',
            status: 'in_progress',
            priority: 'Alta',
            assignmentDate: '2026-06-20',
          },
        },
        {
          id: 'a2',
          name: 'Bugfix',
          data: { status: 'blocked', assignmentDate: '2026-06-22' },
        },
        {
          id: 'a3',
          name: 'Old task',
          data: { status: 'done', assignmentDate: '2026-05-01' },
        },
      ],
      processes: [
        {
          id: 'p1',
          name: 'Frontend lead',
          data: {
            company: 'Globex',
            status: 'Abierto',
            interviewDates: [{ date: '2026-06-25' }],
            hiringSteps: [{ step: 'HR', completed: false }],
          },
        },
      ],
    })

    expect(data.stats.totalContratos).toBe(2)
    expect(data.stats.contratosExclusivos).toBe(1)
    expect(data.stats.actividadesActivas).toBe(2)
    expect(data.stats.actividadesBloqueadas).toBe(1)
    expect(data.stats.actividadesAltaPrioridad).toBe(1)
    expect(data.stats.procesosAbiertos).toBe(1)
    expect(data.stats.entrevistasProximas).toBe(1)
    expect(data.attentionItems.some(item => item.id === 'blocked-a2')).toBe(true)
    expect(data.attentionItems.some(item => item.id.startsWith('interview-p1'))).toBe(true)
    expect(data.recentItems.length).toBeGreaterThan(0)
  })

  it('formats hero copy for empty and active queues', () => {
    expect(
      formatTrabajoHeroValue({
        actividadesActivas: 0,
        procesosAbiertos: 0,
      } as ReturnType<typeof buildTrabajoHubData>['stats'])
    ).toBe('Al día')

    expect(
      formatTrabajoHeroSubline(
        buildTrabajoHubData({
          today,
          contracts: [{ id: 'c1', name: 'C', data: {} }],
          activities: [
            { id: 'a1', name: 'Task', data: { status: 'defined', assignmentDate: '2026-06-20' } },
          ],
          processes: [],
        }).stats
      )
    ).toContain('1 actividad activa')
  })

  it('formats module subtitles with contextual detail', () => {
    const stats = buildTrabajoHubData({
      today,
      contracts: [{ id: 'c1', name: 'C', data: { exclusivity: true } }],
      activities: [{ id: 'a1', name: 'T', data: { status: 'blocked' } }],
      processes: [
        {
          id: 'p1',
          name: 'Role',
          data: { status: 'Abierto', interviewDates: [{ date: '2026-06-26' }] },
        },
      ],
    }).stats

    expect(formatTrabajoModuleSubtitle('contratos', stats)).toContain('exclusivo')
    expect(formatTrabajoModuleSubtitle('actividades', stats)).toContain('bloqueada')
    expect(formatTrabajoModuleSubtitle('procesos', stats)).toContain('entrevista')
  })
})
