import CrudInsetRow from '../crud/CrudInsetRow'
import type { Note } from './cuadernosTypes'
import { formatNoteMeta, formatNotePreview } from './cuadernoDisplayUtils'

interface CuadernoListRowProps {
  note: Note
  onClick: () => void
}

function CuadernoListRow({ note, onClick }: CuadernoListRowProps) {
  return (
    <CrudInsetRow
      accentClass="crud-row-accent-files"
      ariaLabel={`Ver nota ${note.titulo}`}
      onClick={onClick}
      title={note.titulo}
      preview={formatNotePreview(note.contenido)}
      meta={formatNoteMeta(note)}
      metaAfterPreview
    />
  )
}

export default CuadernoListRow
