import { getDocumentPlainText, parseCuadernoContent } from './cuadernoDocument'
import { getNoteAncestors } from './cuadernoTree'
import type { Note } from './cuadernosTypes'

export function filterNotesForSidebar(notes: Note[], query: string): Note[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return notes
  }

  const matchingIds = new Set<string>()
  for (const note of notes) {
    const title = note.titulo.trim().toLowerCase()
    const body = getDocumentPlainText(parseCuadernoContent(note.contenido)).toLowerCase()
    if (title.includes(normalized) || body.includes(normalized)) {
      matchingIds.add(note.id)
      getNoteAncestors(note.id, notes).forEach(ancestor => matchingIds.add(ancestor.id))
    }
  }

  return notes.filter(note => matchingIds.has(note.id))
}
