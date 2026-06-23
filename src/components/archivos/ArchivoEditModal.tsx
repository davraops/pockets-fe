import ModalOverlay from '../ModalOverlay'
import type { FileAPI } from './archivosTypes'
import type { ArchivoMetadataFormData } from './archivosFormUtils'

interface ArchivoEditModalProps {
  file: FileAPI
  formData: ArchivoMetadataFormData
  isSaving: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
  onClose: () => void
}

function ArchivoEditModal({
  file,
  formData,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
  onClose,
}: ArchivoEditModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-panel-header">
          <h2 className="modal-panel-title" id="modal-panel-title-editar-archivo">
            Editar Archivo
          </h2>
          <button
            className="modal-panel-close"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="archivos-modal-form">
          <div className="form-group-base">
            <label htmlFor="edit-title" className="archivos-form-label">
              Título *
            </label>
            <input
              type="text"
              id="edit-title"
              name="title"
              value={formData.title}
              onChange={onChange}
              className="form-input-base"
              required
              disabled={isSaving}
              placeholder="Ej: Contrato de arrendamiento"
            />
          </div>

          <div className="form-group-base">
            <label htmlFor="edit-description" className="archivos-form-label">
              Descripción (opcional)
            </label>
            <textarea
              id="edit-description"
              name="description"
              value={formData.description}
              onChange={onChange}
              className="form-textarea-base"
              rows={3}
              disabled={isSaving}
              placeholder="Descripción adicional del archivo..."
            />
          </div>

          <p className="archivos-form-hint">
            El archivo en S3 no cambia ({file.file_name}). Solo se actualizan título y descripción.
          </p>

          <div className="archivos-form-actions">
            <button
              type="button"
              className="archivos-form-button archivos-form-button-secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="archivos-form-button archivos-form-button-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default ArchivoEditModal
