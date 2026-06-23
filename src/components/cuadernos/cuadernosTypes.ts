export interface NoteAPI {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  titulo: string
  contenido: string
  fechaCreacion: string
  fechaActualizacion: string
}

export function mapNoteFromAPI(apiNote: NoteAPI): Note {
  return {
    id: apiNote.id,
    titulo: apiNote.title,
    contenido: apiNote.content,
    fechaCreacion: apiNote.created_at,
    fechaActualizacion: apiNote.updated_at,
  }
}

export function mapNotesFromAPI(apiNotes: NoteAPI[]): Note[] {
  return apiNotes.map(mapNoteFromAPI)
}
