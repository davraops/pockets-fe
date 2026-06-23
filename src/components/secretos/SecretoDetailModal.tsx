import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import ModalOverlay from '../ModalOverlay'
import type { Secret } from './secretosTypes'
import { formatSecretDate } from './secretoDisplayUtils'

interface SecretoDetailModalProps {
  secret: Secret
  isSaving: boolean
  onClose: () => void
  onDecrypt: () => void
  onEdit: () => void
  onDelete: () => void
}

function SecretoDetailModal({
  secret,
  isSaving,
  onClose,
  onDecrypt,
  onEdit,
  onDelete,
}: SecretoDetailModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-selectedsecret-titulo">
            {secret.titulo}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal" type="button">
            ×
          </button>
        </div>

        <div className="detail-content">
          <div className="detail-section">
            <div className="detail-info">
              <h3 className="detail-name">{secret.titulo}</h3>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-label">Título</span>
            <span className="detail-value">{secret.titulo}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Fecha de Creación</span>
            <span className="detail-value">{formatSecretDate(secret.fechaCreacion)}</span>
          </div>

          {secret.fechaCreacion !== secret.fechaActualizacion && (
            <div className="detail-row">
              <span className="detail-label">Última Actualización</span>
              <span className="detail-value">{formatSecretDate(secret.fechaActualizacion)}</span>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="detail-action-button"
            onClick={onDecrypt}
            aria-label="Desencriptar Secreto"
            disabled={isSaving}
          >
            <LockOpenIcon />
            <span>Desencriptar</span>
          </button>
          <button
            type="button"
            className="detail-action-button"
            onClick={onEdit}
            aria-label="Editar Secreto"
            disabled={isSaving}
          >
            <EditIcon />
            <span>Editar</span>
          </button>
          <button
            type="button"
            className="detail-action-button danger"
            onClick={onDelete}
            aria-label="Eliminar Secreto"
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

export default SecretoDetailModal
