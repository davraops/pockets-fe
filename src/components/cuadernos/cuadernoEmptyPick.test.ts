import { describe, expect, it } from 'vitest'
import { serializeDocument, plainTextToDocument } from './cuadernoDocument'
import { buildPickCardsFromNotes, getCuadernoPickCards } from './cuadernoEmptyPick'
import { CUADERNO_EMPTY_PLACEHOLDER_CARDS } from './cuadernoEmptyPlaceholders'
import type { Note } from './cuadernosTypes'

function makeNote(overrides: Partial<Note> & Pick<Note, 'id' | 'titulo'>): Note {
  return {
    contenido: serializeDocument(plainTextToDocument('')),
    sortOrder: 0,
    fechaCreacion: '2026-01-01T00:00:00.000Z',
    fechaActualizacion: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('cuadernoEmptyPick', () => {
  it('returns placeholder cards when there are no notes', () => {
    const cards = getCuadernoPickCards([])
    expect(cards).toHaveLength(CUADERNO_EMPTY_PLACEHOLDER_CARDS.length)
    expect(cards.every(card => card.isPlaceholder)).toBe(true)
    expect(cards.some(card => card.parentLabel)).toBe(true)
  })

  it('maps note icon, cover and parent label for subpages', () => {
    const notes: Note[] = [
      makeNote({
        id: '11111111-1111-4111-8111-111111111111',
        titulo: 'Proyecto',
        contenido: serializeDocument({
          ...plainTextToDocument(''),
          icon: '🚀',
          cover: 'gradient-ocean',
        }),
        fechaActualizacion: '2026-06-01T00:00:00.000Z',
      }),
      makeNote({
        id: '22222222-2222-4222-8222-222222222222',
        titulo: 'Roadmap',
        parentId: '11111111-1111-4111-8111-111111111111',
        contenido: serializeDocument({
          ...plainTextToDocument(''),
          icon: '🗺️',
          cover: 'solid-blue',
        }),
        fechaActualizacion: '2026-06-02T00:00:00.000Z',
      }),
    ]

    const cards = buildPickCardsFromNotes(notes)
    expect(cards[0]?.id).toBe('22222222-2222-4222-8222-222222222222')
    expect(cards[0]?.icon).toBe('🗺️')
    expect(cards[0]?.cover).toBe('solid-blue')
    expect(cards[0]?.parentLabel).toBe('Proyecto')
  })
})
