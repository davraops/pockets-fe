import type { RefObject } from 'react'
import ModalOverlay from '../ModalOverlay'
import type { SecretoFormData, SecretoFormErrors, SecretoFormMode } from './secretoFormUtils'

interface SecretoFormModalProps {
  title: string
  modalTitleId: string
  mode: SecretoFormMode
  fieldIdPrefix?: string
  formData: SecretoFormData
  formErrors: SecretoFormErrors
  isSaving: boolean
  tituloRef: RefObject<HTMLInputElement | null>
  valorRef: RefObject<HTMLInputElement | null>
  overlayClassName?: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (event: React.FormEvent) => void
  onClose: () => void
}

function SecretoFormModal({
  title,
  modalTitleId,
  mode,
  fieldIdPrefix = '',
  formData,
  formErrors,
  isSaving,
  tituloRef,
  valorRef,
  overlayClassName,
  onChange,
  onSubmit,
  onClose,
}: SecretoFormModalProps) {
  const tituloId = `${fieldIdPrefix}titulo`
  const valorId = `${fieldIdPrefix}valor`
  const tituloErrorId = `${fieldIdPrefix}titulo-error`
  const valorErrorId = `${fieldIdPrefix}valor-error`
  const isEdit = mode === 'edit'

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
              placeholder="Ej: API Key de GitHub"
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
            <label htmlFor={valorId} className="form-label">
              {isEdit ? 'Nuevo Valor (Opcional)' : 'Valor'}
            </label>
            <input
              ref={valorRef}
              type="password"
              id={valorId}
              name="valor"
              value={formData.valor}
              onChange={onChange}
              className={`form-input ${formErrors.valor ? 'input-error' : ''}`}
              placeholder={
                isEdit ? 'Deja vacío para mantener el valor actual' : 'Ingresa el valor del secreto'
              }
              aria-invalid={!!formErrors.valor}
              {...(formErrors.valor ? { 'aria-describedby': valorErrorId } : {})}
            />
            {formErrors.valor && (
              <span id={valorErrorId} className="error-message" role="alert">
                {formErrors.valor}
              </span>
            )}
            <p className="form-hint">
              {isEdit
                ? '⚠️ Si proporcionas un nuevo valor, se hasheará y reemplazará el anterior. Deja vacío para mantener el valor actual.'
                : '⚠️ El valor se hasheará automáticamente y no podrá recuperarse después de guardarlo.'}
            </p>
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

export default SecretoFormModal
