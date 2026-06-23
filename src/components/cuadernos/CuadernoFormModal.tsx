import type { RefObject } from 'react'
import ModalOverlay from '../ModalOverlay'
import type { CuadernoFormData, CuadernoFormErrors } from './cuadernoFormUtils'

interface CuadernoFormModalProps {
  title: string
  modalTitleId: string
  fieldIdPrefix?: string
  formData: CuadernoFormData
  formErrors: CuadernoFormErrors
  isSaving: boolean
  tituloRef: RefObject<HTMLInputElement | null>
  contenidoRef: RefObject<HTMLTextAreaElement | null>
  overlayClassName?: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (event: React.FormEvent) => void
  onClose: () => void
}

function CuadernoFormModal({
  title,
  modalTitleId,
  fieldIdPrefix = '',
  formData,
  formErrors,
  isSaving,
  tituloRef,
  contenidoRef,
  overlayClassName,
  onChange,
  onSubmit,
  onClose,
}: CuadernoFormModalProps) {
  const tituloId = `${fieldIdPrefix}titulo`
  const contenidoId = `${fieldIdPrefix}contenido`
  const tituloErrorId = `${fieldIdPrefix}titulo-error`
  const contenidoErrorId = `${fieldIdPrefix}contenido-error`

  return (
    <ModalOverlay onClose={onClose} className={`modal-overlay ${overlayClassName ?? ''}`.trim()}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id={modalTitleId}>
            {title}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal" type="button">
            ×
          </button>
        </div>
        <form className="modal-form" onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor={tituloId} className="form-label">
              Título
            </label>
            <input
              ref={tituloRef}
              type="text"
              id={tituloId}
              name="titulo"
              value={formData.titulo}
              onChange={onChange}
              className={`form-input ${formErrors.titulo ? 'input-error' : ''}`}
              placeholder="Ej: Mi primera nota"
              autoFocus
              aria-invalid={!!formErrors.titulo}
              {...(formErrors.titulo ? { 'aria-describedby': tituloErrorId } : {})}
            />
            {formErrors.titulo && (
              <span id={tituloErrorId} className="error-message" role="alert">
                {formErrors.titulo}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={contenidoId} className="form-label">
              Contenido
            </label>
            <textarea
              ref={contenidoRef}
              id={contenidoId}
              name="contenido"
              value={formData.contenido}
              onChange={onChange}
              className={`form-input form-textarea ${formErrors.contenido ? 'input-error' : ''}`}
              placeholder="Escribe el contenido de tu nota aquí..."
              rows={8}
              aria-invalid={!!formErrors.contenido}
              {...(formErrors.contenido ? { 'aria-describedby': contenidoErrorId } : {})}
            />
            {formErrors.contenido && (
              <span id={contenidoErrorId} className="error-message" role="alert">
                {formErrors.contenido}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-button secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-button primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default CuadernoFormModal
