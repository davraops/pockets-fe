import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import ModalOverlay from '../ModalOverlay'
import type { FileAPI } from './archivosTypes'
import { formatFileDate, formatFileSize } from './archivosDisplayUtils'

interface ArchivoDetailModalProps {
  file: FileAPI
  isBusy: boolean
  onClose: () => void
  onEdit: () => void
  onDownload: () => void
  onDelete: () => void
}

function ArchivoDetailModal({
  file,
  isBusy,
  onClose,
  onEdit,
  onDownload,
  onDelete,
}: ArchivoDetailModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-panel-header">
          <h2 className="modal-panel-title" id="modal-panel-title-selectedfile-title">
            {file.title}
          </h2>
          <div className="archivos-modal-actions">
            <button
              className="archivos-modal-action-button"
              onClick={onDownload}
              aria-label="Descargar"
              type="button"
              disabled={isBusy}
            >
              <DownloadIcon />
            </button>
            <button
              className="archivos-modal-action-button archivos-modal-delete-button"
              onClick={onDelete}
              aria-label="Eliminar"
              type="button"
              disabled={isBusy}
            >
              <DeleteIcon />
            </button>
            <button
              className="modal-panel-close"
              onClick={onClose}
              aria-label="Cerrar"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <div className="archivos-detail-content">
          <div className="archivos-detail-section">
            <div className="archivos-detail-info-item">
              <span className="archivos-detail-label">Archivo:</span>
              <span className="archivos-detail-value">{file.file_name}</span>
            </div>
            <div className="archivos-detail-info-item">
              <span className="archivos-detail-label">Tamaño:</span>
              <span className="archivos-detail-value">{formatFileSize(file.file_size)}</span>
            </div>
            <div className="archivos-detail-info-item">
              <span className="archivos-detail-label">Tipo:</span>
              <span className="archivos-detail-value">{file.mime_type}</span>
            </div>
            {file.description && (
              <div className="archivos-detail-section">
                <h3 className="archivos-detail-label">Descripción</h3>
                <p className="archivos-detail-value">{file.description}</p>
              </div>
            )}
            <div className="archivos-detail-info-item">
              <span className="archivos-detail-label">Subido:</span>
              <span className="archivos-detail-value">{formatFileDate(file.created_at)}</span>
            </div>
          </div>

          <div className="archivos-detail-actions">
            <button
              className="archivos-detail-action-button"
              onClick={onEdit}
              disabled={isBusy}
              type="button"
            >
              <EditIcon className="archivos-detail-action-icon" />
              <span>Editar</span>
            </button>
            <button
              className="archivos-detail-action-button"
              onClick={onDownload}
              disabled={isBusy}
              type="button"
            >
              <DownloadIcon className="archivos-detail-action-icon" />
              <span>Descargar</span>
            </button>
            <button
              className="archivos-detail-action-button archivos-detail-action-button-danger"
              onClick={onDelete}
              disabled={isBusy}
              type="button"
            >
              <DeleteIcon className="archivos-detail-action-icon" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default ArchivoDetailModal
