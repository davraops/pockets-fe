import type { RefObject } from 'react'
import ModalOverlay from '../ModalOverlay'
import type { ArchivoMetadataFormData } from './archivosFormUtils'
import { formatFileSize, getFileIcon } from './archivosDisplayUtils'

interface ArchivoUploadModalProps {
  formData: ArchivoMetadataFormData
  selectedFile: File | null
  isUploading: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (event: React.FormEvent) => void
  onClose: () => void
}

function ArchivoUploadModal({
  formData,
  selectedFile,
  isUploading,
  fileInputRef,
  onFileSelect,
  onChange,
  onSubmit,
  onClose,
}: ArchivoUploadModalProps) {
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel archivos-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-subir-archivo"
      >
        <div className="archivos-modal__header">
          <div className="archivos-modal__header-copy">
            <p className="archivos-modal__kicker">Documentos · Subir</p>
            <h2 className="modal-panel-title" id="modal-title-subir-archivo">
              Subir archivo
            </h2>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <form className="archivos-modal__form" onSubmit={onSubmit} noValidate>
          <div className="modal-panel-content archivos-modal__body">
            <div className="form-group-base">
              <label htmlFor="file" className="form-label-base">
                Archivo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                name="file"
                onChange={onFileSelect}
                className="archivos-modal__file-input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                required
              />
              {selectedFile ? (
                <div className="archivos-modal__file-selected">
                  <span className="archivos-modal__file-selected-icon">
                    {getFileIcon(selectedFile.type)}
                  </span>
                  <div className="archivos-modal__file-selected-copy">
                    <span className="archivos-modal__file-selected-name">{selectedFile.name}</span>
                    <span className="archivos-modal__file-selected-size">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                </div>
              ) : null}
              <p className="archivos-modal__hint">
                Máx. 50 MB · hasta 10 MB subida directa; archivos mayores usan almacenamiento seguro
                · PDF, Office, texto, CSV e imágenes
              </p>
            </div>

            <div className="form-group-base">
              <label htmlFor="title" className="form-label-base">
                Título
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={onChange}
                className="form-input-base form-input-base--comfortable"
                required
                placeholder="Ej: Contrato de arrendamiento"
              />
            </div>

            <div className="form-group-base">
              <label htmlFor="description" className="form-label-base">
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={onChange}
                className="form-textarea-base"
                rows={3}
                placeholder="Notas sobre el documento…"
              />
            </div>
          </div>

          <div className="modal-actions-base archivos-modal__footer">
            <button
              type="button"
              className="btn-base btn-secondary archivos-modal__btn"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-base btn-accent archivos-modal__btn"
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? 'Subiendo…' : 'Subir archivo'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default ArchivoUploadModal
