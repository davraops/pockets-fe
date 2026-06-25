import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
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
  const wasUpdated = secret.fechaCreacion !== secret.fechaActualizacion

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel secretos-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-panel-title-secreto"
      >
        <div className="secretos-modal__header">
          <div className="secretos-modal__header-copy">
            <p className="secretos-modal__kicker">Vault · Detalle</p>
            <h2 className="modal-panel-title" id="modal-panel-title-secreto">
              {secret.titulo}
            </h2>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content secretos-modal__body">
          <dl className="secretos-modal__info-list">
            <div className="secretos-modal__info-item">
              <dt className="secretos-modal__info-label">Estado</dt>
              <dd className="secretos-modal__info-value">
                <span className="secretos-row-badge">Cifrado</span>
              </dd>
            </div>
            <div className="secretos-modal__info-item">
              <dt className="secretos-modal__info-label">Creado</dt>
              <dd className="secretos-modal__info-value">{formatSecretDate(secret.fechaCreacion)}</dd>
            </div>
            {wasUpdated ? (
              <div className="secretos-modal__info-item">
                <dt className="secretos-modal__info-label">Actualizado</dt>
                <dd className="secretos-modal__info-value">
                  {formatSecretDate(secret.fechaActualizacion)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="modal-actions-base secretos-modal__footer secretos-modal__footer--detail">
          <button
            type="button"
            className="btn-base btn-danger secretos-modal__btn secretos-modal__btn--primary"
            onClick={onDecrypt}
            disabled={isSaving}
          >
            <LockOpenIcon aria-hidden="true" />
            Desencriptar
          </button>
          <button
            type="button"
            className="btn-base btn-secondary secretos-modal__btn"
            onClick={onEdit}
            disabled={isSaving}
          >
            <EditIcon aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            className="btn-base btn-secondary secretos-modal__btn secretos-modal__btn--danger"
            onClick={onDelete}
            disabled={isSaving}
          >
            <DeleteIcon aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default SecretoDetailModal
