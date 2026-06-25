import { useState } from 'react'
import type { RefObject } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
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
  const [changeValue, setChangeValue] = useState(false)
  const [showValue, setShowValue] = useState(false)

  const handleToggleChangeValue = () => {
    setChangeValue(previous => {
      const next = !previous
      if (!next) {
        setShowValue(false)
      } else {
        queueMicrotask(() => valorRef.current?.focus())
      }
      return next
    })
  }

  return (
    <ModalOverlay onClose={onClose} className={`modal-overlay ${overlayClassName ?? ''}`.trim()}>
      <div
        className="modal-panel secretos-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby={modalTitleId}
      >
        <div className="secretos-modal__header">
          <div className="secretos-modal__header-copy">
            <p className="secretos-modal__kicker">Vault · {isEdit ? 'Editar' : 'Nuevo'}</p>
            <h2 className="modal-panel-title" id={modalTitleId}>
              {title}
            </h2>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <form className="secretos-modal__form" onSubmit={onSubmit} noValidate>
          <div className="modal-panel-content secretos-modal__body">
            <div className="form-group-base">
              <label htmlFor={tituloId} className="form-label-base">
                Título
              </label>
              <input
                ref={tituloRef}
                type="text"
                id={tituloId}
                name="titulo"
                value={formData.titulo}
                onChange={onChange}
                className={`form-input-base form-input-base--comfortable${formErrors.titulo ? ' input-error' : ''}`}
                placeholder="Ej: API Key de GitHub"
                autoFocus
                aria-invalid={!!formErrors.titulo}
                {...(formErrors.titulo ? { 'aria-describedby': tituloErrorId } : {})}
              />
              {formErrors.titulo ? (
                <span id={tituloErrorId} className="error-message" role="alert">
                  {formErrors.titulo}
                </span>
              ) : null}
            </div>

            {isEdit ? (
              <div className="form-group-base">
                <button
                  type="button"
                  className="secretos-modal__value-toggle"
                  onClick={handleToggleChangeValue}
                  aria-expanded={changeValue}
                  aria-controls={valorId}
                >
                  {changeValue ? 'Ocultar cambio de valor' : 'Cambiar valor cifrado (opcional)'}
                </button>
                {changeValue ? (
                  <>
                    <label htmlFor={valorId} className="form-label-base">
                      Nuevo valor del secreto
                    </label>
                    <div className="secretos-decrypted-container">
                      <input
                        ref={valorRef}
                        type={showValue ? 'text' : 'password'}
                        id={valorId}
                        name="valor"
                        value={formData.valor}
                        onChange={onChange}
                        className={`form-input-base form-input-base--comfortable secretos-decrypted-input${formErrors.valor ? ' input-error' : ''}`}
                        placeholder="Nuevo contenido a cifrar y guardar"
                        autoComplete="new-password"
                        aria-invalid={!!formErrors.valor}
                        {...(formErrors.valor ? { 'aria-describedby': valorErrorId } : {})}
                      />
                      <div className="secretos-decrypted-actions">
                        <button
                          type="button"
                          className="secretos-decrypted-action-button"
                          onClick={() => setShowValue(previous => !previous)}
                          aria-label={showValue ? 'Ocultar valor' : 'Mostrar valor'}
                        >
                          {showValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </button>
                      </div>
                    </div>
                    {formErrors.valor ? (
                      <span id={valorErrorId} className="error-message" role="alert">
                        {formErrors.valor}
                      </span>
                    ) : null}
                    <p className="secretos-modal__hint">
                      No es tu contraseña de Pockets. Si lo dejas vacío, se conserva el valor actual.
                    </p>
                  </>
                ) : (
                  <p className="secretos-modal__hint">
                    Puedes editar solo el título. Para ver o cambiar el valor guardado, usa Desencriptar
                    desde el detalle.
                  </p>
                )}
              </div>
            ) : (
              <div className="form-group-base">
                <label htmlFor={valorId} className="form-label-base">
                  Valor
                </label>
                <input
                  ref={valorRef}
                  type="password"
                  id={valorId}
                  name="valor"
                  value={formData.valor}
                  onChange={onChange}
                  className={`form-input-base form-input-base--comfortable${formErrors.valor ? ' input-error' : ''}`}
                  placeholder="Valor a cifrar y guardar"
                  autoComplete="new-password"
                  aria-invalid={!!formErrors.valor}
                  {...(formErrors.valor ? { 'aria-describedby': valorErrorId } : {})}
                />
                {formErrors.valor ? (
                  <span id={valorErrorId} className="error-message" role="alert">
                    {formErrors.valor}
                  </span>
                ) : null}
                <p className="secretos-modal__callout">
                  El valor se cifra al guardar. Solo podrás verlo de nuevo desencriptando con tu contraseña.
                </p>
              </div>
            )}
          </div>

          <div className="modal-actions-base secretos-modal__footer">
            <button
              type="button"
              className="btn-base btn-secondary secretos-modal__btn"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-base btn-danger secretos-modal__btn" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default SecretoFormModal
