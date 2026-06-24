import { getNotePageCover, getNotePageIcon } from './cuadernoDisplayUtils'
import { CUADERNO_EMPTY_PLACEHOLDER_CARDS } from './cuadernoEmptyPlaceholders'
import { getNoteParentId } from './cuadernoTree'
import type { CuadernoPickCardModel } from './cuadernoPickCardTypes'
import type { Note } from './cuadernosTypes'

const PICK_CARD_LIMIT = 6

export function buildPickCardsFromNotes(notes: Note[]): CuadernoPickCardModel[] {
  if (notes.length === 0) {
    return []
  }

  const ids = new Set(notes.map(note => note.id))
  const titleById = new Map(notes.map(note => [note.id, note.titulo.trim() || 'Sin título']))

  return [...notes]
    .sort(
      (left, right) =>
        new Date(right.fechaActualizacion).getTime() - new Date(left.fechaActualizacion).getTime()
    )
    .slice(0, PICK_CARD_LIMIT)
    .map(note => {
      const parentId = getNoteParentId(note, ids)
      const parentLabel = parentId ? titleById.get(parentId) : undefined

      return {
        id: note.id,
        title: note.titulo.trim() || 'Sin título',
        icon: getNotePageIcon(note.contenido),
        cover: getNotePageCover(note.contenido),
        parentLabel,
      }
    })
}

export function getCuadernoPickCards(notes: Note[]): CuadernoPickCardModel[] {
  const fromNotes = buildPickCardsFromNotes(notes)
  if (fromNotes.length > 0) {
    return fromNotes
  }
  return CUADERNO_EMPTY_PLACEHOLDER_CARDS.map(card => ({ ...card, isPlaceholder: true }))
}
