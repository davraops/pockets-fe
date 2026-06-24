export interface NoteAPI {
  id: string
  title: string
  content: string
  parent_id?: string | null
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  titulo: string
  contenido: string
  parentId?: string
  sortOrder: number
  fechaCreacion: string
  fechaActualizacion: string
}

export interface NoteWritePayload {
  title?: string
  content?: string
  parent_id?: string | null
  sort_order?: number
}

export function mapNoteFromAPI(apiNote: NoteAPI): Note {
  return {
    id: apiNote.id,
    titulo: apiNote.title,
    contenido: apiNote.content,
    parentId: apiNote.parent_id ?? undefined,
    sortOrder:
      typeof apiNote.sort_order === 'number' && Number.isInteger(apiNote.sort_order) && apiNote.sort_order >= 0
        ? apiNote.sort_order
        : 0,
    fechaCreacion: apiNote.created_at,
    fechaActualizacion: apiNote.updated_at,
  }
}

export function mapNotesFromAPI(apiNotes: NoteAPI[]): Note[] {
  return apiNotes.map(mapNoteFromAPI)
}

export function applyNotePatch(note: Note, patch: NoteWritePayload): Note {
  return {
    ...note,
    ...(patch.title !== undefined ? { titulo: patch.title } : {}),
    ...(patch.content !== undefined ? { contenido: patch.content } : {}),
    ...(patch.parent_id !== undefined ? { parentId: patch.parent_id ?? undefined } : {}),
    ...(patch.sort_order !== undefined ? { sortOrder: patch.sort_order } : {}),
    fechaActualizacion: new Date().toISOString(),
  }
}
