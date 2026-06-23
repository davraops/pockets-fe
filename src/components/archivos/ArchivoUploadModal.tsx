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
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-panel-header">
          <h2 className="modal-panel-title" id="modal-panel-title-subir-archivo">
            Subir Archivo
          </h2>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="archivos-modal-form">
          <div className="form-group-base">
            <label htmlFor="file" className="archivos-form-label">
              Archivo *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="file"
              name="file"
              onChange={onFileSelect}
              className="archivos-form-file-input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
              required
            />
            {selectedFile && (
              <div className="archivos-file-selected">
                <span className="archivos-file-selected-icon">{getFileIcon(selectedFile.type)}</span>
                <div className="archivos-file-selected-info">
                  <span className="archivos-file-selected-name">{selectedFile.name}</span>
                  <span className="archivos-file-selected-size">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>
            )}
            <p className="archivos-form-hint">
              Tamaño máximo: 25MB. Formatos permitidos: PDF, Word, Excel, PowerPoint, texto, CSV,
              imágenes
            </p>
          </div>

          <div className="form-group-base">
            <label htmlFor="title" className="archivos-form-label">
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              className="form-input-base"
              required
              placeholder="Ej: Contrato de arrendamiento"
            />
          </div>

          <div className="form-group-base">
            <label htmlFor="description" className="archivos-form-label">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              className="form-textarea-base"
              rows={3}
              placeholder="Descripción adicional del archivo..."
            />
          </div>

          <div className="archivos-form-actions">
            <button
              type="button"
              className="archivos-form-button archivos-form-button-secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="archivos-form-button archivos-form-button-primary"
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? 'Subiendo...' : 'Subir Archivo'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default ArchivoUploadModal
