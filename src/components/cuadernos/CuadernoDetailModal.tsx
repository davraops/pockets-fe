import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ModalOverlay from '../ModalOverlay'
import type { Note } from './cuadernosTypes'
import { formatNoteDate } from './cuadernoDisplayUtils'

interface CuadernoDetailModalProps {
  note: Note
  isSaving: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function CuadernoDetailModal({
  note,
  isSaving,
  onClose,
  onEdit,
  onDelete,
}: CuadernoDetailModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-selectednote-titulo">
            {note.titulo}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal" type="button">
            ×
          </button>
        </div>

        <div className="detail-content">
          <div className="detail-section">
            <div className="detail-info">
              <h3 className="detail-name">{note.titulo}</h3>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-label">Contenido</span>
          </div>
          <div className="detail-content-text">
            <pre className="detail-content-pre">{note.contenido}</pre>
          </div>

          <div className="detail-row">
            <span className="detail-label">Fecha de Creación</span>
            <span className="detail-value">{formatNoteDate(note.fechaCreacion)}</span>
          </div>

          {note.fechaCreacion !== note.fechaActualizacion && (
            <div className="detail-row">
              <span className="detail-label">Última Actualización</span>
              <span className="detail-value">{formatNoteDate(note.fechaActualizacion)}</span>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="detail-action-button"
            onClick={onEdit}
            aria-label="Editar Nota"
            disabled={isSaving}
          >
            <EditIcon />
            <span>Editar</span>
          </button>
          <button
            type="button"
            className="detail-action-button danger"
            onClick={onDelete}
            aria-label="Eliminar Nota"
            disabled={isSaving}
          >
            <DeleteIcon />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default CuadernoDetailModal
