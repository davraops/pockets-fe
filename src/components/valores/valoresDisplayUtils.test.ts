import { describe, expect, it } from 'vitest'
import {
  filterPersonalValuesByKind,
  filterPersonalValuesByQuery,
  getPersonalValueKindLabel,
  groupPersonalValuesByKind,
  summarizePersonalValues,
} from './valoresDisplayUtils'
import type { PersonalValueEntry } from './valorTypes'

const sampleEntries: PersonalValueEntry[] = [
  {
    id: '1',
    kind: 'value',
    title: 'Honestidad',
    description: 'Ser transparente',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: '2',
    kind: 'belief',
    title: 'Crecimiento continuo',
    description: 'Siempre se puede aprender',
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
]

describe('valoresDisplayUtils', () => {
  it('labels value kinds in Spanish', () => {
    expect(getPersonalValueKindLabel('value')).toBe('Valor')
    expect(getPersonalValueKindLabel('belief')).toBe('Creencia')
  })

  it('filters entries by kind and search query', () => {
    expect(filterPersonalValuesByKind(sampleEntries, 'value')).toHaveLength(1)
    expect(filterPersonalValuesByQuery(sampleEntries, 'crecimiento')).toHaveLength(1)
    expect(filterPersonalValuesByQuery(sampleEntries, 'honest')).toHaveLength(1)
  })

  it('groups and summarizes entries for dashboard stats', () => {
    expect(groupPersonalValuesByKind(sampleEntries)).toEqual({
      values: [sampleEntries[0]],
      beliefs: [sampleEntries[1]],
    })
    expect(summarizePersonalValues(sampleEntries)).toEqual({
      total: 2,
      values: 1,
      beliefs: 1,
    })
  })
})
