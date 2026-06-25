import { describe, expect, it } from 'vitest'
import {
  calculateSecretoHighlights,
  filterSecretsByQuery,
  formatSecretDateCompact,
  formatSecretListMeta,
  formatSecretListMetaTitle,
  secretoSummaryItems,
  sortSecretsByRecent,
} from './secretoDisplayUtils'
import type { Secret } from './secretosTypes'

const baseSecret = (overrides: Partial<Secret> = {}): Secret => ({
  id: '1',
  titulo: 'API Key GitHub',
  fechaCreacion: '2026-06-01T10:00:00.000Z',
  fechaActualizacion: '2026-06-01T10:00:00.000Z',
  ...overrides,
})

describe('secretoDisplayUtils', () => {
  it('formatSecretDateCompact uses short month labels', () => {
    const formatted = formatSecretDateCompact('2026-06-15T14:30:00.000Z')
    expect(formatted).toMatch(/15/)
    expect(formatted).toMatch(/2026/)
  })

  it('sortSecretsByRecent orders by fechaActualizacion desc', () => {
    const secrets = [
      baseSecret({ id: 'a', fechaActualizacion: '2026-06-01T10:00:00.000Z' }),
      baseSecret({ id: 'b', fechaActualizacion: '2026-06-20T10:00:00.000Z' }),
    ]
    expect(sortSecretsByRecent(secrets).map(s => s.id)).toEqual(['b', 'a'])
  })

  it('filterSecretsByQuery matches title case-insensitively', () => {
    const secrets = [
      baseSecret({ id: '1', titulo: 'GitHub Token' }),
      baseSecret({ id: '2', titulo: 'AWS Root' }),
    ]
    expect(filterSecretsByQuery(secrets, 'github')).toHaveLength(1)
    expect(filterSecretsByQuery(secrets, '  ')).toHaveLength(2)
  })

  it('calculateSecretoHighlights counts recientes and modificados', () => {
    const weekAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const secrets = [
      baseSecret({ id: '1', fechaCreacion: weekAgo, fechaActualizacion: weekAgo }),
      baseSecret({
        id: '2',
        fechaCreacion: old,
        fechaActualizacion: '2026-06-18T10:00:00.000Z',
      }),
    ]
    const highlights = calculateSecretoHighlights(secrets)
    expect(highlights.recientes).toBe(1)
    expect(highlights.actualizados).toBe(1)
  })

  it('secretoSummaryItems uses two vault metrics without total', () => {
    const items = secretoSummaryItems({ recientes: 2, actualizados: 1 })
    expect(items.map(i => i.label)).toEqual(['Recientes (7d)', 'Modificados'])
  })

  it('formatSecretListMeta includes created vs updated prefix', () => {
    const created = baseSecret()
    const updated = baseSecret({ fechaActualizacion: '2026-06-18T10:00:00.000Z' })
    expect(formatSecretListMeta(created)).toMatch(/^Creado ·/)
    expect(formatSecretListMeta(updated)).toMatch(/^Actualizado ·/)
  })

  it('formatSecretListMetaTitle distinguishes created vs updated', () => {
    const created = baseSecret()
    const updated = baseSecret({
      fechaActualizacion: '2026-06-18T10:00:00.000Z',
    })
    expect(formatSecretListMetaTitle(created)).toMatch(/^Creado:/)
    expect(formatSecretListMetaTitle(updated)).toMatch(/^Actualizado:/)
  })
})
