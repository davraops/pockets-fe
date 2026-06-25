import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ModalOverlay from '../ModalOverlay'
import type { FileAPI } from './archivosTypes'
import { formatFileDate, formatFileSize } from './archivosDisplayUtils'
import { canPreviewArchivo } from './archivosPreviewUtils'

interface ArchivoDetailModalProps {
  file: FileAPI
  isBusy: boolean
  onClose: () => void
  onEdit: () => void
  onView: () => void
  onDownload: () => void
  onDelete: () => void
}

function ArchivoDetailModal({
  file,
  isBusy,
  onClose,
  onEdit,
  onView,
  onDownload,
  onDelete,
}: ArchivoDetailModalProps) {
  const showPreview = canPreviewArchivo(file)
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel archivos-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-archivo-detalle"
      >
        <div className="archivos-modal__header">
          <div className="archivos-modal__header-copy">
            <p className="archivos-modal__kicker">Documentos · Detalle</p>
            <h2 className="modal-panel-title" id="modal-title-archivo-detalle">
              {file.title}
            </h2>
            <p className="archivos-modal__subtitle">{file.file_name}</p>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content archivos-modal__body">
          <dl className="archivos-modal__info-list">
            <div className="archivos-modal__info-item">
              <dt className="archivos-modal__info-label">Tamaño</dt>
              <dd className="archivos-modal__info-value">{formatFileSize(file.file_size)}</dd>
            </div>
            <div className="archivos-modal__info-item">
              <dt className="archivos-modal__info-label">Tipo</dt>
              <dd className="archivos-modal__info-value">{file.mime_type}</dd>
            </div>
            <div className="archivos-modal__info-item">
              <dt className="archivos-modal__info-label">Subido</dt>
              <dd className="archivos-modal__info-value">{formatFileDate(file.created_at)}</dd>
            </div>
            {file.description ? (
              <div className="archivos-modal__info-item">
                <dt className="archivos-modal__info-label">Descripción</dt>
                <dd className="archivos-modal__info-value">{file.description}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="modal-actions-base archivos-modal__footer archivos-modal__footer--detail">
          {showPreview ? (
            <button
              type="button"
              className="btn-base btn-accent archivos-modal__btn archivos-modal__btn--primary"
              onClick={onView}
              disabled={isBusy}
            >
              <VisibilityIcon aria-hidden="true" />
              Ver
            </button>
          ) : null}
          <button
            type="button"
            className={`btn-base ${showPreview ? 'btn-secondary' : 'btn-accent'} archivos-modal__btn${showPreview ? '' : ' archivos-modal__btn--primary'}`}
            onClick={onDownload}
            disabled={isBusy}
          >
            <DownloadIcon aria-hidden="true" />
            Descargar
          </button>
          <button
            type="button"
            className="btn-base btn-secondary archivos-modal__btn"
            onClick={onEdit}
            disabled={isBusy}
          >
            <EditIcon aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            className="btn-base btn-secondary archivos-modal__btn archivos-modal__btn--danger"
            onClick={onDelete}
            disabled={isBusy}
          >
            <DeleteIcon aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default ArchivoDetailModal
