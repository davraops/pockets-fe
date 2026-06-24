import { getNoteAncestors } from './cuadernoTree'
import type { Note } from './cuadernosTypes'
import './cuadernoEditor.css'

interface CuadernoBreadcrumbProps {
  note: Note
  notes: Note[]
  onNavigate: (noteId: string | null) => void
}

function CuadernoBreadcrumb({ note, notes, onNavigate }: CuadernoBreadcrumbProps) {
  const ancestors = getNoteAncestors(note.id, notes)

  return (
    <nav className="cuaderno-breadcrumb" aria-label="Ubicación del cuaderno">
      <button type="button" className="cuaderno-breadcrumb__link" onClick={() => onNavigate(null)}>
        Cuadernos
      </button>
      {ancestors.map(ancestor => (
        <span key={ancestor.id} className="cuaderno-breadcrumb__segment">
          <span className="cuaderno-breadcrumb__sep" aria-hidden>
            /
          </span>
          <button
            type="button"
            className="cuaderno-breadcrumb__link"
            onClick={() => onNavigate(ancestor.id)}
          >
            {ancestor.titulo.trim() || 'Sin título'}
          </button>
        </span>
      ))}
      <span className="cuaderno-breadcrumb__segment">
        <span className="cuaderno-breadcrumb__sep" aria-hidden>
          /
        </span>
        <span className="cuaderno-breadcrumb__current">{note.titulo.trim() || 'Sin título'}</span>
      </span>
    </nav>
  )
}

export default CuadernoBreadcrumb
