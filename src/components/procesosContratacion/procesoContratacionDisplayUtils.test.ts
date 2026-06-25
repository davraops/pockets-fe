import { describe, expect, it } from 'vitest'
import {
  buildClosureRecords,
  buildClosureStats,
  buildCloseProcessPayload,
  buildReinforceSkillUpdate,
  buildSkillGapAggregates,
  isProcesoStagnant,
  listProcesosToReinforceSkill,
} from './procesoContratacionDisplayUtils'
import type { ProcesoContratacion } from './procesoContratacionTypes'

const today = new Date('2026-06-24T12:00:00')

function makeProceso(overrides: Partial<ProcesoContratacion> = {}): ProcesoContratacion {
  return {
    id: 'p1',
    titulo: 'Frontend Lead',
    empresa: 'Acme',
    posicion: 'React + TS',
    estado: 'Abierto',
    fechaApertura: '2026-06-01',
    rawData: {
      id: 'p1',
      name: 'Frontend Lead',
      created_at: '2026-06-01T10:00:00.000Z',
      updated_at: '2026-06-01T10:00:00.000Z',
      data: {
        company: 'Acme',
        status: 'Abierto',
        applicationDate: '2026-06-01',
        interactions: [{ date: '2026-06-20', description: 'Follow-up' }],
      },
    },
    ...overrides,
  }
}

describe('procesoContratacionDisplayUtils', () => {
  it('counts closure reasons and open stalled processes', () => {
    const procesos: ProcesoContratacion[] = [
      makeProceso(),
      makeProceso({
        id: 'p2',
        titulo: 'Backend',
        estado: 'Cerrado',
        fechaApertura: '2026-05-01',
        rawData: {
          id: 'p2',
          name: 'Backend',
          created_at: '2026-05-01T10:00:00.000Z',
          updated_at: '2026-06-10T10:00:00.000Z',
          data: {
            status: 'Cerrado',
            closure: { reason: 'precio', closedAt: '2026-06-10T10:00:00.000Z' },
          },
        },
      }),
      makeProceso({
        id: 'p3',
        titulo: 'DevOps',
        estado: 'Cerrado',
        rawData: {
          id: 'p3',
          name: 'DevOps',
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-06-01T10:00:00.000Z',
          data: {
            status: 'Cerrado',
            closure: {
              reason: 'skills',
              closedAt: '2026-06-01T10:00:00.000Z',
              skillsGap: ['Kubernetes', 'Terraform'],
            },
          },
        },
      }),
      makeProceso({
        id: 'p4',
        titulo: 'Stale role',
        fechaApertura: '2026-05-01',
        rawData: {
          id: 'p4',
          name: 'Stale role',
          created_at: '2026-05-01T10:00:00.000Z',
          updated_at: '2026-05-01T10:00:00.000Z',
          data: {
            status: 'Abierto',
            applicationDate: '2026-05-01',
            interactions: [{ date: '2026-06-01', description: 'Applied' }],
          },
        },
      }),
    ]

    const stats = buildClosureStats(procesos, today)
    expect(stats.totalCerrados).toBe(2)
    expect(stats.precio).toBe(1)
    expect(stats.skills).toBe(1)
    expect(stats.abiertosEstancados).toBe(1)
    expect(isProcesoStagnant(procesos[3], today)).toBe(true)
  })

  it('aggregates skill gaps from closed processes', () => {
    const procesos = [
      makeProceso({
        estado: 'Cerrado',
        rawData: {
          id: 'p1',
          name: 'Frontend Lead',
          created_at: '2026-06-01T10:00:00.000Z',
          updated_at: '2026-06-01T10:00:00.000Z',
          data: {
            status: 'Cerrado',
            closure: {
              reason: 'skills',
              closedAt: '2026-06-01T10:00:00.000Z',
              skillsGap: ['Kubernetes', 'Go'],
            },
          },
        },
      }),
      makeProceso({
        id: 'p2',
        titulo: 'Platform',
        estado: 'Cerrado',
        rawData: {
          id: 'p2',
          name: 'Platform',
          created_at: '2026-06-01T10:00:00.000Z',
          updated_at: '2026-06-01T10:00:00.000Z',
          data: {
            status: 'Cerrado',
            closure: {
              reason: 'skills',
              closedAt: '2026-06-02T10:00:00.000Z',
              skillsGap: ['kubernetes', 'AWS'],
            },
          },
        },
      }),
    ]

    const skills = buildSkillGapAggregates(procesos)
    expect(skills.find(item => item.skill === 'Kubernetes')?.count).toBe(2)
    expect(skills.find(item => item.skill === 'Go')?.count).toBe(1)
    expect(buildClosureRecords(procesos)).toHaveLength(2)
  })

  it('builds close payload with closure metadata', () => {
    const proceso = makeProceso()
    const payload = buildCloseProcessPayload(proceso, 'skills', 'Faltó profundidad', ['Rust'], true)

    expect(payload.data.status).toBe('Cerrado')
    expect(payload.data.closure?.reason).toBe('skills')
    expect(payload.data.closure?.skillsGap).toEqual(['Rust'])
    expect(payload.data.closure?.wasStalledAtClose).toBe(true)
  })

  it('moves a skill from gap to reinforced across processes', () => {
    const procesos = [
      makeProceso({
        estado: 'Cerrado',
        rawData: {
          id: 'p1',
          name: 'Frontend Lead',
          created_at: '2026-06-01T10:00:00.000Z',
          updated_at: '2026-06-01T10:00:00.000Z',
          data: {
            status: 'Cerrado',
            closure: {
              reason: 'skills',
              closedAt: '2026-06-01T10:00:00.000Z',
              skillsGap: ['Kubernetes', 'Go'],
            },
          },
        },
      }),
    ]

    expect(listProcesosToReinforceSkill(procesos, 'kubernetes')).toHaveLength(1)

    const update = buildReinforceSkillUpdate(procesos[0], 'kubernetes', 'Kubernetes')
    expect(update?.data.closure?.skillsGap).toEqual(['Go'])
    expect(update?.data.closure?.skillsReinforced).toEqual(['Kubernetes'])

    const after = {
      ...procesos[0],
      rawData: {
        ...procesos[0].rawData,
        data: update!.data,
      },
    }

    expect(buildSkillGapAggregates([after])).toEqual([
      { skill: 'Go', key: 'go', count: 1, procesos: ['Frontend Lead'] },
    ])
  })
})
