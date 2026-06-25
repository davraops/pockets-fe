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
      <div
        className="modal-panel archivos-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-editar-archivo"
      >
        <div className="archivos-modal__header">
          <div className="archivos-modal__header-copy">
            <p className="archivos-modal__kicker">Documentos · Editar</p>
            <h2 className="modal-panel-title" id="modal-title-editar-archivo">
              Editar archivo
            </h2>
            <p className="archivos-modal__subtitle">{file.file_name}</p>
          </div>
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

        <form className="archivos-modal__form" onSubmit={onSubmit} noValidate>
          <div className="modal-panel-content archivos-modal__body">
            <div className="form-group-base">
              <label htmlFor="edit-title" className="form-label-base">
                Título
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={onChange}
                className="form-input-base form-input-base--comfortable"
                required
                disabled={isSaving}
                placeholder="Ej: Contrato de arrendamiento"
              />
            </div>

            <div className="form-group-base">
              <label htmlFor="edit-description" className="form-label-base">
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
                placeholder="Notas sobre el documento…"
              />
            </div>

            <p className="archivos-modal__callout">
              El archivo almacenado no cambia. Solo se actualizan título y descripción.
            </p>
          </div>

          <div className="modal-actions-base archivos-modal__footer">
            <button
              type="button"
              className="btn-base btn-secondary archivos-modal__btn"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-base btn-accent archivos-modal__btn"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default ArchivoEditModal
