import { useId } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ModalOverlay from '../ModalOverlay'
import CuadernoPickCard from './CuadernoPickCard'
import { getNotePageCover, getNotePageIcon } from './cuadernoDisplayUtils'
import type { CuadernoPickCardModel } from './cuadernoPickCardTypes'
import type { Note } from './cuadernosTypes'

interface CuadernoSubpagesModalProps {
  parentTitle: string
  childNotes: Note[]
  onClose: () => void
  onOpenChild: (noteId: string) => void
  onCreateChild: () => void
}

function noteToPickCard(note: Note): CuadernoPickCardModel {
  return {
    id: note.id,
    title: note.titulo.trim() || 'Sin título',
    icon: getNotePageIcon(note.contenido),
    cover: getNotePageCover(note.contenido),
  }
}

function CuadernoSubpagesModal({
  parentTitle,
  childNotes,
  onClose,
  onOpenChild,
  onCreateChild,
}: CuadernoSubpagesModalProps) {
  const titleId = useId()
  const parentLabel = parentTitle.trim() || 'Sin título'

  return (
    <ModalOverlay onClose={onClose} titleId={titleId}>
      <div
        className="modal-panel cuaderno-subpages-modal"
        onClick={event => event.stopPropagation()}
      >
        <div className="cuaderno-subpages-modal__header">
          <div className="cuaderno-subpages-modal__header-copy">
            <p className="cuaderno-subpages-modal__eyebrow">Subpáginas de</p>
            <h2 id={titleId} className="modal-panel-title cuaderno-subpages-modal__title">
              {parentLabel}
            </h2>
          </div>
          <button
            type="button"
            className="modal-panel-close"
            onClick={onClose}
            aria-label="Cerrar subpáginas"
          >
            ×
          </button>
        </div>

        {childNotes.length > 0 ? (
          <ul className="cuaderno-subpages-modal__grid">
            {childNotes.map(child => (
              <li key={child.id}>
                <CuadernoPickCard
                  card={noteToPickCard(child)}
                  onSelect={card => {
                    onClose()
                    onOpenChild(card.id)
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="cuaderno-subpages-modal__empty">
            Aún no hay subpáginas en este cuaderno.
          </p>
        )}

        <div className="cuaderno-subpages-modal__actions">
          <button
            type="button"
            className="cuaderno-subpages-modal__create"
            onClick={() => {
              onClose()
              onCreateChild()
            }}
          >
            <AddIcon fontSize="small" aria-hidden />
            Nueva subpágina
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default CuadernoSubpagesModal
